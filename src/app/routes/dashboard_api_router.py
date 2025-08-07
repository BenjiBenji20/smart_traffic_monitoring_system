from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from src.app.db.db_session import get_async_db
from src.app.services.auth_service import get_current_user, oauth2_scheme
"""
  simulate stateless access by accessing fake db and 
  respond it by accessing private api using jwt as header bearer
"""

fake_db: dict = {
  "username": "Benji_09",
  "complete_name": "Benji Canones",
  "password": "BenjiBenji"
}

dashboard_router = APIRouter(prefix="/api/dashboard")

# enables stateless access
# request object is a middleware from middleware.jwt_filter_middleware.py
@dashboard_router.get("/user")
async def get_current_user(request: Request): 
  return request.state.user  # Comes from middleware
