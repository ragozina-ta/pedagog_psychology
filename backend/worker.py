"""Background push scheduler. Run: python worker.py"""

from __future__ import annotations

import asyncio
import json
import random
from datetime import date, datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pywebpush import webpush, WebPushException
from sqlalchemy import select

from app.core.config import settings
from app.db.models import Friendship, Profile, PushSubscription, User
from app.db.session import SessionLocal, init_db

AFFIRMATIONS_SAMPLE = [
    "Я — профессионал, и каждый урок подтверждает мою компетентность.",
    "Я имею право на отдых, и я его беру.",
    "Я ценен(на) как личность вне зависимости от успехов учеников.",
    "Я смотрю в будущее с надеждой и энергией.",
]


async def send_push(sub: PushSubscription, title: str, body: str, url: str):
    if not settings.vapid_private_key:
        return
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_mailto},
        )
    except WebPushException:
        pass


async def morning_affirmations():
    async with SessionLocal() as db:
        subs = (await db.execute(select(PushSubscription))).scalars().all()
        text = random.choice(AFFIRMATIONS_SAMPLE)
        for s in subs:
            await send_push(s, "Аффирмация дня", text, "/affirmations")


async def diary_reminder():
    """Every 3 days evening — soft diary prompt."""
    if date.today().toordinal() % 3 != 0:
        return
    async with SessionLocal() as db:
        subs = (await db.execute(select(PushSubscription))).scalars().all()
        for s in subs:
            await send_push(
                s,
                "Дневник",
                "Если есть потребность — загляните в дневник. 2–3 раза в неделю достаточно.",
                "/diary",
            )


async def friend_activity_nudge():
    """Notify friends if someone was active today (simple pass)."""
    async with SessionLocal() as db:
        today = date.today()
        active = (
            await db.execute(select(Profile).where(Profile.last_activity_date == today))
        ).scalars().all()
        for p in active:
            links = (
                await db.execute(
                    select(Friendship).where(
                        Friendship.friend_id == p.user_id, Friendship.status == "accepted"
                    )
                )
            ).scalars().all()
            for link in links:
                subs = (
                    await db.execute(
                        select(PushSubscription).where(PushSubscription.user_id == link.user_id)
                    )
                ).scalars().all()
                user = (await db.execute(select(User).where(User.id == p.user_id))).scalar_one()
                for s in subs:
                    await send_push(
                        s,
                        "Друг в Ресурсе",
                        f"{user.full_name} уже начал(а) день. Присоединяйтесь!",
                        "/",
                    )


async def main():
    await init_db()
    scheduler = AsyncIOScheduler(timezone="Europe/Moscow")
    scheduler.add_job(morning_affirmations, "cron", hour=7, minute=45)
    scheduler.add_job(diary_reminder, "cron", hour=20, minute=0)
    scheduler.add_job(friend_activity_nudge, "cron", hour=9, minute=0)
    scheduler.start()
    print("Push worker started", datetime.now(timezone.utc).isoformat())
    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
