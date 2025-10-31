from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table
from src.app.db.base import Base

# Association table for group chat members (many-to-many)
chat_members = Table(
    'chat_members',
    Base.metadata,
    Column('chat_id', String(36), ForeignKey('chats.id'), primary_key=True),
    Column('user_id', String(36), ForeignKey('users.id'), primary_key=True),
    Column('joined_at', DateTime(timezone=True), default=datetime.now(timezone.utc)),
    Column('is_admin', Boolean, default=False)  # For group chat admins
)
