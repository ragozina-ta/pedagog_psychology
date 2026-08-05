from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    FriendInvite,
    Friendship,
    Profile,
    SharedGarden,
    SharedGardenMember,
    User,
    WaterGift,
)
from app.db.session import get_db
from app.deps import ensure_profile, get_current_user
from app.schemas import FriendOut, InviteOut
from app.services.activity import apply_activity

router = APIRouter()


@router.get("", response_model=list[FriendOut])
async def list_friends(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Friendship).where(
                Friendship.user_id == user.id, Friendship.status == "accepted"
            )
        )
    ).scalars().all()
    out: list[FriendOut] = []
    for f in rows:
        friend = (
            await db.execute(
                select(User).where(User.id == f.friend_id).options(selectinload(User.profile))
            )
        ).scalar_one()
        p = friend.profile or Profile(user_id=friend.id)
        out.append(
            FriendOut(
                user_id=friend.id,
                full_name=friend.full_name,
                streak=p.streak,
                garden_plants=p.garden_plants,
                points=p.points,
                last_activity_date=p.last_activity_date,
            )
        )
    return out


@router.post("/invite", response_model=InviteOut)
async def create_invite(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    inv = FriendInvite(from_user_id=user.id)
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return InviteOut(token=inv.token, url_path=f"/invite/{inv.token}")


@router.post("/accept/{token}", response_model=FriendOut)
async def accept_invite(token: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    inv = (await db.execute(select(FriendInvite).where(FriendInvite.token == token))).scalar_one_or_none()
    if not inv or inv.used_by:
        raise HTTPException(404, "Приглашение недействительно")
    if inv.from_user_id == user.id:
        raise HTTPException(400, "Нельзя принять своё приглашение")

    my_friends = (
        await db.execute(select(Friendship).where(Friendship.user_id == user.id, Friendship.status == "accepted"))
    ).scalars().all()
    if len(my_friends) >= 5:
        raise HTTPException(400, "Максимум 5 друзей")

    inv.used_by = user.id
    db.add(Friendship(user_id=user.id, friend_id=inv.from_user_id, status="accepted"))
    db.add(Friendship(user_id=inv.from_user_id, friend_id=user.id, status="accepted"))
    await db.commit()
    await apply_activity(db, user.id, "invite")
    await apply_activity(db, inv.from_user_id, "invite")

    friend = (
        await db.execute(
            select(User).where(User.id == inv.from_user_id).options(selectinload(User.profile))
        )
    ).scalar_one()
    p = friend.profile
    return FriendOut(
        user_id=friend.id,
        full_name=friend.full_name,
        streak=p.streak if p else 0,
        garden_plants=p.garden_plants if p else 0,
        points=p.points if p else 0,
        last_activity_date=p.last_activity_date if p else None,
    )


@router.post("/water/{friend_id}")
async def water_friend(friend_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    link = (
        await db.execute(
            select(Friendship).where(
                Friendship.user_id == user.id,
                Friendship.friend_id == friend_id,
                Friendship.status == "accepted",
            )
        )
    ).scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Друг не найден")

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    already = (
        await db.execute(
            select(WaterGift).where(
                WaterGift.from_user_id == user.id,
                WaterGift.to_user_id == friend_id,
                WaterGift.created_at >= today_start,
            )
        )
    ).scalar_one_or_none()
    if already:
        raise HTTPException(400, "Сегодня вы уже полили этого друга")

    db.add(WaterGift(from_user_id=user.id, to_user_id=friend_id))
    await db.commit()
    a1 = await apply_activity(db, user.id, "water_friend")
    a2 = await apply_activity(db, friend_id, "water_friend")
    return {"ok": True, "you": a1, "friend": a2}


@router.post("/shared-garden")
async def create_shared(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    g = SharedGarden(owner_id=user.id, name="Общий сад")
    db.add(g)
    await db.flush()
    db.add(SharedGardenMember(garden_id=g.id, user_id=user.id))
    await db.commit()
    return {"id": g.id, "name": g.name, "plants": g.plants}


@router.post("/shared-garden/{garden_id}/join")
async def join_shared(garden_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    g = (await db.execute(select(SharedGarden).where(SharedGarden.id == garden_id))).scalar_one_or_none()
    if not g:
        raise HTTPException(404)
    members = (
        await db.execute(select(SharedGardenMember).where(SharedGardenMember.garden_id == garden_id))
    ).scalars().all()
    if len(members) >= 3:
        raise HTTPException(400, "В общем саду максимум 3 участника")
    if any(m.user_id == user.id for m in members):
        return {"id": g.id, "plants": g.plants}
    db.add(SharedGardenMember(garden_id=garden_id, user_id=user.id))
    await db.commit()
    return {"id": g.id, "plants": g.plants}
