from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import CompassMessage, User
from app.db.session import get_db
from app.deps import get_current_user
from app.schemas import CompassIn, CompassOut
from app.services.compass import ALARM, ask_llm

router = APIRouter()


@router.post("/chat", response_model=CompassOut)
async def chat(body: CompassIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db.add(CompassMessage(user_id=user.id, role="user", content=body.message))
    history_rows = (
        await db.execute(
            select(CompassMessage)
            .where(CompassMessage.user_id == user.id)
            .order_by(CompassMessage.created_at.desc())
            .limit(12)
        )
    ).scalars().all()
    history = [{"role": m.role, "content": m.content} for m in reversed(history_rows)]
    reply = await ask_llm(history, body.message, urgent=body.urgent)
    if body.urgent:
        reply = ALARM
    db.add(CompassMessage(user_id=user.id, role="assistant", content=reply))
    await db.commit()
    return CompassOut(reply=reply, urgent=body.urgent)


@router.get("/history")
async def history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(CompassMessage)
            .where(CompassMessage.user_id == user.id)
            .order_by(CompassMessage.created_at.asc())
            .limit(100)
        )
    ).scalars().all()
    return [{"role": r.role, "content": r.content, "created_at": r.created_at.isoformat()} for r in rows]
