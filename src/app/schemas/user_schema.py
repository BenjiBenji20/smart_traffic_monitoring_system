import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import regex

from src.app.models.role import Role

# for request dto
class AuthUserSchema(BaseModel):
  # only letters, numbers, underscore, 3-20 char
  username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]{3,20}$") 
  #at least 1 uppercase, 1 number, 8+ chars
  password: str = Field(..., min_length=8, max_length=50)
  @field_validator("password")
  @classmethod
  def validate_password(cls, value):
    import re
    pattern = r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%^&+=]{8,}$"
    if not re.match(pattern, value):
      raise ValueError("Password must be at least 8 characters long, include one uppercase letter and one number.")
    return value 


# for request dto
class RegisterUserSchema(AuthUserSchema):
  """
    username and password are inherited from base class
  """
  role: Role = Role.ADMIN
  complete_name: str = Field(..., max_length=50)
  complete_address: str = Field(default="Malabon City", max_length=100)
  age: int = Field(default=18, gt=0, le=120)
  
  @field_validator("complete_name", "complete_address")
  @classmethod
  def validate_name_and_address(cls, val):
    pattern = r"^[\p{L}][\p{L}\p{M}'\-,. ]*$"
    if not regex.match(pattern, val):
      raise ValueError(f"Must be valid: {val}")
    
    return val
  

class UpdateInfoSchema(BaseModel):
  """Use for updating that requires field optional"""
  username: Optional[str] = Field(
    default=None,
    min_length=3,
    max_length=20,
    pattern=r"^[a-zA-Z0-9_]{3,20}$"
  )
  
  password: Optional[str] = Field(
    default=None,
    min_length=8,
    max_length=50
  )
  role: Optional[Role] = None
  complete_name: Optional[str] = Field(default=None, max_length=50)
  complete_address: Optional[str] = Field(default=None, max_length=100)
  age: Optional[int] = Field(default=None, gt=0, le=120)

  @field_validator("*", mode='before')
  @classmethod
  def skip_validation_for_none(cls, value, info):
    """Skip validation for None values"""
    if value is None:
      return value
    return value

  # Validators will only run for non-None values due to the above validator
  @field_validator("password")
  @classmethod
  def validate_password(cls, value):
    pattern = r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%^&+=]{8,}$"
    if not re.match(pattern, value):
      raise ValueError("Password must be at least 8 characters long, include one uppercase letter and one number.")
    return value

  @field_validator("complete_name", "complete_address")
  @classmethod
  def validate_name_and_address(cls, val):
    pattern = r"^[a-zA-Z][a-zA-Z'\-,. ]*$"
    if not re.match(pattern, val):
      raise ValueError(f"Must be valid: {val}")
    return val
  
  
# request dto
class UpdateUserProfileSchema(BaseModel):
  username: str = Field(..., min_length=3, max_length=50)
  password: str = Field(..., min_length=8)
  update_info: UpdateInfoSchema  # new info of user being updated


# for response dto
class UserSchema(BaseModel):
  id: str
  created_at: datetime
  username: str
  role: Role
  complete_name: str 
  complete_address: str 
  age: int 
  is_active: bool

class Config:
  from_attributes = True


# for response dto
class PendingUserSchema(UserSchema):
  message: str = "Registration is pending. Please wait to be accepted by admin."


# for response dto
class ArchiveUserSchema(UserSchema):
  message: str = "Archived pending registration."


# for response dto
class ArchiveActiveUserSchema(UserSchema):
  archived_at: datetime
  archived_by: str
  message: str = "Archived active user successfully."