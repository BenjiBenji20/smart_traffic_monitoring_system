"""
    Quick implementations for MVP. 
    Deadline is near. Soon to be optimized the DB look up.
"""
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.schemas.user_schema import PendingUserSchema
from src.app.models.user import ActiveUserArchives, ArchivePendingUser, PendingUser, User

async def search_user_by_username_repository(username: str, db: AsyncSession) -> User:
  query = select(User).where(User.username == username)
  res = await db.execute(query)
  user = res.scalar_one_or_none()
  return user


async def get_user_by_id_repository(db: AsyncSession, id: str) -> User:
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


# === PENDING USERS CRUD REPOSITORY
async def all_pending_registration_repository(db: AsyncSession) -> List[PendingUser]:
    """Fetch all pending users"""
    res = await db.scalars(select(PendingUser))
    users = res.all()
    return users or []


async def search_pending_registration_repository(db: AsyncSession, id: str) -> PendingUser:
    """Search pending user using its id"""
    query = select(PendingUser).where(PendingUser.id == id)
    res = await db.execute(query)
    user = res.scalar_one_or_none()
    return user


async def delete_pending_registration_repository(db: AsyncSession, id: str) -> bool:
    """Delete pending user by ID"""
    pending_user = await search_pending_registration_repository(db, id)
    if pending_user:
        await db.delete(pending_user)
        return True
    
    return False


async def all_archived_registration_repository(db: AsyncSession) -> List[ArchivePendingUser]:
    """Fetch all archived user registrations"""
    res = await db.scalars(select(ArchivePendingUser))
    users = res.all()
    return users or []


async def search_archived_registration_repository(db: AsyncSession, id: str) -> ArchivePendingUser:
    """Search pending user using its id"""
    query = select(ArchivePendingUser).where(ArchivePendingUser.id == id)
    res = await db.execute(query)
    user = res.scalar_one_or_none()
    return user


# == ACTIVE USERS CRUD REPOSITORY ===
async def delete_active_user_repository(db: AsyncSession, id: str) -> bool:
    active_user: User = await get_user_by_id_repository(db, id)
    if active_user:
        await db.delete(active_user)
        return True
    
    return False
    
    
async def all_archive_active_users_repository(db: AsyncSession) -> List[ActiveUserArchives]:
    """Fetch all archived active users"""
    res = await db.scalars(select(ActiveUserArchives))
    users = res.all()
    return users or []


async def search_archived_active_user_repository(db: AsyncSession, id: str) -> ActiveUserArchives:
    """Search archived active user using its id"""
    query = select(ActiveUserArchives).where(ActiveUserArchives.id == id)
    res = await db.execute(query)
    user = res.scalar_one_or_none()
    return user
