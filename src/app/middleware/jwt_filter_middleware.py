from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import jwt 
from jwt import InvalidTokenError, ExpiredSignatureError
from starlette import status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

from src.app.models.user import User
from src.app.db.db_session import get_async_db
from src.app.core.auth_config import PUBLIC_ROUTES
from src.app.exceptions.custom_exceptions import *
from src.app.core.settings import settings
from src.app.services.register_user_service import search_user_by_username
from src.app.utils.error_response import error_response


class JWTFilterMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    path = request.url.path

    # check if the request url path is a public route
    if path in PUBLIC_ROUTES:
      # no need for token validation
      return await call_next(request)
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
      return error_response(detail="Invalid authentication.", error_code="UNAUTHORIZED", status_code=401)
    
    # extract jwt from header 
    token = auth_header.split(" ")[1]

    try:
      # decode the payload using the token, secret key and algorithm
      payload = jwt.decode(token, str(settings.JWT_SECRET_KEY), settings.JWT_ALGORITHM)
      username: str = payload.get("sub") # gett username from payload

      # validate token expiration
      if datetime.now(timezone.utc) > datetime.fromtimestamp(payload["exp"], tz=timezone.utc):
        return error_response(detail="Invalid authentication.", error_code="UNAUTHORIZED", status_code=401)
      
      # validate user banned timeand if active 
      # extract user from db
      # create DB session from generator
      async for db in get_async_db():
        user: User = await search_user_by_username(username, db)
        
      if user is None:
        return error_response(detail=f"User with {username} username not found..", error_code="NOT_FOUND", status_code=404)
      
      # check if user has banned time
      if user.banned_until and datetime.now(timezone.utc) < user.banned_until.replace(tzinfo=timezone.utc):
        return error_response(detail="User is currently banned. You don't have access to this request.", error_code="FORBIDDEN", status_code=403)
      
      # validate if user is active
      if not user.is_active:
        return error_response(detail="User is deactivated. You don't have access to this request.", error_code="FORBIDDEN", status_code=403)

      request.state.user = payload
    except UnauthorizedAccessException:
      return error_response(detail="Invalid authentication.", error_code="UNAUTHORIZED", status_code=401)
    
    except ExpiredSignatureError:
      return error_response(detail="Access token expired. Please refresh your token.", error_code="UNAUTHORIZED", status_code=401)
    
    except InvalidTokenError:
      return error_response(detail="Invalid token. Please login again.", error_code="UNAUTHORIZED", status_code=401)

    # pass the token to the router
    return await call_next(request)
 