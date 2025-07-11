from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute

from app.api.main import api_router
from app.core.config import settings
from app.logger import logger


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(
    title=settings.API_PROJECT_NAME,
    openapi_url=f"{settings.API_VERSION_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_VERSION_STR)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    message = ""
    try:
        message = "\n".join(
            [f"{error['loc'][-1].title()}: {error['msg']}" for error in exc.errors()]
        )
    except Exception:  # pragma: no cover
        message = "Invalid input data"  # pragma: no cover
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"message": message}),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": f"An unexpected error has occured: {exc}"
            if settings.DEBUG
            else "Internal Server Error"
        },
    )
