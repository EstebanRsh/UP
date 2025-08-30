# backend/routes/cliente.py
from datetime import datetime, date, time
from math import ceil
from typing import Optional, List, Literal

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr, validator  # <- validator
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, or_, case, func

from configs.db import get_db
from models.modelo import Cliente as ClienteModel, EstadoClienteEnum
from auth.roles import require_roles

Cliente = APIRouter(prefix="/clientes", tags=["Clientes"])

USE_UNACCENT = False
_TX_SRC = "ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛáàäâéèëêíìïîóòöôúùüûÑñÇç"
_TX_DST = "AAAAEEEEIIIIOOOOUUUUaaaaeeeeiiiioooouuuuNnCc"


class ClienteCreate(BaseModel):
    """Entrada para crear cliente."""

    nombre: str
    apellido: str
    documento: str = Field(max_length=11)
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: str


class ClienteUpdate(BaseModel):
    """Entrada para actualizar cliente."""

    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = Field(default=None, max_length=11)
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    estado: Optional[EstadoClienteEnum] = None

    # v1: convierte "" -> None para campos string (evita 422 por EmailStr/str vacíos)
    @validator("nombre", "apellido", "telefono", "email", "direccion", pre=True)
    def empty_to_none(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

    # documento: deja solo dígitos; si queda vacío -> None
    @validator("documento", pre=True)
    def normalize_doc(cls, v):
        if v is None:
            return None
        s = "".join(c for c in str(v) if c.isdigit())
        return s or None


class ClienteCursorRequest(BaseModel):
    """Entrada para paginado por cursor (admin)."""

    limit: int = Field(default=25, ge=1, le=100)
    last_seen_id: Optional[int] = None


class ClienteSearchRequest(BaseModel):
    """Entrada para listar clientes por POST (paginación clásica + filtros)."""

    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=200)
    buscar: Optional[str] = None
    estado: Optional[Literal["activo", "inactivo"]] = None
    creado_desde: Optional[date] = None
    creado_hasta: Optional[date] = None
    ordenar_por: Literal["id", "apellido", "nro_cliente", "creado_en"] = "id"
    orden: Literal["asc", "desc"] = "asc"
    activos_primero: bool = False


def _norm_doc(doc: Optional[str]) -> Optional[str]:
    """Normaliza documento dejando solo dígitos."""
    return "".join(c for c in doc or "" if c.isdigit()) or None


def _next_nro_cliente(db: Session) -> str:
    """Genera el próximo número de cliente con padding."""
    next_id = (db.query(func.coalesce(func.max(ClienteModel.id), 0)).scalar() or 0) + 1
    return f"{next_id:06d}"


def _ci_norm(col):
    """Expresión normalizada sin acentos + lower para comparar texto."""
    if USE_UNACCENT:
        return func.lower(func.unaccent(col))
    return func.lower(func.translate(col, _TX_SRC, _TX_DST))


@Cliente.get("/hello", summary="Probar módulo Clientes")
def hello_cliente():
    """Verifica que el router de clientes responde."""
    return "Hello Cliente!!!"


@Cliente.post("/", summary="Crear cliente")
def crear_cliente(req: Request, body: ClienteCreate, db: Session = Depends(get_db)):
    """Crea un cliente. Requiere rol gerente u operador."""
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        doc = _norm_doc(body.documento)
        if db.query(ClienteModel).filter(ClienteModel.documento == doc).first():
            return JSONResponse(
                status_code=409, content={"message": "Documento ya registrado"}
            )
        if (
            body.email
            and db.query(ClienteModel)
            .filter(ClienteModel.email == body.email.lower())
            .first()
        ):
            return JSONResponse(
                status_code=409, content={"message": "Email ya registrado"}
            )

        nro = _next_nro_cliente(db)
        nuevo = ClienteModel(
            nro_cliente=nro,
            nombre=body.nombre,
            apellido=body.apellido,
            documento=doc,
            telefono=body.telefono,
            email=body.email.lower() if body.email else None,
            direccion=body.direccion,
            estado=EstadoClienteEnum.activo,
        )
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return JSONResponse(
            status_code=201,
            content={
                "id": nuevo.id,
                "nro_cliente": nuevo.nro_cliente,
                "nombre": nuevo.nombre,
                "apellido": nuevo.apellido,
                "documento": nuevo.documento,
                "telefono": nuevo.telefono,
                "email": nuevo.email,
                "direccion": nuevo.direccion,
                "estado": (
                    nuevo.estado.value
                    if hasattr(nuevo.estado, "value")
                    else nuevo.estado
                ),
            },
        )
    except Exception:
        db.rollback()
        return JSONResponse(
            status_code=500, content={"message": "Error al crear cliente"}
        )


@Cliente.post("/search", summary="Listar clientes (POST, paginación + filtros)")
def listar_clientes(
    req: Request, body: ClienteSearchRequest, db: Session = Depends(get_db)
):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        q = db.query(ClienteModel)

        if body.buscar:
            term = body.buscar.strip().lower()
            if term.isdigit():
                q = q.filter(ClienteModel.documento.like(f"%{term}%"))
            else:
                like = f"%{term}%"
                q = q.filter(
                    or_(
                        _ci_norm(ClienteModel.nombre).like(like),
                        _ci_norm(ClienteModel.apellido).like(like),
                    )
                )

        if body.estado:
            q = q.filter(ClienteModel.estado == EstadoClienteEnum(body.estado))

        if body.creado_desde:
            q = q.filter(
                ClienteModel.creado_en >= datetime.combine(body.creado_desde, time.min)
            )
        if body.creado_hasta:
            q = q.filter(
                ClienteModel.creado_en <= datetime.combine(body.creado_hasta, time.max)
            )

        total_count = q.count()

        sort_map = {
            "id": ClienteModel.id,
            "apellido": ClienteModel.apellido,
            "nro_cliente": ClienteModel.nro_cliente,
            "creado_en": ClienteModel.creado_en,
        }
        sort_col = sort_map[body.ordenar_por]
        direction = asc if body.orden == "asc" else desc

        order_clauses = []
        if body.activos_primero:
            order_clauses.append(
                case((ClienteModel.estado == EstadoClienteEnum.activo, 0), else_=1)
            )
        order_clauses.append(direction(sort_col))
        order_clauses.append(asc(ClienteModel.id))
        q = q.order_by(*order_clauses)

        offset = (body.page - 1) * body.limit
        filas = q.offset(offset).limit(body.limit).all()

        items = [
            {
                "id": c.id,
                "nro_cliente": c.nro_cliente,
                "nombre": c.nombre,
                "apellido": c.apellido,
                "documento": c.documento,
                "telefono": c.telefono,
                "email": c.email,
                "direccion": c.direccion,
                "estado": c.estado.value if hasattr(c.estado, "value") else c.estado,
                "creado_en": c.creado_en.isoformat() if c.creado_en else None,
            }
            for c in filas
        ]

        total_pages = ceil(total_count / body.limit) if body.limit else 1
        return {
            "items": items,
            "page": body.page,
            "limit": body.limit,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_prev": body.page > 1,
            "has_next": body.page < total_pages,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error listando clientes")


@Cliente.get("/all", summary="Listar clientes (admin)")
def listar_clientes_admin(req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        rows: List[ClienteModel] = (
            db.query(ClienteModel).order_by(asc(ClienteModel.id)).all()
        )
        salida = [
            {
                "id": c.id,
                "nro_cliente": c.nro_cliente,
                "nombre": c.nombre,
                "apellido": c.apellido,
                "documento": c.documento,
                "telefono": c.telefono,
                "email": c.email,
                "direccion": c.direccion,
                "estado": c.estado.value if hasattr(c.estado, "value") else c.estado,
                "creado_en": c.creado_en.isoformat() if c.creado_en else None,
            }
            for c in rows
        ]
        return JSONResponse(status_code=200, content=salida)
    except Exception:
        return JSONResponse(
            status_code=500, content={"message": "Error al listar clientes"}
        )


@Cliente.post("/paginated", summary="Listar clientes por cursor (admin)")
def clientes_paginados(
    req: Request, body: ClienteCursorRequest, db: Session = Depends(get_db)
):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        q = db.query(ClienteModel).order_by(asc(ClienteModel.id))
        if body.last_seen_id is not None:
            q = q.filter(ClienteModel.id > body.last_seen_id)
        rows = q.limit(body.limit).all()
        salida = [
            {
                "id": c.id,
                "nro_cliente": c.nro_cliente,
                "nombre": c.nombre,
                "apellido": c.apellido,
                "documento": c.documento,
                "telefono": c.telefono,
                "email": c.email,
                "direccion": c.direccion,
                "estado": c.estado.value if hasattr(c.estado, "value") else c.estado,
                "creado_en": c.creado_en.isoformat() if c.creado_en else None,
            }
            for c in rows
        ]
        next_cursor = salida[-1]["id"] if len(salida) == body.limit else None
        return JSONResponse(
            status_code=200, content={"clientes": salida, "next_cursor": next_cursor}
        )
    except Exception:
        return JSONResponse(
            status_code=500, content={"message": "Error al paginar clientes"}
        )


@Cliente.get("/{cliente_id}", summary="Detalle de cliente")
def obtener_cliente(cliente_id: int, req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        c = db.get(ClienteModel, cliente_id)
        if not c:
            return JSONResponse(
                status_code=404, content={"message": "Cliente no encontrado"}
            )
        return JSONResponse(
            status_code=200,
            content={
                "id": c.id,
                "nro_cliente": c.nro_cliente,
                "nombre": c.nombre,
                "apellido": c.apellido,
                "documento": c.documento,
                "telefono": c.telefono,
                "email": c.email,
                "direccion": c.direccion,
                "estado": c.estado.value if hasattr(c.estado, "value") else c.estado,
                "creado_en": c.creado_en.isoformat() if c.creado_en else None,
            },
        )
    except Exception:
        return JSONResponse(
            status_code=500, content={"message": "Error al obtener cliente"}
        )


@Cliente.put("/{cliente_id}", summary="Actualizar cliente")
def actualizar_cliente(
    cliente_id: int, body: ClienteUpdate, req: Request, db: Session = Depends(get_db)
):
    """Actualiza datos del cliente y valida duplicados. Requiere rol gerente u operador.
    - Si un campo viene como `null`, se interpreta como limpiar (email/telefono).
    - Campos no presentes: se dejan sin cambios."""
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        c = db.get(ClienteModel, cliente_id)
        if not c:
            return JSONResponse(
                status_code=404, content={"message": "Cliente no encontrado"}
            )

        # detectar qué campos vinieron en el body (v1/v2)
        try:
            fields_set = set(body.__fields_set__)  # pydantic v1
        except Exception:
            fields_set = set(getattr(body, "model_fields_set", set()))  # pydantic v2

        # Documento (no se permite vaciar porque en DB es NOT NULL)
        if "documento" in fields_set:
            if body.documento is None:
                return JSONResponse(
                    status_code=400,
                    content={"message": "Documento no puede quedar vacío"},
                )
            doc = _norm_doc(body.documento)
            exists = (
                db.query(ClienteModel)
                .filter(ClienteModel.documento == doc, ClienteModel.id != cliente_id)
                .first()
            )
            if exists:
                return JSONResponse(
                    status_code=409, content={"message": "Documento ya registrado"}
                )
            c.documento = doc

        # Email (permitimos limpiar a NULL si viene explícitamente null)
        if "email" in fields_set:
            if body.email:
                email_l = body.email.lower()
                exists = (
                    db.query(ClienteModel)
                    .filter(
                        ClienteModel.email == email_l, ClienteModel.id != cliente_id
                    )
                    .first()
                )
                if exists:
                    return JSONResponse(
                        status_code=409, content={"message": "Email ya registrado"}
                    )
                c.email = email_l
            else:
                c.email = None

        # Teléfono (nullable)
        if "telefono" in fields_set:
            c.telefono = body.telefono or None

        # Dirección (NOT NULL en modelo): solo setear si no es None
        if "direccion" in fields_set and body.direccion is not None:
            c.direccion = body.direccion

        # Nombre/Apellido (NOT NULL): solo setear si no son None
        if "nombre" in fields_set and body.nombre is not None:
            c.nombre = body.nombre
        if "apellido" in fields_set and body.apellido is not None:
            c.apellido = body.apellido

        # Estado
        if "estado" in fields_set and body.estado is not None:
            c.estado = body.estado

        db.commit()
        db.refresh(c)
        return JSONResponse(status_code=200, content={"message": "Cliente actualizado"})
    except Exception:
        db.rollback()
        return JSONResponse(
            status_code=500, content={"message": "Error al actualizar cliente"}
        )


@Cliente.delete("/{cliente_id}", summary="Inactivar cliente (baja lógica)")
def eliminar_cliente(cliente_id: int, req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    try:
        c = db.get(ClienteModel, cliente_id)
        if not c:
            return JSONResponse(
                status_code=404, content={"message": "Cliente no encontrado"}
            )
        c.estado = EstadoClienteEnum.inactivo
        db.commit()
        return JSONResponse(status_code=200, content={"message": "Cliente inactivado"})
    except Exception:
        db.rollback()
        return JSONResponse(
            status_code=500, content={"message": "Error al eliminar cliente"}
        )
