from datetime import datetime, timezone
import uuid

from sqlalchemy import JSON, Column, Date, String

from src.app.db.base import Base

class History(Base):
  """Handle history table"""
  __tablename__ = "history"
  
  #  auto generated column
  id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  created_at = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
  
  version_name = Column(String(100), nullable=False)
  # store prediction data as json
  prediction_summary = Column(JSON)
  prediction_detail = Column(JSON)
  ai_recommendation = Column(JSON)