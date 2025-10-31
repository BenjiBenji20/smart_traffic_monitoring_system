export interface ChatMessage {
    id: string;
    message: string;
    chat_id: string;
    user_id: string;
    user_name: string;
    created_at: string;
    message_type: "text" | "image" | "file" | "video";
}

export interface Chat {
    id: string;
    name: string | null;
    is_group: boolean;
    member_ids: string[]; // Array of user IDs
    last_message?: string | null;
    last_message_time?: string | null;
}

export interface ChatWindowState {
    chatId: string;
    isMinimized: boolean;
    otherUser?: {
        id: string;
        name: string;
        avatar?: string;
    };
    chatName?: string; // For group chats
    isGroup: boolean;
}

// WebSocket message types
export interface WSMessageData {
    type: "new_message" | "user_typing" | "user_joined" | "message_sent";
    chat_id: string;
    message?: string;
    message_type?: string;
    user_id?: string;
    user_name?: string;
    created_at?: string;
    data?: Record<string, unknown>;
}

// API Request/Response types
export interface CreatePersonalChatRequest {
    other_user_id: string;
}

export interface CreateGroupChatRequest {
    name: string;
    member_ids: string[];
}

export interface SendMessageRequest {
    message: string;
    chat_id: string;
    message_type?: "text" | "image" | "file" | "video";
}

export interface ChatResponse {
    id: string;
    name: string | null;
    is_group: boolean;
    member_ids: string[];
    last_message?: string;
    last_message_time?: string;
}

// Chat Manager State
export interface ChatState {
    openChats: ChatWindowState[];
    activeConnections: Map<string, WebSocket>;
    messages: Map<string, ChatMessage[]>; // chatId -> messages
}