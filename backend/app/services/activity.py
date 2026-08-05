from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ActivityEvent, DiaryEntry, Profile, UserAchievement

POINTS = {
    "diary": 10,
    "card": 5,
    "affirmation": 3,
    "resource": 7,
    "share_achievement": 15,
    "invite": 20,
    "water_friend": 5,
    "wheel": 5,
    "mood_check": 2,
    "challenge_tick": 5,
}

DROPS = {
    "diary": 3,
    "card": 2,
    "affirmation": 1,
    "resource": 2,
    "water_friend": 1,
    "wheel": 2,
    "mood_check": 1,
    "challenge_tick": 1,
}


def level_from_points(points: int) -> str:
    if points >= 2000:
        return "Наставник"
    if points >= 600:
        return "Автор"
    return "Исполнитель"


def plants_from_drops(drops: int) -> int:
    return drops // 5


async def apply_activity(
    db: AsyncSession,
    user_id: int,
    kind: str,
    meta: dict | None = None,
) -> dict:
    from app.services.achievements import check_and_award

    profile = (
        await db.execute(select(Profile).where(Profile.user_id == user_id))
    ).scalar_one()

    points = POINTS.get(kind, 0)
    drops = DROPS.get(kind, 0)

    # Anti-spam: one diary/card/affirmation/wheel per day
    once_per_day = {"diary", "card", "affirmation", "wheel", "mood_check"}
    if kind in once_per_day:
        today = date.today()
        start = datetime_start(today)
        exists = (
            await db.execute(
                select(ActivityEvent.id).where(
                    ActivityEvent.user_id == user_id,
                    ActivityEvent.kind == kind,
                    ActivityEvent.created_at >= start,
                )
            )
        ).scalar_one_or_none()
        if exists:
            return {
                "points_awarded": 0,
                "drops_awarded": 0,
                "streak": profile.streak,
                "points_total": profile.points,
                "garden_plants": profile.garden_plants,
                "new_achievements": [],
            }

    today = date.today()
    if profile.last_activity_date == today:
        pass
    elif profile.last_activity_date == today - timedelta(days=1):
        profile.streak += 1
    else:
        profile.streak = 1
    profile.last_activity_date = today

    profile.points += points
    profile.water_drops += drops
    profile.garden_plants = plants_from_drops(profile.water_drops)

    event = ActivityEvent(
        user_id=user_id,
        kind=kind,
        points=points,
        drops=drops,
        meta_json=__import__("json").dumps(meta or {}),
    )
    db.add(event)
    await db.flush()

    new_ach = await check_and_award(db, user_id, profile)
    await db.commit()
    await db.refresh(profile)

    return {
        "points_awarded": points,
        "drops_awarded": drops,
        "streak": profile.streak,
        "points_total": profile.points,
        "garden_plants": profile.garden_plants,
        "new_achievements": new_ach,
    }


def datetime_start(d: date):
    from datetime import datetime, timezone

    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


async def count_kind(db: AsyncSession, user_id: int, kind: str) -> int:
    return (
        await db.execute(
            select(func.count()).select_from(ActivityEvent).where(
                ActivityEvent.user_id == user_id, ActivityEvent.kind == kind
            )
        )
    ).scalar_one()


async def diary_count(db: AsyncSession, user_id: int) -> int:
    return (
        await db.execute(
            select(func.count()).select_from(DiaryEntry).where(DiaryEntry.user_id == user_id)
        )
    ).scalar_one()


async def achievements_count(db: AsyncSession, user_id: int) -> int:
    return (
        await db.execute(
            select(func.count()).select_from(UserAchievement).where(UserAchievement.user_id == user_id)
        )
    ).scalar_one()
