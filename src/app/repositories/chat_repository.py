from datetime import datetime, timezone
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.app.models.chat_members import chat_members
from src.app.models.chat import Chat, ChatMessage
from typing import List, Optional

class ChatRepository:
    async def get_personal_chat(self, db: AsyncSession, user1_id: str, user2_id: str) -> Optional[Chat]:
        """Find existing personal chat between two users"""
        
        stmt = (
            select(Chat)
            .join(chat_members, Chat.id == chat_members.c.chat_id)
            .where(
                and_(
                    Chat.is_group == False,
                    chat_members.c.user_id.in_([user1_id, user2_id])
                )
            )
            .group_by(Chat.id)
            .having(func.count(chat_members.c.user_id) == 2)  # Ensure exactly 2 members
        )
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    
    async def add_user_to_chat(self, db: AsyncSession, chat_id: str, user_id: str, is_admin: bool = False):
        """Add user to chat"""
        query = chat_members.insert().values(
            chat_id=chat_id,
            user_id=user_id,
            is_admin=is_admin,
            joined_at=datetime.now(timezone.utc)
        )
        await db.execute(query)
    
    
    async def create_personal_chat(self, db: AsyncSession, user1_id: str, user2_id: str) -> Chat:
        """Create a personal chat between two users"""
        # Check if personal chat already exists
        existing_chat = await self.get_personal_chat(db, user1_id, user2_id)
        if existing_chat:
            # Return existing chat with member_ids populated
            return existing_chat
            
        chat = Chat(is_group=False)
        db.add(chat)
        await db.flush()  # Get the chat ID
        
        # Add both users to chat
        await db.execute(
            chat_members.insert(), [
                {"chat_id": chat.id, "user_id": user1_id, "joined_at": datetime.now(timezone.utc), "is_admin": False},
                {"chat_id": chat.id, "user_id": user2_id, "joined_at": datetime.now(timezone.utc), "is_admin": False}
            ]
        )
        
        await db.flush()
        await db.refresh(chat)
        return chat
    
    
    async def create_group_chat(self, db: AsyncSession, creator_id: str, name: str, member_ids: List[str]) -> Chat:
        """Create a group chat with multiple users"""
        chat = Chat(is_group=True, name=name)
        db.add(chat)
        await db.flush()
        
        # Add creator as admin
        await self.add_user_to_chat(db, chat.id, creator_id, is_admin=True)
        
        # Add other members
        for user_id in member_ids:
            if user_id != creator_id:
                await self.add_user_to_chat(db, chat.id, user_id)
        
        await db.flush()
        await db.refresh(chat)
        return chat
    
    
    async def send_message(self, db: AsyncSession, chat_id: str, 
                user_id: str, message: str, message_type: str = "text"
            ) -> ChatMessage:
        """Send a message to chat"""
        chat_message = ChatMessage(
            chat_id=chat_id,
            user_id=user_id,
            message=message,
            message_type=message_type
        )
        db.add(chat_message)
        await db.flush() 
        await db.refresh(chat_message)
        return chat_message
    
    
    # In chat_repository.py
    async def get_chat_messages(self, db: AsyncSession, chat_id: str, limit: int = 50) -> List[ChatMessage]:
        """Get messages for a chat"""
        from sqlalchemy import desc
        
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.chat_id == chat_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(limit)
        )
        
        result = await db.execute(stmt)
        messages = result.scalars().all()
        return list(reversed(messages))  # Return oldest first


chat_repository = ChatRepository()