"""Ресурс API — FastAPI backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.core.openapi import API_DESCRIPTION, API_TITLE, API_VERSION, TAGS_METADATA
from app.db.session import init_db
from app.routers import (
    activity,
    admin,
    auth,
    chat,
    compass,
    diary,
    friends,
    garden,
    profile,
    push,
    schools,
    wheel,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=TAGS_METADATA,
    contact={
        "name": "Ресурс педагога",
        "url": "https://whatislav.online",
    },
    license_info={"name": "Proprietary"},
    swagger_ui_parameters={"persistAuthorization": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = "/api"
app.include_router(auth.router, prefix=f"{api}/auth", tags=["auth"])
app.include_router(schools.router, prefix=f"{api}/schools", tags=["schools"])
app.include_router(profile.router, prefix=f"{api}/profile", tags=["profile"])
app.include_router(diary.router, prefix=f"{api}/diary", tags=["diary"])
app.include_router(wheel.router, prefix=f"{api}/wheel", tags=["wheel"])
app.include_router(activity.router, prefix=f"{api}/activity", tags=["activity"])
app.include_router(garden.router, prefix=f"{api}/garden", tags=["garden"])
app.include_router(friends.router, prefix=f"{api}/friends", tags=["friends"])
app.include_router(chat.router, prefix=f"{api}/chat", tags=["chat"])
app.include_router(admin.router, prefix=f"{api}/admin", tags=["admin"])
app.include_router(compass.router, prefix=f"{api}/compass", tags=["compass"])
app.include_router(push.router, prefix=f"{api}/push", tags=["push"])


@app.get(
    "/health",
    tags=["health"],
    summary="Health check",
    description="Проверка, что API запущен. Без авторизации.",
    response_description="Статус сервиса",
    openapi_extra={"security": []},
)
async def health():
    return {"status": "ok", "service": "resource-api", "version": API_VERSION}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=TAGS_METADATA,
        contact=app.contact,
        license_info=app.license_info,
    )
    schema["servers"] = [
        {"url": "https://whatislav.online", "description": "Production"},
        {"url": "http://127.0.0.1:8000", "description": "Local development"},
        {"url": "/", "description": "Current host"},
    ]
    # Bearer auth scheme for Swagger "Authorize"
    schema.setdefault("components", {}).setdefault("securitySchemes", {})["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Access token из /api/auth/login или /api/auth/register",
    }
    schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore[method-assign]
