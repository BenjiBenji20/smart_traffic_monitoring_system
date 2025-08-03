from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
import regex
import uuid

from src.app.models.role import Role

class RegisterUser(BaseModel):
  id: str = Field(default_factory=lambda: str(uuid.uuid4()))# auto generate uuid
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc)) # auto generate time when reg req sent
  # only letters, numbers, underscore, 3-20 char
  username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]{3,20}$") 
  #at least 1 uppercase, 1 number, 8+ chars
  password: str = Field(..., min_length=8, max_length=50, pattern=r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%^&+=]{8,}$") 
  role: Role = Role.ADMIN
  complete_name: str = Field(..., max_length=50)
  complete_address: str = Field(default="Malabon City", max_length=100)
  age: int = Field(default=18, gt=0, le=120)
  
  @field_validator("complete_name", "complete_address")
  @classmethod
  def validate_name_and_address(cls, val):
    pattern = r"^[\p{L}][\p{L}\p{M}'\- ]*$"
    if not regex.match(pattern, val):
      raise ValueError(f"Must be valid complete name: {val}")
    
    return val
