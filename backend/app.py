import sys

sys.tracebacklimit = 1
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from configs.db import Base, engine
import models.modelo
from routes.usuario import Usuario
from routes.cliente import Cliente
from routes.pago import Pago
from routes.config import Config as ConfigRouter


api_upcore = FastAPI()


@api_upcore.get("/")
def helloworld():
    return "hello world"


@api_upcore.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


api_upcore.include_router(Usuario)
api_upcore.include_router(Cliente)
api_upcore.include_router(Pago)
api_upcore.include_router(ConfigRouter)

api_upcore.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# conda activate api_core

# uvicorn app:api_upcore --reload
