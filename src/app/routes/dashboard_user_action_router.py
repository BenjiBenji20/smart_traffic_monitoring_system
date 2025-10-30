"""
    Quick implementations for MVP. 
    Deadline is near. Soon to be optimized.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user_schema import UserSchema
from src.app.db.db_session import get_async_db
from src.app.exceptions.custom_exceptions import ResourceNotFoundException
from app.services.dashboard_user_action_service import get_all_users_service, get_user_by_id_service

dashboard_user_action_router = APIRouter(prefix="/api/user/action", tags=["user activities"])


@dashboard_user_action_router.get("/user/{id}", response_model=UserSchema)
async def get_user_by_id_router(id: str, db: AsyncSession = Depends(get_async_db)):
  try:
    user: UserSchema = await get_user_by_id_service(id, db)
    
    if user is None:
      raise ResourceNotFoundException(f"User not found by id: {id}")
    
    return user
  except Exception as e:
    logging.error(f"Server error while fetching user")
    raise HTTPException(status_code=404, detail=str(e))
  
  
@dashboard_user_action_router.get("/all-users", response_model=List[UserSchema])
async def get_all_users_router(db: AsyncSession = Depends(get_async_db)):
  return await get_all_users_service(db)
  
  
  