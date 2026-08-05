from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DiaryEntry, User
from app.db.session import get_db
from app.deps import get_current_user
from app.schemas import DiaryIn, DiaryOut
from app.services.activity import apply_activity

router = APIRouter()


@router.get("", response_model=list[DiaryOut])
async def list_entries(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(90, le=365),
):
    rows = (
        await db.execute(
            select(DiaryEntry)
            .where(DiaryEntry.user_id == user.id)
            .order_by(DiaryEntry.entry_date.desc())
            .limit(limit)
        )
    ).scalars().all()
    return rows


@router.get("/{entry_date}", response_model=DiaryOut | None)
async def get_day(entry_date: date, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return (
        await db.execute(
            select(DiaryEntry).where(DiaryEntry.user_id == user.id, DiaryEntry.entry_date == entry_date)
        )
    ).scalar_one_or_none()


@router.put("", response_model=DiaryOut)
async def upsert(body: DiaryIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    d = body.entry_date or date.today()
    entry = (
        await db.execute(
            select(DiaryEntry).where(DiaryEntry.user_id == user.id, DiaryEntry.entry_date == d)
        )
    ).scalar_one_or_none()
    is_new_meaningful = False
    if not entry:
        entry = DiaryEntry(user_id=user.id, entry_date=d)
        db.add(entry)
        is_new_meaningful = True
    entry.mood = body.mood
    entry.gratitude = body.gratitude
    entry.reflection = body.reflection
    entry.intention = body.intention
    await db.commit()
    await db.refresh(entry)
    # Award if there is some text content
    if (body.gratitude.strip() or body.reflection.strip()) and is_new_meaningful:
        await apply_activity(db, user.id, "diary")
    elif body.gratitude.strip() or body.reflection.strip():
        # first meaningful save of the day even if row existed empty
        await apply_activity(db, user.id, "diary")
    return entry
