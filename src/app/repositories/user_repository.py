"""
    Quick implementations for MVP. 
    Deadline is near. Soon to be optimized the DB look up.
"""
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models.user import User

async def search_user_by_username_repository(username: str, db: AsyncSession) -> User:
  query = select(User).where(User.username == username)
  res = await db.execute(query)
  user = res.scalar_one_or_none()
  return user


async def get_user_by_id_repository(id: str, db: AsyncSession) -> User:
    """Search/get user by id"""
    query = select(User).where(User.id == id)
    res = await db.execute(query)
    user = res.scalar_one_or_none()
    return user


async def get_all_users_repository(db: AsyncSession) -> List[User]:
    """Get all users"""
    res = await db.scalars(select(User))
    users = res.all()
    return users or []
