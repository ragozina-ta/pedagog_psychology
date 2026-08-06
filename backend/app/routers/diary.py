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
    limit: int = Query(200, le=500),
):
    rows = (
        await db.execute(
            select(DiaryEntry)
            .where(DiaryEntry.user_id == user.id)
            .order_by(DiaryEntry.entry_date.desc(), DiaryEntry.id.desc())
            .limit(limit)
        )
    ).scalars().all()
    return rows


@router.get("/day/{entry_date}", response_model=list[DiaryOut])
async def list_day(entry_date: date, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return (
        await db.execute(
            select(DiaryEntry)
            .where(DiaryEntry.user_id == user.id, DiaryEntry.entry_date == entry_date)
            .order_by(DiaryEntry.id.desc())
        )
    ).scalars().all()


@router.put("", response_model=DiaryOut)
async def create_entry(body: DiaryIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Всегда создаёт новую запись (в один день может быть несколько)."""
    d = body.entry_date or date.today()
    entry = DiaryEntry(
        user_id=user.id,
        entry_date=d,
        mood=body.mood,
        gratitude=body.gratitude,
        reflection=body.reflection,
        intention=body.intention,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    if body.gratitude.strip() or body.reflection.strip() or body.intention.strip():
        await apply_activity(db, user.id, "diary")
    return entry
