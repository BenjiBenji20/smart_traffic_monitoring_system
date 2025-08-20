from pydantic_settings import BaseSettings
from pydantic import SecretStr, field_validator
from typing import Literal
import os

class Settings(BaseSettings):
  AI_API_KEY: str
  APP_NAME: str
  DEBUG: bool = True
  ENV: Literal["dev", "prod", "test"] = "dev"
  MYSQL_PUBLIC_URL: str
  JWT_SECRET_KEY: SecretStr
  JWT_ALGORITHM: str
  MAX_LOGIN_ATTEMPTS: int = 3
  BAN_DURATION_SECONDS: int = 3600

  class Config:
    #env_file = ".env"
    case_sensitive = True

  @field_validator("DEBUG", mode="before")
  def cast_debug(cls, v):
    if isinstance(v, str):
      return v.lower() in ("1", "true", "yes", "on")
    return bool(v)

  def db_uri(self):
    return self.MYSQL_PUBLIC_URL

settings = Settings()