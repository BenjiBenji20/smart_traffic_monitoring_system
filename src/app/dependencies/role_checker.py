from typing import List
from fastapi import Depends

from src.app.models.user import User
from src.app.dependencies.get_current_user_depends import get_current_user
from src.app.exceptions.custom_exceptions import UnauthorizedAccessException


def role_required(allowed_roles: List[str]):
    async def wrapper(user: User = Depends(get_current_user)) -> None:
        if user.role not in allowed_roles:
            raise UnauthorizedAccessException("You do not have an access for this resources")
        return user
    return wrapper
