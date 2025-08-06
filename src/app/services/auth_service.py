from datetime import datetime, timedelta, timezone
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.db.db_session import get_async_db
from src.app.models.user import User
from src.app.exceptions.custom_exceptions import ResourceNotFoundException, UnauthorizedAccessException
from src.app.utils.user_validation_utils import validate_password
from src.app.services.register_user_service import search_user_by_username
from src.app.core.settings import settings

# tells where api endpoint to access the token
# this will be defined in rotues
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/auth/token")

# Constants
MAX_FAILED_ATTEMPTS = 3
BAN_DURATION_MINUTES = 30

async def auth_user(username: str, password: str, db: AsyncSession) -> User:
  user = await search_user_by_username(username, db)
  if not user:
    raise ResourceNotFoundException(f"User: {username} not found.")
  
  now = datetime.now(timezone.utc)

  # Check if user is banned
  if user.banned_until:
    banned_until_aware = user.banned_until.replace(tzinfo=timezone.utc)
    if banned_until_aware > now:
      raise UnauthorizedAccessException(f"User is banned until {user.banned_until}.")

  
  # if failed attempts persists due to wrong password, increment failed_attempts attribute
  if not validate_password(password, user.password_hash):
    user.failed_attempts += 1

    # Ban user if max attempts reached
    if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
      user.banned_until = now + timedelta(minutes=BAN_DURATION_MINUTES)
      # response ban time in minutes
      ban_duration = user.banned_until - now
      ban_minutes = int(ban_duration.total_seconds() / 60)
      user.failed_attempts = 0  # reset to avoid stacking bans
      await db.commit()
      raise UnauthorizedAccessException(f"Banned for {ban_minutes} minutes")

    await db.commit()
    raise UnauthorizedAccessException("Invalid username or password.")
  
  # Reset failed attempts on success
  user.failed_attempts = 0
  user.banned_until = None
  user.last_login = now
  user.is_active = True
  await db.commit()

  return user
  

def generate_access_token(payload: dict) -> str:
  # 15mins refresh token expiration
  token_expiration = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) 
  payload.update({"exp": token_expiration})

  encoded_jwt = jwt.encode(payload, str(settings.JWT_SECRET_KEY), algorithm=settings.JWT_ALGORITHM)
  return encoded_jwt


# jwt filterrer and returns current user
# this will be use for stateless requesting
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_db)) -> User:
  try:
    payload = jwt.decode(token, str(settings.JWT_SECRET_KEY), algorithms=settings.JWT_ALGORITHM)
    username: str = payload.get("sub")
    if username is None:
      raise UnauthorizedAccessException("Could not validate credentials.")
  except JWTError:
    raise UnauthorizedAccessException("Could not validate credentials.")
  
  # get the user form db
  user = await search_user_by_username(username, db)
  if not user:
    raise ResourceNotFoundException("User not found.")
  
  return user