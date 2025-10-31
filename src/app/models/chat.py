from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from src.app.db.base import Base
from src.app.models.chat_members import chat_members
from datetime import datetime, timezone
import uuid


class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    
    # Chat metadata
    name = Column(String(100), nullable=True)  # For group chats, NULL for personal chats
    is_group = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)  # For group chats
    
    # Relationships
    members = relationship("User", secondary=chat_members, back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")
    

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    
    # Message content
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text", nullable=False)  # text, image, file, etc.
    
    # Foreign keys
    chat_id = Column(String(36), ForeignKey('chats.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    # For reply functionality
    reply_to_id = Column(String(36), ForeignKey('chat_messages.id'), nullable=True)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    user = relationship("User", back_populates="messages")
    reply_to = relationship("ChatMessage", remote_side=[id], post_update=True)
