from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import decode_token
from app.db.models import ChatMessage, ChatRoom, Challenge, ChallengeProgress, Membership, User
from app.db.session import SessionLocal, get_db
from app.deps import get_current_user
from app.schemas import ChallengeIn, ChallengeOut, ChatMessageIn, ChatMessageOut
from app.services.activity import apply_activity

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, room_id: int, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(room_id, []).append(ws)

    def disconnect(self, room_id: int, ws: WebSocket):
        if room_id in self.active:
            self.active[room_id] = [w for w in self.active[room_id] if w is not ws]

    async def broadcast(self, room_id: int, data: dict):
        for ws in self.active.get(room_id, []):
            await ws.send_json(data)


manager = ConnectionManager()


async def school_room(db: AsyncSession, school_id: int) -> ChatRoom:
    room = (
        await db.execute(
            select(ChatRoom).where(ChatRoom.school_id == school_id, ChatRoom.kind == "school")
        )
    ).scalar_one_or_none()
    if not room:
        room = ChatRoom(school_id=school_id, kind="school", title="Чат школы")
        db.add(room)
        await db.commit()
        await db.refresh(room)
    return room


def dm_key(a: int, b: int) -> str:
    x, y = sorted([a, b])
    return f"dm:{x}:{y}"


@router.get("/rooms/school")
async def get_school_room(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not user.membership:
        raise HTTPException(400, "Нужна школа")
    room = await school_room(db, user.membership.school_id)
    return {"id": room.id, "title": room.title, "kind": room.kind}


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageOut])
async def history(room_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    msgs = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.room_id == room_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    out = []
    for m in reversed(msgs):
        name = None
        if m.sender_id:
            u = (await db.execute(select(User).where(User.id == m.sender_id))).scalar_one_or_none()
            name = u.full_name if u else None
        out.append(
            ChatMessageOut(
                id=m.id,
                room_id=m.room_id,
                sender_id=m.sender_id,
                sender_name=name,
                content=m.content,
                created_at=m.created_at,
            )
        )
    return out


@router.post("/messages", response_model=ChatMessageOut)
async def send(body: ChatMessageIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    room_id = body.room_id
    if body.to_user_id:
        key = dm_key(user.id, body.to_user_id)
        room = (await db.execute(select(ChatRoom).where(ChatRoom.dm_key == key))).scalar_one_or_none()
        if not room:
            room = ChatRoom(kind="dm", dm_key=key, title="Личные сообщения")
            db.add(room)
            await db.flush()
        room_id = room.id
    if not room_id:
        raise HTTPException(400, "Укажите room_id или to_user_id")
    msg = ChatMessage(room_id=room_id, sender_id=user.id, content=body.content.strip())
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    payload = ChatMessageOut(
        id=msg.id,
        room_id=msg.room_id,
        sender_id=user.id,
        sender_name=user.full_name,
        content=msg.content,
        created_at=msg.created_at,
    )
    await manager.broadcast(room_id, payload.model_dump(mode="json"))
    return payload


@router.websocket("/ws/{room_id}")
async def ws_chat(websocket: WebSocket, room_id: int, token: str):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4401)
        return
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = str(data.get("content", "")).strip()
            if not content:
                continue
            async with SessionLocal() as db:
                user_id = int(payload["sub"])
                msg = ChatMessage(room_id=room_id, sender_id=user_id, content=content)
                db.add(msg)
                await db.commit()
                await db.refresh(msg)
                user = (await db.execute(select(User).where(User.id == user_id))).scalar_one()
                out = {
                    "id": msg.id,
                    "room_id": room_id,
                    "sender_id": user_id,
                    "sender_name": user.full_name,
                    "content": content,
                    "created_at": msg.created_at.isoformat(),
                }
            await manager.broadcast(room_id, out)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)


@router.get("/challenges", response_model=list[ChallengeOut])
async def challenges(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not user.membership:
        return []
    rows = (
        await db.execute(
            select(Challenge).where(
                Challenge.school_id == user.membership.school_id, Challenge.active.is_(True)
            )
        )
    ).scalars().all()
    out = []
    for c in rows:
        prog = (
            await db.execute(
                select(ChallengeProgress).where(
                    ChallengeProgress.challenge_id == c.id, ChallengeProgress.user_id == user.id
                )
            )
        ).scalar_one_or_none()
        out.append(
            ChallengeOut(
                id=c.id,
                title=c.title,
                description=c.description,
                days=c.days,
                active=c.active,
                my_progress=prog.progress if prog else 0,
            )
        )
    return out


@router.post("/challenges", response_model=ChallengeOut)
async def create_challenge(
    body: ChallengeIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    if not user.membership:
        raise HTTPException(400, "Нужна школа")
    c = Challenge(
        school_id=user.membership.school_id,
        created_by=user.id,
        title=body.title,
        description=body.description,
        days=body.days,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return ChallengeOut(
        id=c.id, title=c.title, description=c.description, days=c.days, active=True, my_progress=0
    )


@router.post("/challenges/{challenge_id}/tick", response_model=ChallengeOut)
async def tick(
    challenge_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    c = (await db.execute(select(Challenge).where(Challenge.id == challenge_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404)
    prog = (
        await db.execute(
            select(ChallengeProgress).where(
                ChallengeProgress.challenge_id == challenge_id, ChallengeProgress.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if not prog:
        prog = ChallengeProgress(challenge_id=challenge_id, user_id=user.id, progress=0)
        db.add(prog)
    if prog.progress < c.days:
        prog.progress += 1
        await db.commit()
        await apply_activity(db, user.id, "challenge_tick")
    await db.refresh(prog)
    return ChallengeOut(
        id=c.id,
        title=c.title,
        description=c.description,
        days=c.days,
        active=c.active,
        my_progress=prog.progress,
    )
