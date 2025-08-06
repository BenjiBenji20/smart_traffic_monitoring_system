from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends

from src.app.models.user import User
from src.app.services.register_user_service import register_user_service
from src.app.services.auth_service import auth_user, generate_access_token, get_current_user
from src.app.db.db_session import get_async_db
from src.app.schemas.user_schema import *
from src.app.schemas.token_schema import Token

user_router = APIRouter(prefix="/api/user", tags=["Users"])

@user_router.post("/register", response_model=UserSchema)
async def register_user_route(new_user: RegisterUserSchema, db: AsyncSession = Depends(get_async_db)):
  return await register_user_service(new_user, db)


@user_router.post("/auth/token", response_model=Token)
async def auth_for_access_token(user_cred_data: OAuth2PasswordRequestForm = Depends(),
                                 db: AsyncSession = Depends(get_async_db)):
  user = await auth_user(user_cred_data.username, user_cred_data.password, db)
  
  access_token = generate_access_token(
    payload={
      "sub": user.username,
      "role": str(user.role),
      "banned_until": user.banned_until.isoformat() if user.banned_until else None
    }
  )

  return Token(access_token=access_token, token_type="bearer")


# Optional: logout endpoint to mark user inactive
# @user_router.post("/logout", response_model=None)
# async def logout_user(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_async_db)):
#   current_user.is_active = False
#   await db.commit()
#   return {"message": f"User {current_user.username} logged out successfully."}