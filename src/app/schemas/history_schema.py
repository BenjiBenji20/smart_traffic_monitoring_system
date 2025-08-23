from datetime import datetime, timezone
from typing import Any, Dict
from pydantic import BaseModel, Field, field_validator

class HistorySchema(BaseModel):
  version_name: str = Field(default_factory=lambda:datetime.now(timezone.utc).strftime('%B %d, %Y'), max_length=100)
  # handle prediction data as json
  prediction_summary: Dict[str, Any]
  prediction_detail: Dict[str, Any]
  ai_recommendation: Dict[str, Any]
  