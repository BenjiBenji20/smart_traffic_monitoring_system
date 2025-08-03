from passlib.hash import bcrypt

"""
  hash password into cryptograph
"""
def hash_password(password: str) -> str:

  return bcrypt.hash(password)

"""
  validates plain password by comparing it to hashed password 
  (hashed pass will be decoded first so it will be compare in full string type)
"""
def validate_password(plain_password: str, hashed_password: str) -> bool:
  return bcrypt.verify(plain_password, hashed_password)