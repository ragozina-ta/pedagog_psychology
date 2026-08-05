"""Background push scheduler. Run: python worker.py"""

from __future__ import annotations

import asyncio
import json
import os
import random
from datetime import date, datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pywebpush import WebPushException, webpush
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

# Для тестов: PUSH_TEST_MODE=1 и интервал в секундах (по умолчанию 30)
PUSH_TEST_MODE = os.getenv("PUSH_TEST_MODE", "1").strip() in {"1", "true", "yes"}
PUSH_TEST_INTERVAL_SEC = int(os.getenv("PUSH_TEST_INTERVAL_SEC", "30"))


async def send_push(sub: PushSubscription, title: str, body: str, url: str):
    if not settings.vapid_private_key:
        print("skip push: VAPID_PRIVATE_KEY empty")
        return
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=json.dumps({"title": title, "body": body, "url": url}, ensure_ascii=False),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_mailto},
        )
        print("push sent", sub.user_id, title)
    except WebPushException as e:
        print("push error", e)


async def morning_affirmations():
    async with SessionLocal() as db:
        subs = (await db.execute(select(PushSubscription))).scalars().all()
        text = random.choice(AFFIRMATIONS_SAMPLE)
        print(f"affirmations to {len(subs)} subs")
        for s in subs:
            await send_push(s, "Аффирмация дня", text, "/affirmations")


async def diary_reminder():
    if not PUSH_TEST_MODE and date.today().toordinal() % 3 != 0:
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


async def test_tick():
    """Тестовая рассылка каждые N секунд."""
    async with SessionLocal() as db:
        subs = (await db.execute(select(PushSubscription))).scalars().all()
        now = datetime.now(timezone.utc).strftime("%H:%M:%S")
        text = random.choice(AFFIRMATIONS_SAMPLE)
        print(f"[test] {now} subscribers={len(subs)}")
        for s in subs:
            await send_push(s, "Тест уведомления", f"{text} ({now})", "/affirmations")


async def main():
    await init_db()
    scheduler = AsyncIOScheduler(timezone="Europe/Moscow")
    if PUSH_TEST_MODE:
        scheduler.add_job(test_tick, "interval", seconds=PUSH_TEST_INTERVAL_SEC, id="test_push")
        print(
            f"Push TEST mode: every {PUSH_TEST_INTERVAL_SEC}s",
            datetime.now(timezone.utc).isoformat(),
        )
    else:
        scheduler.add_job(morning_affirmations, "cron", hour=7, minute=45)
        scheduler.add_job(diary_reminder, "cron", hour=20, minute=0)
        scheduler.add_job(friend_activity_nudge, "cron", hour=9, minute=0)
        print("Push worker (production cron)", datetime.now(timezone.utc).isoformat())
    scheduler.start()
    # сразу один тик в тест-режиме
    if PUSH_TEST_MODE:
        await test_tick()
    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
