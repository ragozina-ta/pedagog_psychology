from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_db
from app.deps import get_current_user
from app.schemas import ActivityIn, ActivityOut
from app.services.activity import POINTS, apply_activity

router = APIRouter()


@router.post("", response_model=ActivityOut)
async def log_activity(body: ActivityIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.kind not in POINTS:
        raise HTTPException(400, f"Неизвестный kind. Допустимо: {list(POINTS)}")
    result = await apply_activity(db, user.id, body.kind, body.meta)
    return ActivityOut(**result)
