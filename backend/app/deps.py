from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import decode_token
from app.db.models import Membership, Profile, User
from app.db.session import get_db

security = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")
    payload = decode_token(creds.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")
    user_id = int(payload["sub"])
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.profile), selectinload(User.membership).selectinload(Membership.school))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.membership or user.membership.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора школы")
    return user


async def ensure_profile(db: AsyncSession, user: User) -> Profile:
    if user.profile:
        return user.profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    user.profile = profile
    return profile
