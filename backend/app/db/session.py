from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    # Import models so metadata is populated
    from app.db import models  # noqa: F401
    from sqlalchemy import text

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Несколько записей в один день: снимаем старый unique (user_id, entry_date)
        if settings.database_url.startswith("sqlite"):
            # SQLite: recreate table without unique if constraint still present
            info = (
                await conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='diary_entries'"))
            ).scalar_one_or_none()
            if info and "UNIQUE" in info.upper() and "ENTRY_DATE" in info.upper():
                await conn.execute(text("ALTER TABLE diary_entries RENAME TO diary_entries_old"))
                await conn.run_sync(Base.metadata.create_all)
                await conn.execute(
                    text(
                        """
                        INSERT INTO diary_entries (id, user_id, entry_date, mood, gratitude, reflection, intention, updated_at)
                        SELECT id, user_id, entry_date, mood, gratitude, reflection, intention, updated_at
                        FROM diary_entries_old
                        """
                    )
                )
                await conn.execute(text("DROP TABLE diary_entries_old"))
        else:
            await conn.execute(
                text("ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_user_id_entry_date_key")
            )

    from app.services.achievements import seed_achievements

    async with SessionLocal() as session:
        await seed_achievements(session)
