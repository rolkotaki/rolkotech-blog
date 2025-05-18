# from contextlib import asynccontextmanager
from fastapi import FastAPI
# from sqlmodel import Session

from app.api.main import api_router
from app.core.config import settings
# from app.db.db import init_db, engine


# # Initialize the database on startup
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # startup
#     with Session(engine) as session:
#         init_db(session)
#     yield
#     # shutdown


# app = FastAPI(title=settings.API_PROJECT_NAME, lifespan=lifespan)
app = FastAPI(title=settings.API_PROJECT_NAME)
app.include_router(api_router, prefix=settings.API_VERSION_STR)
