from datetime import date, datetime

from pydantic import BaseModel, Field


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterIn(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=255)
    school_code: str | None = None
    create_school_name: str | None = None  # legacy; ignored if empty


class LoginIn(BaseModel):
    email: str
    password: str


class DiaryIn(BaseModel):
    entry_date: date | None = None
    mood: str = "5"  # "0".."10" (legacy happy|neutral|sad accepted by clients)
    gratitude: str = ""
    reflection: str = ""
    intention: str = ""


class SchoolOut(BaseModel):
    id: int
    name: str
    invite_code: str

    model_config = {"from_attributes": True}


class ProfileOut(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str | None
    school: SchoolOut | None
    avatar_url: str | None
    years_experience: int
    points: int
    streak: int
    water_drops: int
    garden_plants: int
    level: str
    share_token: str
    favorite_affirmations: list[str]
    favorite_resources: list[str]
    last_activity_date: date | None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    years_experience: int | None = None
    favorite_affirmations: list[str] | None = None
    favorite_resources: list[str] | None = None


class DiaryOut(BaseModel):
    id: int
    entry_date: date
    mood: str
    gratitude: str
    reflection: str
    intention: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class WheelIn(BaseModel):
    values: dict[str, int]


class WheelOut(BaseModel):
    id: int
    values: dict[str, int]
    created_at: datetime


class ActivityIn(BaseModel):
    kind: str
    meta: dict | None = None


class ActivityOut(BaseModel):
    points_awarded: int
    drops_awarded: int
    streak: int
    points_total: int
    garden_plants: int
    new_achievements: list[str]


class AchievementOut(BaseModel):
    id: str
    title: str
    category: str
    description: str
    earned: bool
    earned_at: datetime | None = None


class FriendOut(BaseModel):
    user_id: int
    full_name: str
    streak: int
    garden_plants: int
    points: int
    last_activity_date: date | None


class InviteOut(BaseModel):
    token: str
    url_path: str


class ChallengeIn(BaseModel):
    title: str
    description: str = ""
    days: int = 7


class ChallengeOut(BaseModel):
    id: int
    title: str
    description: str
    days: int
    active: bool
    my_progress: int = 0


class ChatMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    room_id: int | None = None
    to_user_id: int | None = None


class ChatMessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int | None
    sender_name: str | None
    content: str
    created_at: datetime


class PraiseIn(BaseModel):
    to_user_id: int
    message: str = "Похвала от администрации"


class CompassIn(BaseModel):
    message: str
    urgent: bool = False


class CompassOut(BaseModel):
    reply: str
    urgent: bool = False


class PushSubIn(BaseModel):
    endpoint: str
    keys: dict[str, str]


class AdminTeacherOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    streak: int
    points: int
    garden_plants: int
    achievements_count: int
    last_activity_date: date | None
