from datetime import date, datetime, timezone
from typing import Any, Dict, List
import uuid
from pydantic import BaseModel, ConfigDict, Field

class HistorySchema(BaseModel):
  version_name: str = Field(default_factory=lambda:datetime.now(timezone.utc).strftime('%B %d, %Y'), max_length=100)
  # handle prediction data as json
  prediction_summary: Dict[str, Any]
  prediction_detail: Dict[str, Any]
  ai_recommendation: Dict[str, Any]
  
  
class HistoryResponseSchema(BaseModel):
  model_config = ConfigDict(arbitrary_types_allowed=True)  # Add this
    
  id: uuid.UUID = Field(..., description="History ID")
  created_at: date = Field(..., description="History record date")
  version_name: str = Field(..., max_length=100, description="History record version name")
  
  
class HistoryListSchema(BaseModel):
  status: bool = True
  message: str = "Limited history data retrieved successfully"
  data: List[HistoryResponseSchema]
  timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
  