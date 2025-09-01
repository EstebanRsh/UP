# backend/models/modelo.py
from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from configs.db import Base


# -----------------------------
# Enums (existentes)
# -----------------------------
class RoleEnum(str, Enum):
    gerente = "gerente"
    operador = "operador"
    cliente = "cliente"


class EstadoClienteEnum(str, Enum):
    activo = "activo"
    inactivo = "inactivo"


# -----------------------------
# Usuario (auth) - SIN CAMBIOS
# -----------------------------
class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True)
    # DNI/CUIT normalizado; puede ser NULL si sólo usa email
    documento = Column(String(11), unique=True, index=True, nullable=True)
    email = Column(String(120), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleEnum, name="role_enum"), index=True, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)


# -----------------------------
# Cliente - SIN CAMBIOS (mantiene usuario_id)
# -----------------------------
class Cliente(Base):
    __tablename__ = "cliente"

    id = Column(Integer, primary_key=True)
    # lo generamos en servicio
    nro_cliente = Column(String(16), unique=True, index=True, nullable=False)
    nombre = Column(String(80), nullable=False)
    apellido = Column(String(80), nullable=False)
    documento = Column(String(11), unique=True, index=True, nullable=False)
    telefono = Column(String(20), nullable=True)  # +549...
    email = Column(String(120), unique=True, index=True, nullable=True)
    direccion = Column(String(200), nullable=False)

    # vínculo 1:1 con Usuario para ownership
    usuario_id = Column(
        Integer,
        ForeignKey("usuario.id", ondelete="SET NULL"),
        unique=True,
        index=True,
        nullable=True,
    )

    estado = Column(
        SAEnum(EstadoClienteEnum, name="estado_cliente_enum"),
        nullable=False,
        default=EstadoClienteEnum.activo,  # default como Enum (no string)
    )
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    usuario = relationship("Usuario", backref="cliente", uselist=False)

    # Relación con Pagos
    pagos = relationship(
        "Pago",
        back_populates="cliente",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# -----------------------------
# Pagos (nuevo)
# -----------------------------
class MetodoPagoEnum(str, Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"


class EstadoPagoEnum(str, Enum):
    pendiente = "pendiente"
    en_revision = "en_revision"
    confirmado = "confirmado"
    anulado = "anulado"


class Pago(Base):
    __tablename__ = "pago"

    id = Column(Integer, primary_key=True)

    # vínculo
    cliente_id = Column(
        Integer,
        ForeignKey("cliente.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cliente = relationship("Cliente", back_populates="pagos")

    # datos del pago
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    moneda = Column(String(3), nullable=False, default="ARS")

    metodo = Column(
        SAEnum(MetodoPagoEnum, name="metodo_pago_enum"), nullable=False, index=True
    )
    estado = Column(
        SAEnum(EstadoPagoEnum, name="estado_pago_enum"),
        nullable=False,
        default=EstadoPagoEnum.pendiente,
        index=True,
    )

    # período (YYYY-MM)
    periodo_year = Column(Integer, nullable=False)
    periodo_month = Column(Integer, nullable=False)
    es_adelantado = Column(Boolean, default=False, nullable=False)

    # textos
    concepto = Column(String(160), nullable=False)
    descripcion = Column(Text, nullable=True)

    # archivos / recibo
    comprobante_path = Column(String(300), nullable=True)
    recibo_num = Column(String(32), unique=True, index=True, nullable=True)
    recibo_pdf_path = Column(String(300), nullable=True)
    recibo_snapshot_json = Column(JSON, nullable=True)

    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)


# Configuración de empresa (1 fila)
class ConfigEmpresa(Base):
    __tablename__ = "config_empresa"

    id = Column(Integer, primary_key=True, default=1)
    nombre = Column(String(120), nullable=False, default="UP-Link")
    cuit = Column(String(32), nullable=True)
    direccion = Column(String(160), nullable=True)
    ciudad = Column(String(80), nullable=True)
    contacto = Column(String(160), nullable=True)
    logo_path = Column(String(300), nullable=True)
    actualizado_en = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
