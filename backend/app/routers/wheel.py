import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, WheelSnapshot
from app.db.session import get_db
from app.deps import get_current_user
from app.schemas import WheelIn, WheelOut
from app.services.activity import apply_activity

router = APIRouter()


@router.get("/history", response_model=list[WheelOut])
async def history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(WheelSnapshot)
            .where(WheelSnapshot.user_id == user.id)
            .order_by(WheelSnapshot.created_at.desc())
            .limit(24)
        )
    ).scalars().all()
    return [
        WheelOut(id=r.id, values=json.loads(r.values_json), created_at=r.created_at) for r in rows
    ]


@router.post("", response_model=WheelOut)
async def save(body: WheelIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    snap = WheelSnapshot(user_id=user.id, values_json=json.dumps(body.values))
    db.add(snap)
    await db.commit()
    await db.refresh(snap)
    await apply_activity(db, user.id, "wheel", {"values": body.values})
    return WheelOut(id=snap.id, values=body.values, created_at=snap.created_at)
