"""Admin actions are only allowed"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models.user import User
from src.app.exceptions.custom_exceptions import *
from src.app.models.role import Role
from src.app.db.db_session import get_async_db
from src.app.dependencies.role_checker import role_required
from src.app.services.dashboard_crud_service import (
    all_pending_registration_service,
    accept_pending_registration_service,
    archive_pending_registration_service,
    all_archived_registration_service,
    delete_pending_registration_service,
    retrieve_archived_registration_service,
    get_all_users_service,
    get_user_by_id_service,
    archive_active_user_service,
    all_archive_active_users_service,
    retrieve_archived_active_user_service,
    delete_active_user_service
)
from src.app.schemas.user_schema import ArchiveActiveUserSchema, ArchiveUserSchema, PendingUserSchema, UserSchema


dashboard_crud_router = APIRouter(
    prefix="/api/user", 
    tags=["Crud operations such as: User, Record create, update, delete, and + accept"]
)

# === PROCESS USER REGISTRATIONS [for admin actions only] ===
# registration -> pending state
# accept user registration -> [provide username] -> [match the username] -> active user state
# archive registration -> archive state
# retrieve registration -> back to archive state
# delete registration -> total delete
@dashboard_crud_router.get("/all-pending-registrations", response_model=List[PendingUserSchema])
async def all_pending_registration_router(
    role_required = Depends(role_required([Role.ADMIN])),
    db: AsyncSession = Depends(get_async_db),
):
    return await all_pending_registration_service(db)
        

@dashboard_crud_router.post("/accept-pending-registration", response_model=UserSchema)
async def accept_pending_registration_router(
    role_required = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    username: str = Query(...),
    db: AsyncSession = Depends(get_async_db),
):
    try:
        accepted_user = await accept_pending_registration_service(db=db, id=id, username=username)
        
        if accepted_user is None:
            # possible there's duplicate entry in the user table
            raise DuplicateEntryException("User not allowed.")
        
        return accepted_user
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")


@dashboard_crud_router.post("/archive-pending-registration", response_model=ArchiveUserSchema)
async def archive_pending_registration_router(
    role_required = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        archived_user = await archive_pending_registration_service(db=db, id=id)
        
        if archived_user is None:
            raise DuplicateEntryException("User not allowed.")
        
        return archived_user
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")
    

@dashboard_crud_router.get("/all-archived-registrations", response_model=List[ArchiveUserSchema])
async def all_archived_registration_router(
    role_required = Depends(role_required([Role.ADMIN])),
    db: AsyncSession = Depends(get_async_db),
):
    return await all_archived_registration_service(db)


@dashboard_crud_router.post("/retrieve-archived-registration", response_model=PendingUserSchema)
async def retrieve_archived_registration_router(
    role_required = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    db: AsyncSession = Depends(get_async_db)
):
    """
        Retrieve archived pending registration back to pending registration state [action allowed only for admin]
        with safe username verification.
    """
    try:
        retrieve_registration: PendingUserSchema = await retrieve_archived_registration_service(db, id)
        if retrieve_registration is None:
            raise BadRequestException("Request not allowed")
        
        retrieve_registration.message = "Archived user back to pending state"
        return retrieve_registration
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")


@dashboard_crud_router.delete("/delete-pending-registration")
async def delete_pending_registration_router(
    role_required = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    db: AsyncSession = Depends(get_async_db),
):
    try:
        is_deleted = await delete_pending_registration_service(db=db, id=id)
        if not is_deleted:
            raise HTTPException(status_code=400, detail="Failed to delete archived registration request")
        
        return {
            "message": "Archived registration request deleted successfully!",
            "status": is_deleted
        }
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")


# === PROCESS ACTIVE USERS === 
# archive user -> Store to archive table 
# retrieve user -> Back to user state
# delete user -> total delete
@dashboard_crud_router.get("/all-active-users", response_model=List[UserSchema])
async def get_all_users_router(db: AsyncSession = Depends(get_async_db)):
    """Get all active users [accessible by all roles]"""
    return await get_all_users_service(db)


@dashboard_crud_router.get("/active-user/{id}", response_model=UserSchema)
async def get_user_by_id_router(id: str, db: AsyncSession = Depends(get_async_db)):
    """Get active user by id [accessible by all roles]"""
    try:
        user: UserSchema = await get_user_by_id_service(db=db, id=id)
        
        if user is None:
            raise ResourceNotFoundException(f"User not found by id: {id}")
        
        return user
    except Exception as e:
        logging.error(f"Server error while fetching user")
        raise HTTPException(status_code=404, detail=str(e))


@dashboard_crud_router.post("/archive-active-user", response_model=ArchiveActiveUserSchema)
async def archive_active_user_router(
    role_required: User = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    username: str = Query(...),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        archive_user = await archive_active_user_service(
            db=db, id=id, 
            username=username, 
            archived_by=role_required.complete_name
        )
        
        if archive_user is None:
            raise UnauthorizedAccessException("Action not allowed.")
        
        return archive_user
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")


@dashboard_crud_router.get("/all-archived-active-users", response_model=List[ArchiveActiveUserSchema])
async def all_archive_active_users_router(
    role_required: User = Depends(role_required([Role.ADMIN])),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all archived active users"""
    return await all_archive_active_users_service(db)


@dashboard_crud_router.post("/retrieve-archived-active-user", response_model=UserSchema)
async def retrieve_archived_active_user_router(
    role_required = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    username: str = Query(...),
    db: AsyncSession = Depends(get_async_db)
):
    """
        Retrieve archived user back to active user state [action allowed only for admin]
        with safe username verification.
    """
    try:
        retrieve_user: UserSchema = await retrieve_archived_active_user_service(db=db, id=id, username=username)
        if retrieve_user is None:
            raise BadRequestException("Request not allowed")
        
        return retrieve_user
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")


@dashboard_crud_router.delete("/delete-active-user")
async def delete_active_user_router(
    role_required = Depends(role_required([Role.ADMIN])),
    id: str = Query(...),
    username: str = Query(...),
    db: AsyncSession = Depends(get_async_db),
):
    """
        Total delete the archived user [action allowed only for admin]
        with safe username verification.
    """
    try:
        is_deleted = await delete_active_user_service(db=db, id=id, username=username)
        if not is_deleted:
            raise HTTPException(status_code=400, detail="Failed to delete archived user")
        
        return {
            "message": "User deleted successfully!",
            "status": is_deleted
        }
    except Exception as e:
        raise InternalServerError(f"An expencted error occured: {e}")
