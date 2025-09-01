from __future__ import annotations
import os, re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from configs.db import get_db
from models.modelo import ConfigEmpresa
from auth.roles import require_roles

Config = APIRouter(prefix="/config", tags=["Configuración"])
UPLOAD_ROOT = os.getenv("UPLOADS_DIR", os.path.join("backend", "uploads"))


def _ensure_dir(p: str):
    os.makedirs(p, exist_ok=True)


def _safe(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", (s or "").strip()).strip("-") or "logo"


class EmpresaDTO(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    cuit: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    contacto: Optional[str] = None
    logo_path: Optional[str] = None


def _get_singleton(db: Session) -> ConfigEmpresa:
    cfg = db.get(ConfigEmpresa, 1)
    if not cfg:
        cfg = ConfigEmpresa(id=1)
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@Config.get("/empresa", summary="Obtener configuración de empresa")
def get_empresa(req: Request, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente", "operador"})
    if guard:
        return guard
    c = _get_singleton(db)
    return {
        "nombre": c.nombre,
        "cuit": c.cuit,
        "direccion": c.direccion,
        "ciudad": c.ciudad,
        "contacto": c.contacto,
        "logo_path": c.logo_path,
    }


@Config.put("/empresa", summary="Actualizar configuración (solo gerente)")
def put_empresa(req: Request, body: EmpresaDTO, db: Session = Depends(get_db)):
    guard = require_roles(req.headers, {"gerente"})
    if guard:
        return guard
    c = _get_singleton(db)
    c.nombre = body.nombre
    c.cuit = body.cuit
    c.direccion = body.direccion
    c.ciudad = body.ciudad
    c.contacto = body.contacto
    c.logo_path = body.logo_path
    db.commit()
    return {"message": "Configuración actualizada"}


@Config.post("/empresa/logo", summary="Subir nuevo logo (solo gerente)")
async def upload_logo(
    req: Request, archivo: UploadFile = File(...), db: Session = Depends(get_db)
):
    guard = require_roles(req.headers, {"gerente"})
    if guard:
        return guard

    data = await archivo.read()
    if not data:
        raise HTTPException(status_code=422, detail="Archivo vacío")
    ext = os.path.splitext(archivo.filename or "")[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".svg"):
        raise HTTPException(status_code=422, detail="Solo PNG/JPG/SVG")

    folder = os.path.join(UPLOAD_ROOT, "assets")
    _ensure_dir(folder)
    name = f"company-logo-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
    path = os.path.join(folder, _safe(name))
    with open(path, "wb") as f:
        f.write(data)

    c = _get_singleton(db)
    c.logo_path = path
    db.commit()
    return {"message": "Logo actualizado", "logo_path": path}
