"""
    Quick implementations for MVP. 
    Deadline is near. Soon to be optimized.
"""
from typing import Dict, List, Set
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.repositories import chat_repository
from src.app.repositories.user_repository import get_all_users_repository, get_user_by_id_repository
from src.app.repositories.chat_repository import chat_repository
from src.app.models.user import User

async def get_user_by_id_service(id: str, db: AsyncSession) -> User:
    return await get_user_by_id_repository(id, db)
    

async def get_all_users_service(db: AsyncSession) -> List[User]:
    return await get_all_users_repository(db)


class DashboardMessengerManager:
    """Manages client for group chat connected to socket"""
    def __init__(self):
        # set of ws connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # ws mapping for pm
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        
    async def register_ws_connection(self, ws: WebSocket, chat_id: str, user_id: str):
        "register new websocket connection"
        await ws.accept()
        
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        self.active_connections[chat_id].add(ws)
        
        # store user id for pm
        self.user_connections[user_id] = ws
        
    
    async def send_chats(self, chat_id: str, message: dict):
        """send message to all users in group chat"""
        if chat_id in self.active_connections:
            disconnected = set()
            for c in self.active_connections[chat_id]:
                try:
                    await c.send_json(message)
                except:
                    disconnected.add(c)
                    
            # clean up disconnected clients
            self.active_connections[chat_id] -= disconnected

    
    async def unregister_ws_client(self, ws: WebSocket, chat_id: str, user_id: str):
        "Unregister the client that leaves the connection"
        if chat_id in self.active_connections:
            self.active_connections[chat_id].discard(ws)
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]
        
        # Remove user connection
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        
        
dashboardChatManager = DashboardMessengerManager()

async def save_chats_service(db: AsyncSession, chat_id: str, user_id: str, message_text: str, message_type: str = "text"):
    """Save chats to the database using the repository"""
    chat_message = await chat_repository.send_message(
        db, chat_id, user_id, message_text, message_type
    )
    
    # Get user name for the broadcast
    user = await db.get(User, user_id)
    user_name = user.complete_name if user else "Unknown"
    
    # Prepare message data for broadcast
    message_data = {
        "type": "new_message",
        "message": chat_message.message,
        "message_type": chat_message.message_type,
        "user_id": user_id,
        "user_name": user_name,
        "chat_id": chat_id,
        "created_at": chat_message.created_at.isoformat()
    }
    
    # Broadcast to all connected clients in this chat
    await dashboardChatManager.send_chats(chat_id, message_data)
    