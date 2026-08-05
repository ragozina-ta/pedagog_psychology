"""Ресурс API — FastAPI backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
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


app = FastAPI(title="Ресурс API", version="1.0.0", lifespan=lifespan)

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


@app.get("/health")
async def health():
    return {"status": "ok"}
