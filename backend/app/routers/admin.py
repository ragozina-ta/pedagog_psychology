from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import io

from app.db.models import (
    ActivityEvent,
    ChatMessage,
    ChatRoom,
    Membership,
    Praise,
    Profile,
    User,
    UserAchievement,
)
from app.db.session import get_db
from app.deps import require_admin
from app.schemas import AdminTeacherOut, PraiseIn
from app.services.activity import achievements_count

router = APIRouter()


@router.get("/teachers", response_model=list[AdminTeacherOut])
async def teachers(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    school_id = admin.membership.school_id
    members = (
        await db.execute(
            select(Membership)
            .where(Membership.school_id == school_id)
            .options(selectinload(Membership.user).selectinload(User.profile))
        )
    ).scalars().all()
    out = []
    for m in members:
        u = m.user
        p = u.profile
        out.append(
            AdminTeacherOut(
                user_id=u.id,
                full_name=u.full_name,
                email=u.email,
                streak=p.streak if p else 0,
                points=p.points if p else 0,
                garden_plants=p.garden_plants if p else 0,
                achievements_count=await achievements_count(db, u.id),
                last_activity_date=p.last_activity_date if p else None,
            )
        )
    out.sort(key=lambda x: x.points, reverse=True)
    return out


@router.get("/stats/month")
async def month_stats(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    school_id = admin.membership.school_id
    member_ids = [
        m.user_id
        for m in (
            await db.execute(select(Membership).where(Membership.school_id == school_id))
        ).scalars().all()
    ]
    since = datetime.now(timezone.utc) - timedelta(days=30)
    events = (
        await db.execute(
            select(ActivityEvent.kind, func.count())
            .where(ActivityEvent.user_id.in_(member_ids), ActivityEvent.created_at >= since)
            .group_by(ActivityEvent.kind)
        )
    ).all()
    active_users = (
        await db.execute(
            select(func.count(func.distinct(ActivityEvent.user_id))).where(
                ActivityEvent.user_id.in_(member_ids), ActivityEvent.created_at >= since
            )
        )
    ).scalar_one()
    return {
        "active_users": active_users,
        "total_members": len(member_ids),
        "by_kind": {k: c for k, c in events},
    }


@router.post("/praise")
async def praise(body: PraiseIn, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    target_m = (
        await db.execute(
            select(Membership).where(
                Membership.user_id == body.to_user_id,
                Membership.school_id == admin.membership.school_id,
            )
        )
    ).scalar_one_or_none()
    if not target_m:
        raise HTTPException(404, "Педагог не в вашей школе")
    p = Praise(from_admin_id=admin.id, to_user_id=body.to_user_id, message=body.message)
    db.add(p)
    # system chat notification
    room = (
        await db.execute(
            select(ChatRoom).where(
                ChatRoom.school_id == admin.membership.school_id, ChatRoom.kind == "school"
            )
        )
    ).scalar_one_or_none()
    if room:
        target = (await db.execute(select(User).where(User.id == body.to_user_id))).scalar_one()
        db.add(
            ChatMessage(
                room_id=room.id,
                sender_id=None,
                content=f"🌟 Администрация отметила прогресс: {target.full_name}. {body.message}",
            )
        )
    await db.commit()
    return {"ok": True}


@router.get("/report.pdf")
async def report_pdf(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    teachers = await teachers(admin, db)
    lines = [
        f"Отчёт школы: {admin.membership.school.name}",
        f"Дата: {date.today().isoformat()}",
        "",
        "Педагоги:",
    ]
    for t in teachers:
        lines.append(
            f"- {t.full_name}: очки={t.points}, серия={t.streak}, сад={t.garden_plants}, ачивки={t.achievements_count}"
        )
    content = "\n".join(lines).encode("utf-8")
    # Simple text-as-pdf fallback: return text file with pdf content-type via plain report
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=school-report.txt"},
    )
