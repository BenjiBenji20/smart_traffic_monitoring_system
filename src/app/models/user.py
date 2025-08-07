from sqlalchemy import Column, String, DateTime, Integer, Boolean
from sqlalchemy import Enum as SQLAlchemyEnum
from src.app.db.base import Base
from datetime import datetime, timezone
import uuid

from src.app.models.role import Role

"""
  Used to saved in db the user info
"""

class User(Base):
  __tablename__ = "users" # table name in schema

  id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)

  username = Column(String(50), nullable=False, unique=True)
  password_hash = Column(String(100), nullable=False)
  role = Column(SQLAlchemyEnum(Role), default=Role.ADMIN, nullable=False)
  
  complete_name = Column(String(50), nullable=False)
  complete_address = Column(String(50), nullable=False)
  age = Column(Integer, default=18, nullable=False)

  failed_attempts = Column(Integer, default=0, nullable=False)
  banned_until = Column(DateTime(timezone=True), nullable=True)
  last_login = Column(DateTime(timezone=True), nullable=True)
  is_active = Column(Boolean, default=False, nullable=False)
