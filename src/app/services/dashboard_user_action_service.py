"""
    Quick implementations for MVP. 
    Deadline is near. Soon to be optimized.
"""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.repositories.user_repository import get_all_users_repository, get_user_by_id_repository
from src.app.models.user import User

async def get_user_by_id_service(id: str, db: AsyncSession) -> User:
    return await get_user_by_id_repository(id, db)
    

async def get_all_users_service(db: AsyncSession) -> List[User]:
    return await get_all_users_repository(db)

