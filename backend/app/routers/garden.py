from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Profile, User
from app.db.session import get_db
from app.deps import ensure_profile, get_current_user
from app.services.activity import level_from_points

router = APIRouter()


def stage_for_plants(n: int) -> list[str]:
    """Return visual plant stages for garden display."""
    stages = []
    remaining = n
    # each plant: 0 seed, 1 sprout, 2 flower, 3 tree (based on order)
    for i in range(min(n, 25)):
        tier = min(3, (i // 5) + (1 if remaining > 0 else 0))
        stages.append(["seed", "sprout", "flower", "tree"][min(3, (i % 4))])
    return stages[: max(n, 0)]


@router.get("/me")
async def my_garden(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = await ensure_profile(db, user)
    return {
        "points": p.points,
        "streak": p.streak,
        "water_drops": p.water_drops,
        "garden_plants": p.garden_plants,
        "level": level_from_points(p.points),
        "plants": stage_for_plants(p.garden_plants),
    }
