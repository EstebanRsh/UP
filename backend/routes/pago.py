# backend/routes/pago.py
"""
Pagos - FastAPI (HTML -> PDF)
- Efectivo: confirma y genera recibo PDF con HTML/CSS (wkhtmltopdf/pdfkit) o WeasyPrint (fallback).
- Transferencia: multipart con comprobante -> en_revision -> confirmar genera PDF.
- Incluye endpoints de detalle, búsqueda paginada, actualización y anulación.
- La cabecera del recibo toma los datos de `config_empresa` (DB); si no hay registro, usa .env.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, date, time
from math import ceil
from typing import Optional, Literal

from fastapi import (
    APIRouter,
    Request,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
)
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from jinja2 import Environment, FileSystemLoader, select_autoescape

from configs.db import get_db
from models.modelo import (
    Pago as PagoModel,
    MetodoPagoEnum,
    EstadoPagoEnum,
    Cliente as ClienteModel,
)
from auth.roles import require_roles

# --------------------------------------------------------------------
# Router y configuración base
# --------------------------------------------------------------------
Pago = APIRouter(prefix="/pagos", tags=["Pagos"])

UPLOAD_ROOT = os.getenv("UPLOADS_DIR", os.path.join("backend", "uploads"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
RECIBO_SERIE = os.getenv("RECIBO_SERIE", "REC")
RECIBO_ANUAL = os.getenv("RECIBO_ANUAL", "1") == "1"  # reservado para lógicas futuras

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
RECIBO_TEMPLATE = "recibo.html"
RECIBO_CSS = os.path.join(TEMPLATE_DIR, "recibo.css")

jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


# --------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------
def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _safe_name(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", (s or "").strip()).strip("-") or "archivo"


def _ext_for(content_type: str) -> Optional[str]:
    mapping = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
    }
    return mapping.get((content_type or "").lower())


def _gen_recibo_num(db: Session, when: datetime) -> str:
    """
    Genera REC-YYYY-###### (reinicia por año).
    """
    year = when.year
    prefix = f"{RECIBO_SERIE}-{year}-"
    max_num = (
        db.query(PagoModel.recibo_num)
        .filter(PagoModel.recibo_num.like(f"{prefix}%"))
        .order_by(desc(PagoModel.recibo_num))
        .first()
    )
    next_n = 1
    if max_num and max_num[0]:
        try:
            seq = int(max_num[0].split("-")[-1])
            next_n = seq + 1
        except Exception:
            next_n = 1
    return f"{prefix}{str(next_n).zfill(6)}"


def _save_comprobante_bytes(
    cliente_id: int, filename: str, content_type: str, data: bytes
) -> str:
    if not content_type:
        raise HTTPException(status_code=422, detail="Comprobante sin content-type")

    ext = _ext_for(content_type)
    if not ext:
        raise HTTPException(
            status_code=422, detail="Formato de comprobante no permitido (PDF/JPG/PNG)"
        )
    if not data or len(data) == 0:
        raise HTTPException(status_code=422, detail="Comprobante vacío")
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Comprobante supera el tamaño máximo"
        )

    folder = os.path.join(
        UPLOAD_ROOT, "comprobantes", str(cliente_id), str(datetime.utcnow().year)
    )
    _ensure_dir(folder)
    fname = _safe_name(os.path.splitext(filename or "comprobante")[0])
    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    path = os.path.join(folder, f"{fname}-{stamp}{ext}")
    with open(path, "wb") as f:
        f.write(data)
    return path


# -------------------- configuración de empresa ----------------------
def _company_ctx() -> dict:
    """
    Fallback a variables de entorno si no hay registro en DB.
    """
    return {
        "company_name": os.getenv("COMPANY_NAME", "UP-Link"),
        "company_dni": os.getenv("COMPANY_CUIT", "00-00000000-0"),
        "company_address": os.getenv("COMPANY_ADDR", "parana"),
        "company_city": os.getenv("COMPANY_CITY", ""),
        "company_contact": os.getenv("COMPANY_CONTACT", ""),
        "logo_path": os.getenv(
            "COMPANY_LOGO_PATH", os.path.join(BASE_DIR, "assets", "logo.png")
        ),
    }


def _company_ctx_db(db: Session) -> dict:
    """
    Lee configuración de empresa desde DB (tabla config_empresa).
    Si no existe, usa _company_ctx().
    """
    from models.modelo import ConfigEmpresa

    c = db.get(ConfigEmpresa, 1)
    if not c:
        return _company_ctx()
    return {
        "company_name": c.nombre or os.getenv("COMPANY_NAME", "UP-Link"),
        "company_dni": c.cuit or os.getenv("COMPANY_CUIT", "00-00000000-0"),
        "company_address": c.direccion or os.getenv("COMPANY_ADDR", "parana"),
        "company_city": c.ciudad or os.getenv("COMPANY_CITY", ""),
        "company_contact": c.contacto or os.getenv("COMPANY_CONTACT", ""),
        "logo_path": c.logo_path
        or os.getenv("COMPANY_LOGO_PATH", os.path.join(BASE_DIR, "assets", "logo.png")),
    }


def _render_pdf_from_html(path_pdf: str, html_str: str):
    """
    Intenta generar PDF con wkhtmltopdf (pdfkit). Si falla, usa WeasyPrint.
    Si nada está disponible, levanta 500 con mensaje claro.
    """
    _ensure_dir(os.path.dirname(path_pdf))

    # 1) pdfkit (wkhtmltopdf)
    try:
        import pdfkit  # pip install pdfkit

        wkhtml_bin = os.getenv("WKHTMLTOPDF_BIN")  # opcional: ruta absoluta
        config = pdfkit.configuration(wkhtmltopdf=wkhtml_bin) if wkhtml_bin else None
        options = {
            "encoding": "UTF-8",
            "enable-local-file-access": None,  # permitir CSS/IMG locales
            "print-media-type": None,
            "margin-top": "10mm",
            "margin-right": "10mm",
            "margin-bottom": "10mm",
            "margin-left": "10mm",
        }
        pdfkit.from_string(
            html_str, path_pdf, css=RECIBO_CSS, options=options, configuration=config
        )
        return
    except Exception:
        pass  # intentar fallback

    # 2) WeasyPrint
    try:
        from weasyprint import HTML, CSS  # pip install WeasyPrint

        HTML(string=html_str, base_url=TEMPLATE_DIR).write_pdf(
            path_pdf, stylesheets=[CSS(filename=RECIBO_CSS)]
        )
        return
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudo generar el PDF. Instalar uno de: "
                "`pip install pdfkit` + wkhtmltopdf (binario del sistema), "
                "o `pip install WeasyPrint`."
            ),
        )


def _build_receipt_context(
    db: Session, cli: ClienteModel, pago: PagoModel, now: datetime
) -> dict:
    """
    Mapea datos de empresa, cliente y pago al contexto de la plantilla Jinja.
    Recibo minimalista (sin teléfono/email/domicilio).
    """
    company = _company_ctx_db(db)
    currency_symbol = os.getenv("CURRENCY_SYMBOL", "$")
    metodo_label = (
        "Efectivo" if pago.metodo == MetodoPagoEnum.efectivo else "Transferencia"
    )

    client_name = (
        f"{(cli.apellido or '').strip()}, {(cli.nombre or '').strip()}"
    ).strip(", ")

    return {
        **company,
        "receipt_number": pago.recibo_num,
        "payment_date": now.strftime("%Y-%m-%d %H:%M"),
        "item_description": pago.concepto,
        "base_amount": float(pago.monto),
        "late_fee": 0.0,  # reservado
        "total_paid": float(pago.monto),
        "due_date": f"{pago.periodo_year}-{str(pago.periodo_month).zfill(2)}",
        "payment_method": metodo_label,
        "currency_symbol": currency_symbol,
        "client_name": client_name,
        "client_dni": cli.documento or "-",
        "client_nro": getattr(cli, "nro_cliente", "") or "",
    }


# --------------------------------------------------------------------
# Schemas Pydantic (tipado sin llamadas en anotaciones)
# --------------------------------------------------------------------
class PagoBase(BaseModel):
    cliente_id: int
    monto: float = Field(..., gt=0)
    moneda: Literal["ARS"] = "ARS"
    periodo_year: int = Field(..., ge=2000, le=2100)
    periodo_month: int = Field(..., ge=1, le=12)
    es_adelantado: bool = False
    concepto: str = Field(..., min_length=2, max_length=160)
    descripcion: Optional[str] = None


class PagoCreateEfectivo(PagoBase):
    metodo: Literal["efectivo"] = "efectivo"


class PagoCreateTransferencia(PagoBase):
    metodo: Literal["transferencia"] = "transferencia"


class PagoUpdate(BaseModel):
    monto: Optional[float] = Field(None, gt=0)
    moneda: Optional[Literal["ARS"]] = None
    periodo_year: Optional[int] = Field(None, ge=2000, le=2100)
    periodo_month: Optional[int] = Field(None, ge=1, le=12)
    es_adelantado: Optional[bool] = None
    concepto: Optional[str] = Field(None, min_length=2, max_length=160)
    descripcion: Optional[str] = None


class PagoSearch(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=200)
    cliente_id: Optional[int] = None
    metodo: Optional[Literal["efectivo", "transferencia"]] = None
    estado: Optional[Literal["pendiente", "en_revision", "confirmado", "anulado"]] = (
        None
    )
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    monto_min: Optional[float] = None
    monto_max: Optional[float] = None
    ordenar_por: Literal["fecha", "monto", "periodo"] = "fecha"
    orden: Literal["asc", "desc"] = "desc"


class MotivoAnulacion(BaseModel):
    motivo: str = Field(min_length=3, max_length=300)


# --------------------------------------------------------------------
# Rutas
# --------------------------------------------------------------------
@Pago.post("/efectivo", summary="Registrar pago en efectivo (confirma + PDF)")
def registrar_efectivo(
    req: Request, body: PagoCreateEfectivo, db: Session = Depends(get_db)
):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard

    cli = db.get(ClienteModel, body.cliente_id)
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    now = datetime.utcnow()
    pago = PagoModel(
        cliente_id=cli.id,
        fecha=now,
        monto=body.monto,
        moneda=body.moneda,
        metodo=MetodoPagoEnum.efectivo,
        estado=EstadoPagoEnum.confirmado,
        periodo_year=body.periodo_year,
        periodo_month=body.periodo_month,
        es_adelantado=body.es_adelantado,
        concepto=body.concepto,
        descripcion=body.descripcion,
    )
    pago.recibo_num = _gen_recibo_num(db, now)

    out_dir = os.path.join(UPLOAD_ROOT, "recibos", str(now.year), f"{now.month:02d}")
    _ensure_dir(out_dir)
    fname = f"{pago.recibo_num}__{_safe_name(cli.apellido)}-{_safe_name(cli.nombre)}__{body.periodo_year}-{str(body.periodo_month).zfill(2)}.pdf"
    path_pdf = os.path.join(out_dir, fname)

    # Render HTML -> PDF
    tpl = jinja_env.get_template(RECIBO_TEMPLATE)
    ctx = _build_receipt_context(db, cli, pago, now)
    html = tpl.render(**ctx)
    _render_pdf_from_html(path_pdf, html)

    pago.recibo_pdf_path = os.path.abspath(path_pdf)
    pago.recibo_snapshot_json = ctx

    db.add(pago)
    db.commit()
    db.refresh(pago)

    return {
        "id": pago.id,
        "estado": pago.estado.value,
        "recibo_num": pago.recibo_num,
        "recibo_pdf_url": f"/pagos/{pago.id}/recibo.pdf",
    }


@Pago.post(
    "/transferencia",
    summary="Registrar pago por transferencia (en revisión; requiere comprobante)",
)
async def registrar_transferencia(
    req: Request,
    cliente_id: int = Form(...),
    monto: float = Form(...),
    moneda: str = Form("ARS"),
    periodo_year: int = Form(...),
    periodo_month: int = Form(...),
    es_adelantado: bool = Form(False),
    concepto: str = Form(...),
    descripcion: Optional[str] = Form(None),
    comprobante: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard

    if monto <= 0:
        raise HTTPException(status_code=422, detail="Monto debe ser > 0")
    if not (1 <= periodo_month <= 12):
        raise HTTPException(status_code=422, detail="Mes inválido")
    if moneda != "ARS":
        raise HTTPException(status_code=422, detail="Moneda inválida")

    cli = db.get(ClienteModel, cliente_id)
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    data = await comprobante.read()
    path_comp = _save_comprobante_bytes(
        cli.id,
        comprobante.filename or "comprobante",
        comprobante.content_type or "",
        data,
    )

    pago = PagoModel(
        cliente_id=cli.id,
        fecha=datetime.utcnow(),
        monto=monto,
        moneda=moneda,
        metodo=MetodoPagoEnum.transferencia,
        estado=EstadoPagoEnum.en_revision,
        periodo_year=periodo_year,
        periodo_month=periodo_month,
        es_adelantado=es_adelantado,
        concepto=concepto,
        descripcion=descripcion,
        comprobante_path=os.path.abspath(path_comp),
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)
    return {"id": pago.id, "estado": pago.estado.value}


@Pago.put("/{pago_id}/confirmar", summary="Confirmar pago (genera PDF)")
def confirmar_pago(pago_id: int, req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard

    pago = db.get(PagoModel, pago_id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    if pago.estado == EstadoPagoEnum.confirmado:
        raise HTTPException(status_code=409, detail="El pago ya está confirmado")
    if pago.estado == EstadoPagoEnum.anulado:
        raise HTTPException(
            status_code=409, detail="No se puede confirmar un pago anulado"
        )

    cli = db.get(ClienteModel, pago.cliente_id)
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    now = datetime.utcnow()
    pago.estado = EstadoPagoEnum.confirmado
    if not pago.recibo_num:
        pago.recibo_num = _gen_recibo_num(db, now)

    out_dir = os.path.join(UPLOAD_ROOT, "recibos", str(now.year), f"{now.month:02d}")
    _ensure_dir(out_dir)
    fname = f"{pago.recibo_num}__{_safe_name(cli.apellido)}-{_safe_name(cli.nombre)}__{pago.periodo_year}-{str(pago.periodo_month).zfill(2)}.pdf"
    path_pdf = os.path.join(out_dir, fname)

    tpl = jinja_env.get_template(RECIBO_TEMPLATE)
    ctx = _build_receipt_context(db, cli, pago, now)
    html = tpl.render(**ctx)
    _render_pdf_from_html(path_pdf, html)

    pago.recibo_pdf_path = os.path.abspath(path_pdf)
    pago.recibo_snapshot_json = ctx

    db.commit()
    db.refresh(pago)

    return {
        "message": "Pago confirmado",
        "recibo_num": pago.recibo_num,
        "recibo_pdf_url": f"/pagos/{pago.id}/recibo.pdf",
    }


@Pago.put("/{pago_id}", summary="Actualizar pago (ver reglas por estado)")
def actualizar_pago(
    pago_id: int, req: Request, body: PagoUpdate, db: Session = Depends(get_db)
):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard

    pago = db.get(PagoModel, pago_id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if pago.estado == EstadoPagoEnum.confirmado:
        if body.descripcion is None:
            raise HTTPException(
                status_code=409,
                detail="Pago confirmado: sólo puede editar descripcion",
            )
        pago.descripcion = body.descripcion
    else:
        if body.monto is not None:
            if body.monto <= 0:
                raise HTTPException(status_code=422, detail="Monto debe ser > 0")
            pago.monto = body.monto
        if body.moneda is not None:
            if body.moneda != "ARS":
                raise HTTPException(status_code=422, detail="Moneda inválida")
            pago.moneda = body.moneda
        if body.periodo_year is not None:
            pago.periodo_year = body.periodo_year
        if body.periodo_month is not None:
            if not (1 <= body.periodo_month <= 12):
                raise HTTPException(status_code=422, detail="Mes inválido")
            pago.periodo_month = body.periodo_month
        if body.es_adelantado is not None:
            pago.es_adelantado = body.es_adelantado
        if body.concepto is not None:
            pago.concepto = body.concepto
        if body.descripcion is not None:
            pago.descripcion = body.descripcion

    db.commit()
    return {"message": "Pago actualizado"}


@Pago.delete("/{pago_id}", summary="Anular pago (requiere motivo)")
def anular_pago(
    pago_id: int, req: Request, body: MotivoAnulacion, db: Session = Depends(get_db)
):
    # Regla: si está confirmado, sólo gerente puede anular
    from auth.roles import parse_roles_from_headers

    roles = parse_roles_from_headers(req.headers)

    pago = db.get(PagoModel, pago_id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if pago.estado == EstadoPagoEnum.confirmado and "gerente" not in roles:
        return JSONResponse(
            status_code=403,
            content={"message": "Solo gerente puede anular pagos confirmados"},
        )
    if pago.estado == EstadoPagoEnum.anulado:
        raise HTTPException(status_code=409, detail="El pago ya está anulado")

    pago.estado = EstadoPagoEnum.anulado
    db.commit()
    return {"message": f"Pago anulado. Motivo: {body.motivo}"}


@Pago.get("/{pago_id}", summary="Detalle de pago")
def obtener_pago(pago_id: int, req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador", "cliente"})
    if guard:
        return guard

    pago = db.get(PagoModel, pago_id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    from auth.roles import parse_roles_from_headers, parse_user_from_headers

    roles = parse_roles_from_headers(req.headers)
    user = parse_user_from_headers(req.headers)
    if "cliente" in roles and user and getattr(user, "cliente_id", None):
        if user.cliente_id != pago.cliente_id:
            return JSONResponse(status_code=403, content={"message": "No autorizado"})

    return {
        "id": pago.id,
        "cliente_id": pago.cliente_id,
        "fecha": pago.fecha.isoformat(),
        "monto": float(pago.monto),
        "moneda": pago.moneda,
        "metodo": pago.metodo.value,
        "estado": pago.estado.value,
        "periodo_year": pago.periodo_year,
        "periodo_month": pago.periodo_month,
        "es_adelantado": pago.es_adelantado,
        "concepto": pago.concepto,
        "descripcion": pago.descripcion,
        "comprobante": (
            f"/pagos/{pago.id}/comprobante" if pago.comprobante_path else None
        ),
        "recibo_num": pago.recibo_num,
        "recibo_pdf": f"/pagos/{pago.id}/recibo.pdf" if pago.recibo_pdf_path else None,
    }


@Pago.post("/search", summary="Buscar pagos (paginación + filtros)")
def buscar_pagos(req: Request, body: PagoSearch, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard

    q = db.query(PagoModel)

    if body.cliente_id:
        q = q.filter(PagoModel.cliente_id == body.cliente_id)
    if body.metodo:
        q = q.filter(PagoModel.metodo == MetodoPagoEnum(body.metodo))
    if body.estado:
        q = q.filter(PagoModel.estado == EstadoPagoEnum(body.estado))
    if body.fecha_desde:
        q = q.filter(PagoModel.fecha >= datetime.combine(body.fecha_desde, time.min))
    if body.fecha_hasta:
        q = q.filter(PagoModel.fecha <= datetime.combine(body.fecha_hasta, time.max))
    if body.monto_min is not None:
        q = q.filter(PagoModel.monto >= body.monto_min)
    if body.monto_max is not None:
        q = q.filter(PagoModel.monto <= body.monto_max)

    if body.ordenar_por == "fecha":
        sort_col = PagoModel.fecha
    elif body.ordenar_por == "monto":
        sort_col = PagoModel.monto
    else:  # periodo
        sort_col = (PagoModel.periodo_year, PagoModel.periodo_month)

    direction = asc if body.orden == "asc" else desc
    if isinstance(sort_col, tuple):
        q = q.order_by(*[direction(c) for c in sort_col])
    else:
        q = q.order_by(direction(sort_col), desc(PagoModel.id))

    total_count = q.count()
    offset = (body.page - 1) * body.limit
    filas = q.offset(offset).limit(body.limit).all()

    items = [
        {
            "id": p.id,
            "cliente_id": p.cliente_id,
            "fecha": p.fecha.isoformat(),
            "monto": float(p.monto),
            "moneda": p.moneda,
            "metodo": p.metodo.value,
            "estado": p.estado.value,
            "periodo_year": p.periodo_year,
            "periodo_month": p.periodo_month,
            "es_adelantado": p.es_adelantado,
            "concepto": p.concepto,
        }
        for p in filas
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


@Pago.get("/{pago_id}/recibo.pdf", summary="Descargar recibo PDF")
def descargar_recibo(pago_id: int, req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador", "cliente"})
    if guard:
        return guard

    pago = db.get(PagoModel, pago_id)
    if not pago or not pago.recibo_pdf_path:
        raise HTTPException(status_code=404, detail="Recibo no disponible")

    from auth.roles import parse_roles_from_headers, parse_user_from_headers

    roles = parse_roles_from_headers(req.headers)
    user = parse_user_from_headers(req.headers)
    if "cliente" in roles and user and getattr(user, "cliente_id", None):
        if user.cliente_id != pago.cliente_id:
            return JSONResponse(status_code=403, content={"message": "No autorizado"})

    if not os.path.isfile(pago.recibo_pdf_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(
        pago.recibo_pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pago.recibo_pdf_path),
    )


@Pago.get("/{pago_id}/comprobante", summary="Descargar comprobante")
def descargar_comprobante(pago_id: int, req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard

    pago = db.get(PagoModel, pago_id)
    if not pago or not pago.comprobante_path:
        raise HTTPException(status_code=404, detail="Comprobante no disponible")

    if not os.path.isfile(pago.comprobante_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    mt = "application/pdf"
    lp = pago.comprobante_path.lower()
    if lp.endswith(".jpg") or lp.endswith(".jpeg"):
        mt = "image/jpeg"
    elif lp.endswith(".png"):
        mt = "image/png"

    return FileResponse(
        pago.comprobante_path,
        media_type=mt,
        filename=os.path.basename(pago.comprobante_path),
    )
