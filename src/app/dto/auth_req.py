from pydantic import BaseModel, Field

"""
  Use for user authentication request body
"""

class AuthUser(BaseModel):
  # only letters, numbers, underscore, 3-20 char
  username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]{3,20}$") 
  #at least 1 uppercase, 1 number, 8+ chars
  password: str = Field(..., min_length=8, max_length=50, pattern=r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%^&+=]{8,}$") 