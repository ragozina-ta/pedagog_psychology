from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import PushSubscription, User
from app.db.session import get_db
from app.deps import get_current_user
from app.schemas import PushSubIn

router = APIRouter()


@router.get("/vapid-public-key")
async def vapid_key():
    return {"publicKey": settings.vapid_public_key or ""}


@router.post("/subscribe")
async def subscribe(body: PushSubIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = (
        await db.execute(
            select(PushSubscription).where(
                PushSubscription.user_id == user.id, PushSubscription.endpoint == body.endpoint
            )
        )
    ).scalar_one_or_none()
    if existing:
        existing.p256dh = body.keys.get("p256dh", "")
        existing.auth = body.keys.get("auth", "")
    else:
        db.add(
            PushSubscription(
                user_id=user.id,
                endpoint=body.endpoint,
                p256dh=body.keys.get("p256dh", ""),
                auth=body.keys.get("auth", ""),
            )
        )
    await db.commit()
    return {"ok": True}


@router.get("/subscriptions/count")
async def count(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(PushSubscription).where(PushSubscription.user_id == user.id))
    ).scalars().all()
    return {"count": len(rows)}
