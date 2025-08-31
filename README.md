# UP-Core — ISP Manager (Backend FastAPI)

> **Estado actual (foco)**: Autenticación (usuarios, roles, token) y **Clientes**.  
> **En preparación**: **Pagos** (según `docs/PAGOS.md`).  
> **Ignorar/Deprecado por ahora**: Planes, Contratos, Facturas (documentación antigua).

## Stack

- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **DB**: PostgreSQL
- **Auth**: JWT con roles (`gerente`, `operador`, `cliente`)
- **Python**: 3.12+

---

## 1) Requisitos

- Python 3.12+
- PostgreSQL 15+
- (Opcional) pgAdmin

## 2) Instalación rápida

```bash
# Crear entorno (recomendado)
conda create -n api_core python=3.12 -y
conda activate api_core

# Dependencias mínimas
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv PyJWT pydantic
pip install "pydantic[email]"  # si usás EmailStr en Pydantic
```
