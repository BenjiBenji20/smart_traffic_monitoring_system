from pydantic_settings import BaseSettings
from pydantic import SecretStr
from typing import List, Literal


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
  DATABASE_URL: str

  SQLALCHEMY_DATABASE_URI: str = ""

  # token settings
  JWT_SECRET_KEY: SecretStr
  JWT_ALGORITHM: str
  MAX_LOGIN_ATTEMPTS: int = 3
  BAN_DURATION_SECONDS: int = 3600  # 1 hour

  # cors settings
  #CLIENT_ORIGINS: str

  # livestream pi http addresses
  # PI_HOME_WIFI: str
  # PI_MOBILE_HOTSPOT: str
  # PI_LIVESTREAM_ADDRESS_LIST: List[str] = ["PI_HOME_WIFI", "PI_MOBILE_HOTSPOT"]

  class Config:
    #env_file = ".env"
    case_sensitive = True

  
  def db_uri(self):
    self.SQLALCHEMY_DATABASE_URI = self.DATABASE_URL
    return self.SQLALCHEMY_DATABASE_URI
  

  # def get_pi_addresses(self) -> List[str]:
  #   """Get actual Pi addresses from environment variables"""
  #   addresses = []
  #   for addr_name in self.PI_LIVESTREAM_ADDRESS_LIST:
  #     if hasattr(self, addr_name):
  #       addresses.append(getattr(self, addr_name))
  #   return addresses


settings = Settings()