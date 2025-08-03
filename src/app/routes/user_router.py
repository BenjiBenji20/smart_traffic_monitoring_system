from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from src.app.services.register_user_service import register_user_service
from src.app.db.db_session import get_async_db
from src.app.schemas.user_schema import UserSchema, RegisterUserSchema

user_router = APIRouter(prefix="/api/users", tags=["Users"])

@user_router.post("/register", response_model=UserSchema)
async def register_user_route(new_user: RegisterUserSchema, db: AsyncSession = Depends(get_async_db)):
  return await register_user_service(new_user, db)