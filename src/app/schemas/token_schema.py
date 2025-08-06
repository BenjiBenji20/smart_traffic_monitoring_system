
from pydantic import BaseModel

from src.app.models.role import Role
from datetime import datetime


class Token(BaseModel):
  access_token: str
  token_type: str


class TokenPayload(BaseModel):
  sub: str # username
  role: Role
  is_active: bool
  banned_until: datetime | None = None
  