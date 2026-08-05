from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Praise, User
from app.db.session import get_db
from app.deps import get_current_user

# patch admin.py praises - add to profile instead
