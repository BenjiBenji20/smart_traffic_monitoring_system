
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.repositories.user_repository import search_user_by_username_repository
from src.app.db.db_session import get_async_db
from src.app.models.user import User
from src.app.exceptions.custom_exceptions import ResourceNotFoundException, UnauthorizedAccessException
from src.app.core.settings import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/auth/token")

# this will be use for stateless requesting and
# RBAC
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_db)) -> User:
  try:
    payload = jwt.decode(token, str(settings.JWT_SECRET_KEY), algorithms=settings.JWT_ALGORITHM)
    username: str = payload.get("sub")
    if username is None:
      raise UnauthorizedAccessException("Could not validate credentials.")
  except JWTError:
    raise UnauthorizedAccessException("Could not validate credentials.")
  
  # get the user form db
  user = await search_user_by_username_repository(username, db)
  if not user:
    raise ResourceNotFoundException("User not found.")
  
  return user
