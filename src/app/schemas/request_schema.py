from pydantic import BaseModel, Field
from datetime import datetime

"""
  Use the pydantic classes as data transfer object for every user request
"""

class AdminPredictionRequest(BaseModel):
  start: datetime = Field(default=datetime.now)
  end: datetime
