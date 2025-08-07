from pydantic_settings import BaseSettings
from pydantic import SecretStr
from typing import Literal


class Settings(BaseSettings):
  AI_API_KEY: str

  # general settings
  APP_NAME: str
  DEBUG: bool = True
  ENV: Literal["dev", "prod", "test"] = "dev"

  # db settings
  MYSQL_HOST: str
  MYSQL_USER: str
  MYSQL_PASSWORD: SecretStr
  MYSQL_DATABASE: str

  SQLALCHEMY_DATABASE_URI: str = ""

  # token settings
  JWT_SECRET_KEY: SecretStr
  JWT_ALGORITHM: str
  MAX_LOGIN_ATTEMPTS: int = 3
  BAN_DURATION_SECONDS: int = 3600  # 1 hour

  # cors settings
  CLIENT_ORIGINS: str

  class Config:
    env_file = ".env"
    case_sensitive = True

  
  def db_uri(self):
    self.SQLALCHEMY_DATABASE_URI = (
      f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD.get_secret_value()}"
      f"@{self.MYSQL_HOST}/{self.MYSQL_DATABASE}"
    )
    return self.SQLALCHEMY_DATABASE_URI


settings = Settings()