from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Achievement, Profile, UserAchievement, WaterGift
from app.services.activity import count_kind, diary_count

ACHIEVEMENT_SEED = [
    ("first_step", "Первый шаг", "daily", "Заполнил дневник 1 раз", "diary_count", 1),
    ("morning_ritual", "Утренний ритуал", "daily", "Аффирмация 5 дней (суммарно)", "affirmation", 5),
    ("card_player", "Карточный игрок", "daily", "Выполнил 10 карточек дня", "card", 10),
    ("seven_days", "7 дней силы", "weekly", "Серия 7 дней", "streak", 7),
    ("gardener", "Садовник", "weekly", "Посадил 5 растений", "plants", 5),
    ("amateur_psych", "Психолог-любитель", "weekly", "3 техники самовосстановления", "resource", 3),
    ("thirty_days", "30 дней осознанности", "monthly", "Серия 30 дней", "streak", 30),
    ("blooming", "Цветущий сад", "monthly", "Вырастил 10 растений", "plants", 10),
    ("reflection_master", "Мастер рефлексии", "monthly", "20 записей в дневнике", "diary_count", 20),
    ("sixty_days", "60 дней профессионала", "bimonthly", "Серия 60 дней", "streak", 60),
    ("colleague_support", "Поддержка коллег", "bimonthly", "10 поливов друзьям", "water_sent", 10),
    ("hundred_days", "100 дней учителя-субъекта", "quarterly", "Серия 100 дней", "streak", 100),
    ("forest_keeper", "Лесной хранитель", "quarterly", "25 растений", "plants", 25),
    ("year_resource", "Год с Ресурсом", "yearly", "Серия 365 дней", "streak", 365),
]


async def seed_achievements(db: AsyncSession) -> None:
    existing = (await db.execute(select(Achievement.id))).scalars().all()
    have = set(existing)
    for aid, title, cat, desc, key, val in ACHIEVEMENT_SEED:
        if aid in have:
            continue
        db.add(
            Achievement(
                id=aid,
                title=title,
                category=cat,
                description=desc,
                condition_key=key,
                condition_value=val,
            )
        )
    await db.commit()


async def check_and_award(db: AsyncSession, user_id: int, profile: Profile) -> list[str]:
    achievements = (await db.execute(select(Achievement))).scalars().all()
    earned_ids = set(
        (
            await db.execute(
                select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id)
            )
        ).scalars().all()
    )
    water_sent = (
        await db.execute(
            select(WaterGift).where(WaterGift.from_user_id == user_id)
        )
    ).scalars().all()
    stats = {
        "streak": profile.streak,
        "plants": profile.garden_plants,
        "diary_count": await diary_count(db, user_id),
        "card": await count_kind(db, user_id, "card"),
        "affirmation": await count_kind(db, user_id, "affirmation"),
        "resource": await count_kind(db, user_id, "resource"),
        "water_sent": len(water_sent),
    }
    new: list[str] = []
    for a in achievements:
        if a.id in earned_ids:
            continue
        if stats.get(a.condition_key, 0) >= a.condition_value:
            db.add(UserAchievement(user_id=user_id, achievement_id=a.id))
            new.append(a.id)
    return new
