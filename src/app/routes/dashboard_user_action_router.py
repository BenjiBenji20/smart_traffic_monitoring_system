"""
    Quick implementations for MVP. 
    Deadline is near. Soon to be optimized.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models.chat_members import chat_members
from src.app.dependencies.get_current_user_depends import get_current_user
from src.app.models.user import User
from src.app.schemas.chat_schema import ChatCreate, ChatResponse, MessageResponse
from src.app.schemas.user_schema import UserSchema
from src.app.db.db_session import get_async_db

from src.app.exceptions.custom_exceptions import ResourceNotFoundException
from src.app.services.dashboard_user_action_service import get_all_users_service, get_user_by_id_service, dashboardChatManager, save_chats_service
from src.app.repositories.chat_repository import chat_repository

dashboard_user_action_router = APIRouter(prefix="/api/user/action", tags=["user activities"])


@dashboard_user_action_router.get("/user/{id}", response_model=UserSchema)
async def get_user_by_id_router(id: str, db: AsyncSession = Depends(get_async_db)):
  try:
    user: UserSchema = await get_user_by_id_service(id, db)
    
    if user is None:
      raise ResourceNotFoundException(f"User not found by id: {id}")
    
    return user
  except Exception as e:
    logging.error(f"Server error while fetching user")
    raise HTTPException(status_code=404, detail=str(e))
  
  
@dashboard_user_action_router.get("/all-users", response_model=List[UserSchema])
async def get_all_users_router(db: AsyncSession = Depends(get_async_db)):
  return await get_all_users_service(db)
  

# === WebSocket Service for Real-time multi and single-user messages ===
# === Personal Chat WebSocket ===
@dashboard_user_action_router.websocket("/ws/chat/{chat_id}/user/{user_id}")
async def personal_chat_websocket(ws: WebSocket, chat_id: str, user_id: str, db: AsyncSession = Depends(get_async_db)):
    await dashboardChatManager.register_ws_connection(ws, chat_id, user_id)
    
    try:
        while True:
            # Receive message data
            data: dict = await ws.receive_json()
            message_text = data.get("message")
            message_type = data.get("message_type", "text")
            
            # Save to database and broadcast
            await save_chats_service(
                chat_id=chat_id, user_id=user_id, message_text=message_text,
                message_type=message_type, db=db
            )
            
            # Commit the transaction
            await db.commit()
                
    except WebSocketDisconnect:
        await dashboardChatManager.unregister_ws_client(ws, chat_id, user_id)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await db.rollback()
    finally:
        await dashboardChatManager.unregister_ws_client(ws, chat_id, user_id)


# === Group Chat WebSocket ===
@dashboard_user_action_router.websocket("/ws/group-chat/{chat_id}/user/{user_id}")
async def group_chat_websocket(websocket: WebSocket, chat_id: str, user_id: str, db: AsyncSession = Depends(get_async_db)):
    await dashboardChatManager.register_ws_connection(websocket, chat_id, user_id)
    
    try:
        while True:
            data: dict = await websocket.receive_json()
            message_text = data.get("message")
            message_type = data.get("message_type", "text")
            
            # Save to database and broadcast
            await save_chats_service(
                chat_id=chat_id, user_id=user_id, message_text=message_text,
                message_type=message_type, db=db
            )
            
            # Commit the transaction
            await db.commit()
                
    except WebSocketDisconnect:
        await dashboardChatManager.unregister_ws_client(websocket, chat_id, user_id)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await db.rollback()
    finally:
        await dashboardChatManager.unregister_ws_client(websocket, chat_id, user_id)
        

# === REST APIs for control ===
@dashboard_user_action_router.post("/chats/personal", response_model=ChatResponse)
async def create_personal_chat(
    other_user_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_async_db)
):
    """Create or get existing personal chat"""
    chat = await chat_repository.create_personal_chat(db, current_user.id, other_user_id)
    
    # Get member IDs for the response
    member_ids_stmt = select(chat_members.c.user_id).where(chat_members.c.chat_id == chat.id)
    member_ids_result = await db.execute(member_ids_stmt)
    member_ids = [row[0] for row in member_ids_result]
    
    # Convert to ChatResponse
    return ChatResponse(
        id=chat.id,
        name=chat.name,
        is_group=chat.is_group,
        member_ids=member_ids,
        last_message=None,  # You can populate this if needed
        last_message_time=None
    )


@dashboard_user_action_router.post("/chats/group", response_model=ChatResponse)
async def create_group_chat(
    chat_data: ChatCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_async_db)
):
    """Create a group chat"""
    chat = await chat_repository.create_group_chat(
        db, current_user.id, chat_data.name, chat_data.member_ids
    )
    return chat


@dashboard_user_action_router.get("/chats/my", response_model=List[ChatResponse])
async def get_my_chats(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_async_db)
):
    """Get all chats for current user"""
    user = await db.get(User, current_user.id)
    return user.chats


@dashboard_user_action_router.get("/chats/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """Get all messages for a chat"""
    # Get messages from repository
    messages = await chat_repository.get_chat_messages(db, chat_id)
    
    # Convert to response format
    response_messages = []
    for msg in messages:
        user = await db.get(User, msg.user_id)
        response_messages.append(MessageResponse(
            id=msg.id,
            message=msg.message,
            chat_id=msg.chat_id,
            user_id=msg.user_id,
            user_name=user.complete_name if user else "Unknown",
            created_at=msg.created_at,
            message_type=msg.message_type
        ))
    
    return response_messages