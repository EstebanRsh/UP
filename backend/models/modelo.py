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
)
from sqlalchemy.orm import relationship

from configs.db import Base


# -----------------------------
# Enums
# -----------------------------
class RoleEnum(str, Enum):
    gerente = "gerente"
    operador = "operador"
    cliente = "cliente"


class EstadoClienteEnum(str, Enum):
    activo = "activo"
    inactivo = "inactivo"


# -----------------------------
# Usuario (auth)
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
# Cliente
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
