from sqlalchemy.ext.asyncio import AsyncSession
from src.app.schemas.user_schema import RegisterUserSchema
from src.app.models.user import User
from src.app.utils.user_validation_utils import hash_password


async def register_user_service(new_user: RegisterUserSchema, db: AsyncSession) -> User:
  hashed_pw = hash_password(new_user.password) # hash password

  user_dict = new_user.model_dump(exclude={"password"})  # remove plain password
  user_dict["password_hash"] = hashed_pw # schema to model matching

  user_db = User(**user_dict) # pass new user with hashed password to the model
  db.add(user_db)
  await db.commit()
  await db.refresh(user_db)

  return user_db
