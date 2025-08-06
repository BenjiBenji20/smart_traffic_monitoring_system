from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.app.schemas.user_schema import RegisterUserSchema
from src.app.models.user import User
from src.app.utils.user_validation_utils import hash_password
from src.app.exceptions.custom_exceptions import DuplicateEntryException, InternalServerError
import logging

logger = logging.getLogger(__name__)

# search existing user using username
async def search_user_by_username(username: str, db: AsyncSession) -> User:
  query = select(User).where(User.username == username)
  res = await db.execute(query)
  user = res.scalar_one_or_none()
  return user


async def register_user_service(new_user: RegisterUserSchema, db: AsyncSession) -> User:
  try:
    # validate user existance
    user = await search_user_by_username(new_user.username, db)
    if user:
        raise DuplicateEntryException(f"User with {new_user.username} as username already exists.")

    hashed_pw = hash_password(new_user.password) # hash password

    user_dict = new_user.model_dump(exclude={"password"})  # remove plain password
    user_dict["password_hash"] = hashed_pw # schema to model matching

    user_db = User(**user_dict) # pass new user with hashed password to the model
    db.add(user_db)
    await db.commit()
    await db.refresh(user_db)

    return user_db
  except DuplicateEntryException:
    raise
  except Exception as e:
    logger.error(f"An error occured: {e}")
    raise InternalServerError("An expected error occured.")
