
from pydantic import BaseModel

from src.app.models.role import Role
from datetime import datetime


class Token(BaseModel):
  # return 2 different token
  access_token: str
  refresh_token: str
  token_type: str
  
  class Config:
    from_attributes = True


class TokenPayload(BaseModel):
  sub: str # username
  role: Role
  expiration: datetime
  banned_until: datetime | None = None
  