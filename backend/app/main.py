import logging
import re

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.routes import attendance as attendance_routes
from app.routes import auth as auth_routes
from app.routes import users as users_routes


logger = logging.getLogger("cybrella-time")
logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cybrella Time API",
        version="0.1.0",
        description="Internal HR time-attendance service.",
    )

    cors_origins = [settings.FRONTEND_URL]
    vercel_preview = re.compile(r"^https://cybrella-time-[\w-]+\.vercel\.app$")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=vercel_preview.pattern,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth_routes.router)
    app.include_router(users_routes.router)
    app.include_router(attendance_routes.router)

    @app.exception_handler(StarletteHTTPException)
    async def http_exc_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail or "request failed"},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exc_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": "validation_error", "details": exc.errors()},
        )

    @app.exception_handler(IntegrityError)
    async def integrity_exc_handler(_: Request, exc: IntegrityError) -> JSONResponse:
        logger.warning("integrity error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": "constraint_violation"},
        )

    @app.exception_handler(Exception)
    async def unhandled_exc_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_server_error"},
        )

    return app


app = create_app()
