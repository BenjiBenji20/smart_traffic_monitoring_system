from fastapi import APIRouter, Depends, Request

from src.app.models.user import User
from src.app.schemas.user_schema import UserSchema
from src.app.exceptions.custom_exceptions import *
from src.app.db.db_session import get_async_db
from src.app.services.auth_service import get_current_user, oauth2_scheme


dashboard_router = APIRouter(prefix="/api/dashboard")

# enables stateless access
# request object is a middleware from middleware.jwt_filter_middleware.py
@dashboard_router.get("/user-profile", response_model=UserSchema)
async def get_user_profile(user: User = Depends(get_current_user)): 
  if not user:
    raise ResourceNotFoundException("No user found.")
  return user


# get traffic prediction
# from src.traffic_ai.traffic_prediction_json_bldr.py