import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Achievement, Membership, Praise, Profile, User, UserAchievement
from app.db.session import get_db
from app.deps import ensure_profile, get_current_user
from app.schemas import AchievementOut, ProfileOut, ProfileUpdate, SchoolOut
from app.services.activity import level_from_points

router = APIRouter()


def serialize_profile(user: User) -> ProfileOut:
    p = user.profile
    assert p
    school = None
    role = None
    if user.membership:
        role = user.membership.role
        school = SchoolOut.model_validate(user.membership.school)
    return ProfileOut(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role,
        school=school,
        avatar_url=p.avatar_url,
        years_experience=p.years_experience,
        points=p.points,
        streak=p.streak,
        water_drops=p.water_drops,
        garden_plants=p.garden_plants,
        level=level_from_points(p.points),
        share_token=p.share_token,
        favorite_affirmations=json.loads(p.favorite_affirmations or "[]"),
        favorite_resources=json.loads(p.favorite_resources or "[]"),
        last_activity_date=p.last_activity_date,
    )


@router.get("/me", response_model=ProfileOut)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await ensure_profile(db, user)
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(selectinload(User.profile), selectinload(User.membership).selectinload(Membership.school))
    )
    return serialize_profile(result.scalar_one())


@router.patch("/me", response_model=ProfileOut)
async def update_me(body: ProfileUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    profile = await ensure_profile(db, user)
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.avatar_url is not None:
        profile.avatar_url = body.avatar_url
    if body.years_experience is not None:
        profile.years_experience = body.years_experience
    if body.favorite_affirmations is not None:
        profile.favorite_affirmations = json.dumps(body.favorite_affirmations)
    if body.favorite_resources is not None:
        profile.favorite_resources = json.dumps(body.favorite_resources)
    await db.commit()
    return await me(user, db)


@router.get("/share/{token}", response_model=ProfileOut)
async def shared(token: str, db: AsyncSession = Depends(get_db)):
    profile = (await db.execute(select(Profile).where(Profile.share_token == token))).scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Профиль не найден")
    user = (
        await db.execute(
            select(User)
            .where(User.id == profile.user_id)
            .options(selectinload(User.profile), selectinload(User.membership).selectinload(Membership.school))
        )
    ).scalar_one()
    return serialize_profile(user)


@router.get("/achievements", response_model=list[AchievementOut])
async def achievements(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    all_a = (await db.execute(select(Achievement))).scalars().all()
    earned = {
        ua.achievement_id: ua.earned_at
        for ua in (
            await db.execute(select(UserAchievement).where(UserAchievement.user_id == user.id))
        ).scalars().all()
    }
    return [
        AchievementOut(
            id=a.id,
            title=a.title,
            category=a.category,
            description=a.description,
            earned=a.id in earned,
            earned_at=earned.get(a.id),
        )
        for a in all_a
    ]


@router.get("/praises")
async def praises(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Praise).where(Praise.to_user_id == user.id).order_by(Praise.created_at.desc())
        )
    ).scalars().all()
    return [
        {"id": r.id, "message": r.message, "created_at": r.created_at.isoformat()} for r in rows
    ]
