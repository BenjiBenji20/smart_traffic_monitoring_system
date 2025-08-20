from pydantic_settings import BaseSettings
from pydantic import SecretStr
from typing import Literal

class Settings(BaseSettings):
  AI_API_KEY: str
  APP_NAME: str
  DEBUG: bool = True
  ENV: Literal["dev", "prod", "test"] = "dev"
  DATABASE_URL: str
  JWT_SECRET_KEY: SecretStr
  JWT_ALGORITHM: str
  MAX_LOGIN_ATTEMPTS: int = 3
  BAN_DURATION_SECONDS: int = 3600

  class Config:
    #env_file = ".env"
    case_sensitive = True

  def db_uri(self):
    return self.DATABASE_URL

settings = Settings()