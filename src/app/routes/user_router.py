from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, Header, HTTPException, Response

from src.app.services.register_user_service import register_user_service
from src.app.services.auth_service import auth_user, generate_access_token, generate_refresh_token, refresh_token
from src.app.db.db_session import get_async_db
from src.app.schemas.user_schema import *
from src.app.schemas.token_schema import Token

user_router = APIRouter(prefix="/api/user", tags=["Users"])

@user_router.post("/register", response_model=UserSchema)
async def register_user_route(new_user: RegisterUserSchema, db: AsyncSession = Depends(get_async_db)):
  return await register_user_service(new_user, db)


@user_router.post("/auth/token", response_model=Token)
async def auth_for_token(
                          response: Response, 
                          user_cred_data: OAuth2PasswordRequestForm = Depends(),
                          db: AsyncSession = Depends(get_async_db)
                        ):
  user = await auth_user(user_cred_data.username, user_cred_data.password, db)
  
  payload={
    "sub": user.username,
    "role": str(user.role),
    "banned_until": user.banned_until.isoformat() if user.banned_until else None
  }

  access_token = generate_access_token(payload)
  refresh_token = generate_refresh_token({"sub": user.username})

  # attach token as http-only cookie
  response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,       # cannot be accessed via JS
    secure=True,         # only HTTPS
    samesite="lax",      # prevents CSRF (use "strict" if possible)
    max_age=7*24*60*60,  # 7 days
  )

  return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
  }


@user_router.post("/auth/refresh")
async def refresh_access_token(authorization: str = Header(...)):
  if not authorization.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Invalid authorization header")

  token = authorization.split(" ")[1]
  return refresh_token(token)



# Optional: logout endpoint to mark user inactive
# @user_router.post("/logout", response_model=None)
# async def logout_user(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_async_db)):
#   current_user.is_active = False
#   await db.commit()
#   return {"message": f"User {current_user.username} logged out successfully."}