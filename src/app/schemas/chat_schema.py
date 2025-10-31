from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# FOR CREATING NEW MESSAGES
class MessageCreate(BaseModel):
    message: str
    chat_id: str
    message_type: str = "text" # text, file, image, video

# FOR CREATING NEW CHATS  
class ChatCreate(BaseModel):
    name: Optional[str] = None  # Only for group chats
    is_group: bool = False
    member_ids: List[str]  # Users to add to chat

# WHAT A MESSAGE LOOKS LIKE WHEN SENT/RECEIVED
class MessageResponse(BaseModel):
    id: str
    message: str
    chat_id: str
    user_id: str
    user_name: str  
    created_at: datetime
    message_type: str = "text"
    
    class Config:
        from_attributes = True

# SIMPLIFIED CHAT RESPONSE - FIXED VERSION
class ChatResponse(BaseModel):
    id: str
    name: Optional[str]
    is_group: bool
    member_ids: List[str] 
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# FOR WEBSOCKET COMMUNICATION
class WSMessage(BaseModel):
    type: str  # "new_message", "user_typing", "user_joined"
    chat_id: str
    data: dict  # Flexible for different types