from datetime import datetime, timezone
from typing import List
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

import logging

from src.app.utils.user_validation_utils import hash_password
from src.app.services.auth_service import auth_user
from src.app.schemas.user_schema import UpdateUserProfileSchema, UserSchema, AuthUserSchema
from src.app.repositories.user_repository import (
    all_pending_registration_repository,
    search_pending_registration_repository,
    all_archived_registration_repository,
    delete_pending_registration_repository,
    search_archived_registration_repository,
    get_all_users_repository,
    get_user_by_id_repository,
    delete_active_user_repository,
    all_archive_active_users_repository,
    search_archived_active_user_repository,
    search_user_by_username_repository
)
from src.app.models.user import ActiveUserArchives, ArchivePendingUser, PendingUser, User
from src.app.exceptions.custom_exceptions import *


logger = logging.getLogger(__name__)

async def all_pending_registration_service(db: AsyncSession) -> List[PendingUser]:
    """Get all pending users"""
    return await all_pending_registration_repository(db)


def verify_action(real_username: str, input_username: str) -> bool:
    """Verify the action by providing the username of the user being acted upon"""
    return input_username == real_username 


async def accept_pending_registration_service(db: AsyncSession, id: str, username: str) -> User:
    """Accepting pending user registration"""
    try:
        pending_user: PendingUser = await search_pending_registration_repository(db, id)
        
        if pending_user is None:
            logger.error(f"Pending user not found with id: {id}")
            raise ResourceNotFoundException(f"No pending user with id {id}")
        
        if not verify_action(pending_user.username, username):
            raise BadRequestException(f"Username verification mismatched: {username}")
            
        new_user = User(
            username=pending_user.username,
            password_hash=pending_user.password_hash,  
            role=pending_user.role,
            complete_name=pending_user.complete_name,
            complete_address=pending_user.complete_address,
            age=pending_user.age,
            is_active=pending_user.is_active,  
            failed_attempts=pending_user.failed_attempts,  
            banned_until=pending_user.banned_until,  
            last_login=pending_user.last_login, 
        )

        db.add(new_user)
        await db.flush()  
        await delete_pending_registration_repository(db, id)
        await db.commit()

        logger.info(f"Successfully accepted pending user {new_user.complete_name}.")
        return new_user
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error accepting pending user {id}: {str(e)}")
        raise InternalServerError("Failed to accept pending user registration")
    
    
async def archive_pending_registration_service(db: AsyncSession, id: str) -> ArchivePendingUser:
    try:
        pending_user: PendingUser = await search_pending_registration_repository(db, id)
        
        if pending_user is None:
            logger.error(f"Pending user not found with id: {id}")
            raise ResourceNotFoundException(f"No pending user with id {id}")
        
        archived_user = ArchivePendingUser(
            username=pending_user.username,
            password_hash=pending_user.password_hash,  
            role=pending_user.role,
            complete_name=pending_user.complete_name,
            complete_address=pending_user.complete_address,
            age=pending_user.age,
            is_active=pending_user.is_active,  
            failed_attempts=pending_user.failed_attempts,  
            banned_until=pending_user.banned_until,  
            last_login=pending_user.last_login, 
        )
        
        is_deleted = await delete_pending_registration_repository(db, id)
        if not is_deleted:
            logger.error("Pending user cannot deleted from pending_users table to archive. Y?")
            raise BadRequestException("Pending user cannot deleted from pending_users table to archive.")
        
        db.add(archived_user)
        await db.flush()  
        await db.commit()
    
        logger.info(f"Successfully archived pending user request {archived_user.complete_name}.")
        return archived_user
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error archiving pending user {id}: {str(e)}")
        raise InternalServerError("Failed to archive pending user registration")
    
    
async def delete_pending_registration_service(db: AsyncSession, id: str) -> bool:
    """Total delete the archived registration request"""
    try:
        archived_user: ArchivePendingUser = await search_archived_registration_repository(db, id)
        if archived_user is None:
            logger.error(f"Archived user registraion not found with id: {id}")
            raise ResourceNotFoundException(f"No archived user with id {id}")
            return False 
        
        await db.delete(archived_user)
        await db.flush()
        await db.commit()
        logger.info(f"Successfully deleted archived user request {archived_user.complete_name}.")
        return True
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting archiviing user {id}: {str(e)}")
        raise InternalServerError("Failed to delete the archived pending user registration")
    

async def all_archived_registration_service(db: AsyncSession) -> List[PendingUser]:
    """Get all archived registration"""
    return await all_archived_registration_repository(db)

    
async def retrieve_archived_registration_service(db: AsyncSession, id: str) -> PendingUser:
    """Retrieve the archived registration back to pending state"""
    try:
        archived_user: ArchivePendingUser = await search_archived_registration_repository(db, id)
        if archived_user is None:
            logger.error(f"Archived user registraion not found with id: {id}")
            raise ResourceNotFoundException(f"No archived user with id {id}")
        
        back_to_pending_request = PendingUser(
            username=archived_user.username,
            password_hash=archived_user.password_hash,  
            role=archived_user.role,
            complete_name=archived_user.complete_name,
            complete_address=archived_user.complete_address,
            age=archived_user.age,
            is_active=archived_user.is_active,  
            failed_attempts=archived_user.failed_attempts,  
            banned_until=archived_user.banned_until,  
            last_login=archived_user.last_login,
        )
        
        # add archived request back to pending user table
        db.add(back_to_pending_request)
        await db.delete(archived_user)
        await db.commit()
        logger.info(f"Successfully retrieved the archived user request {archived_user.complete_name}.")
        return back_to_pending_request
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error retrieving archived user {id}: {str(e)}")
        raise InternalServerError("Failed to retrieve the archived pending user registration.")


async def get_all_users_service(db: AsyncSession) -> List[User]:
    return await get_all_users_repository(db)


async def get_user_by_id_service(db: AsyncSession, id: str) -> User:
    return await get_user_by_id_repository(db=db, id=id)


async def archive_active_user_service(db: AsyncSession, id: str, username: str, archived_by: str) -> ActiveUserArchives:
    try:
        user: User = await get_user_by_id_repository(db=db, id=id)
        if user is None:
            logger.error(f"Active user not found with id: {id}")
            raise ResourceNotFoundException(f"User not found with id: {id}")
        
        if not verify_action(user.username, username):
            raise BadRequestException(f"Username verification mismatched: {username}")
        
        archived_user = ActiveUserArchives(
            id=user.id,
            created_at=user.created_at,
            archived_at=datetime.now(timezone.utc),
            archived_by=archived_by,
            username=user.username,
            password_hash=user.password_hash,  
            role=user.role,
            complete_name=user.complete_name,
            complete_address=user.complete_address,
            age=user.age,
            is_active=user.is_active,  
            failed_attempts=user.failed_attempts,  
            banned_until=user.banned_until,  
            last_login=user.last_login, 
        )
        
        is_deleted = await delete_active_user_repository(db, id)
        if not is_deleted:
            logger.error("Active user cannot deleted from user table to archive. Y?")
            raise BadRequestException("Active user cannot deleted from users table to archive.")
        
        db.add(archived_user)
        await db.flush()  
        await db.commit()
    
        logger.info(f"Successfully archived active user {archived_user.complete_name}.")
        return archived_user
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error archiving active user {id}: {str(e)}")
        raise InternalServerError("Failed to archive active user.") 


async def all_archive_active_users_service(db: AsyncSession) -> List[ActiveUserArchives]:
    """Get all archived active users"""
    return await all_archive_active_users_repository(db)


async def retrieve_archived_active_user_service(db: AsyncSession, id: str, username: str) -> User:
    """
        Retrieve archived user back to active user state [action allowed only for admin]
        with safe username verification.
    """
    try:
        archived_user: ActiveUserArchives = await search_archived_active_user_repository(db, id)
        if archived_user is None:
            logger.error(f"Archived active user not found with id: {id}")
            raise ResourceNotFoundException(f"No archived user with id: {id}")
        
        if not verify_action(archived_user.username, username):
            raise BadRequestException(f"Username verification mismatched: {username}")
        
        back_to_active_user = User(
            id=archived_user.id,
            created_at=archived_user.created_at,
            username=archived_user.username,
            password_hash=archived_user.password_hash,  
            role=archived_user.role,
            complete_name=archived_user.complete_name,
            complete_address=archived_user.complete_address,
            age=archived_user.age,
            is_active=archived_user.is_active,  
            failed_attempts=archived_user.failed_attempts,  
            banned_until=archived_user.banned_until,  
            last_login=archived_user.last_login,
        )

                
        # add archived active user back to users table
        db.add(back_to_active_user)
        await db.delete(archived_user)
        await db.commit()
        logger.info(f"Successfully retrieved the archived user {archived_user.complete_name}.")
        return back_to_active_user
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error retrieving archived user {id}: {str(e)}")
        raise InternalServerError("Failed to retrieve the archived active user.")


async def delete_active_user_service(db: AsyncSession, id: str, username: str) -> bool:
    """Total delete the archived user"""
    try:
        archived_user: ActiveUserArchives = await search_archived_active_user_repository(db, id)
        if archived_user is None:
            logger.error(f"Archived user not found with id: {id}")
            raise ResourceNotFoundException(f"No archived user with id {id}")
            return False 
        
        if verify_action(archived_user.username, username):
            await db.delete(archived_user)
            await db.flush()
            await db.commit()
            logger.info(f"Successfully deleted archived user {archived_user.complete_name}.")
            return True
        
        logger.error(f"Username verification mismatched: {username}")
        return False
    except ResourceNotFoundException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting archived user {id}: {str(e)}")
        raise InternalServerError("Failed to delete the archived user.")
        
            
async def update_user_profile_service(
    db: AsyncSession, 
    id: str, 
    update_data: UpdateUserProfileSchema,
    current_user: UserSchema  
) -> User:
    """
        Update user profile with current admin credential verification
        [action allowed only for admin]
    """
    try:
        # Authenticate admin credentials - handle exceptions from auth_user
        try:
            admin: User = await auth_user(
                update_data.username, 
                update_data.password, 
                db
            )
        except (ResourceNotFoundException, UnauthorizedAccessException):
            raise UnauthorizedAccessException("Invalid admin credentials")
        
        # Verify the authenticated admin matches the current user
        if admin.id != current_user.id:
            raise ForbiddenAccessException("Credentials do not match current user")
        
        # Fetch the user to be updated
        user_to_update: User = await get_user_by_id_repository(db, id)
        if user_to_update is None:
            logger.error(f"User to update not found with id: {id}")
            raise ResourceNotFoundException(f"User not found with id: {id}")
        
        # Check if username is being changed and if it's available
        if update_data.update_info.username != user_to_update.username:
            existing_user = await search_user_by_username_repository(
                update_data.update_info.username, db
            )
            if existing_user and existing_user.id != id:
                raise DuplicateEntryException("Username already taken")
        
        # Get update data
        update_info = update_data.update_info
        
        # Build update dictionary
        update_dict = {}
        
        if update_info.username is not None:
            update_dict["username"] = update_info.username
            
        if update_info.complete_name is not None:
            update_dict["complete_name"] = update_info.complete_name
            
        if update_info.complete_address is not None:
            update_dict["complete_address"] = update_info.complete_address
            
        if update_info.age is not None:
            update_dict["age"] = update_info.age
            
        if update_info.role is not None:
            update_dict["role"] = update_info.role
        
        # Add password if provided (and hash it)
        if update_info.password:
            update_dict["password_hash"] = hash_password(update_info.password)
            
        # If nothing to update, return current user
        if not update_dict:
            logger.info("No changes detected in update request")
            return user_to_update
        
        # update statement
        stmt = (
            update(User)
            .where(User.id == id)
            .values(**update_dict)
        )
        
        await db.execute(stmt)
        await db.commit()
        
        # Fetch the updated user
        updated_user = await get_user_by_id_repository(db, id)
        await db.refresh(updated_user)
        
        logger.info(f"Successfully updated user profile {updated_user.complete_name}")
        return updated_user
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating user profile {id}: {str(e)}")
        raise InternalServerError("Failed to update user profile")
    