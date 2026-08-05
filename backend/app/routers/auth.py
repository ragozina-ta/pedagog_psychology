from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.db.models import Membership, Profile, School, User
from app.db.session import get_db
from app.schemas import LoginIn, RegisterIn, TokenOut

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenOut,
    summary="Регистрация",
    description=(
        "Создаёт пользователя. Укажите `create_school_name` (роль admin) "
        "или `school_code` (роль teacher)."
    ),
    openapi_extra={"security": []},
)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    exists = (await db.execute(select(User).where(User.email == body.email.lower()))).scalar_one_or_none()
    if exists:
        raise HTTPException(400, "Email уже зарегистрирован")
    if not body.create_school_name and not body.school_code:
        raise HTTPException(400, "Укажите код школы или создайте школу")

    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
    )
    db.add(user)
    await db.flush()
    db.add(Profile(user_id=user.id))

    if body.create_school_name:
        school = School(name=body.create_school_name.strip())
        db.add(school)
        await db.flush()
        db.add(Membership(user_id=user.id, school_id=school.id, role="admin"))
    else:
        school = (
            await db.execute(select(School).where(School.invite_code == body.school_code.strip().upper()))
        ).scalar_one_or_none()
        if not school:
            raise HTTPException(404, "Школа с таким кодом не найдена")
        db.add(Membership(user_id=user.id, school_id=school.id, role="teacher"))

    await db.commit()
    return TokenOut(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Вход",
    description="Возвращает JWT access и refresh токены.",
    openapi_extra={"security": []},
)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.email == body.email.lower()))).scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    return TokenOut(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
