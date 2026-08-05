from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Membership, School, User
from app.db.session import get_db
from app.deps import get_current_user, require_admin
from app.schemas import SchoolOut

router = APIRouter()


@router.get("/me", response_model=SchoolOut)
async def my_school(user: User = Depends(get_current_user)):
    if not user.membership:
        raise HTTPException(404, "Вы не привязаны к школе")
    return user.membership.school


@router.post("/join/{code}", response_model=SchoolOut)
async def join_school(code: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.membership:
        raise HTTPException(400, "Вы уже в школе")
    school = (
        await db.execute(select(School).where(School.invite_code == code.strip().upper()))
    ).scalar_one_or_none()
    if not school:
        raise HTTPException(404, "Код не найден")
    db.add(Membership(user_id=user.id, school_id=school.id, role="teacher"))
    await db.commit()
    return school


@router.get("/invite-code", response_model=SchoolOut)
async def invite(user: User = Depends(require_admin)):
    return user.membership.school
