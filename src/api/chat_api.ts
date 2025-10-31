// api/chat_api.ts
import type { 
    ChatMessage,
    ChatResponse, 
    CreateGroupChatRequest 
} from "@/types/chat.types";
import securedRequest from "./authentication_api";


// Add request interceptor to include auth token
securedRequest.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// REST API calls
export const chatApi = {
    /**
     * Create or get existing personal chat
     */
    async createPersonalChat(otherUserId: string): Promise<ChatResponse> {
        const response = await securedRequest.post<ChatResponse>(
            `/user/action/chats/personal?other_user_id=${otherUserId}`
        );
        return response.data;
    },

    /**
     * Create a group chat
     */
    async createGroupChat(data: CreateGroupChatRequest): Promise<ChatResponse> {
        const response = await securedRequest.post<ChatResponse>(
            `/user/action/chats/group`,
            {
                name: data.name,
                is_group: true,
                member_ids: data.member_ids,
            }
        );
        return response.data;
    },

    /**
     * Get all chats for current user
     */
    async getMyChats(): Promise<ChatResponse[]> {
        const response = await securedRequest.get<ChatResponse[]>(
            `/user/action/chats/my`
        );
        return response.data;
    },

    /**
     * Get messages for a chat
     */
    async getChatMessages(chatId: string): Promise<ChatMessage[]> {
        const response = await securedRequest.get<ChatMessage[]>(
            `/user/action/chats/${chatId}/messages`
        );
        return response.data;
    },
};

// WebSocket Connection Manager
export class ChatWebSocketManager {
    private ws: WebSocket | null = null;
    private chatId: string;
    private userId: string;
    private onMessageCallback?: (data: unknown) => void;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor(chatId: string, userId: string) {
        this.chatId = chatId;
        this.userId = userId;
    }

    /**
     * Connect to WebSocket
     */
    connect(onMessage: (data: unknown) => void): void {
        this.onMessageCallback = onMessage;

        try {
            // Determine protocol (ws or wss based on current location)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/user/action/ws/chat/${this.chatId}/user/${this.userId}`;
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.onMessageCallback?.(data);
                } catch (error) {
                    console.error("[WebSocket] Failed to parse message:", error);
                }
            };

            this.ws.onerror = (error) => {
                console.error("[WebSocket] Error:", error);
            };

            this.ws.onclose = () => {
                this.attemptReconnect();
            };
        } catch (error) {
            console.error("[WebSocket] Failed to create connection:", error);
        }
    }

    /**
     * Send message through WebSocket
     */
    sendMessage(message: string, messageType: string = "text"): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    message,
                    message_type: messageType,
                })
            );
        } else {
            console.error("[WebSocket] Not connected");
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Attempt to reconnect
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                if (this.onMessageCallback) {
                    this.connect(this.onMessageCallback);
                }
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
};