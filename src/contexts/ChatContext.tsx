// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type {
    ChatWindowState,
    ChatMessage,
    WSMessageData
} from "@/types/chat.types";
import { ChatWebSocketManager, chatApi } from "@/api/chat_api";
import { toast } from "sonner";
import type { UserModel } from "@/types/user_model";

interface ChatContextType {
    openChats: ChatWindowState[];
    messages: Map<string, ChatMessage[]>;
    currentUserId: string;
    openPersonalChat: (otherUser: UserModel) => Promise<void>;
    openGroupChat: (chatId: string, chatName: string) => void;
    closeChat: (chatId: string) => void;
    toggleMinimize: (chatId: string) => void;
    sendMessage: (chatId: string, message: string) => void;
    getMessages: (chatId: string) => ChatMessage[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const MAX_OPEN_CHATS = 2;

export function ChatProvider({
    children,
    currentUserId
}: {
    children: React.ReactNode;
    currentUserId: string;
}) {
    const [openChats, setOpenChats] = useState<ChatWindowState[]>([]);
    const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(new Map());
    const [wsConnections] = useState<Map<string, ChatWebSocketManager>>(new Map());

    /**
     * Handle incoming WebSocket messages
     */
    const handleWebSocketMessage = useCallback((chatId: string, data: WSMessageData) => {
        if (data.type === "new_message") {
            const newMessage: ChatMessage = {
                id: crypto.randomUUID(),
                message: data.message || "",
                chat_id: chatId,
                user_id: data.user_id || "",
                user_name: data.user_name || "Unknown",
                created_at: data.created_at || new Date().toISOString(),
                message_type: (data.message_type as ChatMessage["message_type"]) || "text",
            };

            setMessages((prev) => {
                const updated = new Map(prev);
                const chatMessages = updated.get(chatId) || [];
                updated.set(chatId, [...chatMessages, newMessage]);
                return updated;
            });
        }
    }, []);

    /**
     * Open a personal chat with another user
     */
    /**
     * Open a personal chat with another user
     */
    const openPersonalChat = useCallback(async (otherUser: UserModel) => {
        try {
            // Check if chat already open
            const existingChat = openChats.find(
                (chat) => !chat.isGroup && chat.otherUser?.id === otherUser.id
            );

            if (existingChat) {
                // Just unminimize if exists
                setOpenChats((prev) =>
                    prev.map((chat) =>
                        chat.chatId === existingChat.chatId
                            ? { ...chat, isMinimized: false }
                            : chat
                    )
                );
                return;
            }

            // Check max chats limit BEFORE making API call
            if (openChats.length >= MAX_OPEN_CHATS) {
                toast.error(`You can only have ${MAX_OPEN_CHATS} chats open at once`);
                return;
            }

            // Create/get chat from backend
            const chatResponse = await chatApi.createPersonalChat(otherUser.id);

            // Load previous messages
            const previousMessages = await chatApi.getChatMessages(chatResponse.id);

            // Store messages in state
            setMessages((prev) => {
                const updated = new Map(prev);
                updated.set(chatResponse.id, previousMessages);
                return updated;
            });

            // Create new chat window state
            const newChatWindow: ChatWindowState = {
                chatId: chatResponse.id,
                isMinimized: false,
                otherUser: {
                    id: otherUser.id,
                    name: otherUser.complete_name,
                },
                isGroup: false,
            };

            setOpenChats((prev) => [...prev, newChatWindow]);

            // Initialize WebSocket connection
            const wsManager = new ChatWebSocketManager(chatResponse.id, currentUserId);
            wsManager.connect((data) => handleWebSocketMessage(chatResponse.id, data as WSMessageData));
            wsConnections.set(chatResponse.id, wsManager);

            toast.success(`Chat opened with ${otherUser.complete_name}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Failed to open personal chat:", error);

            // Better error messages
            if (error.response?.status === 401) {
                toast.error("Authentication failed. Please log in again.");
            } else if (error.response?.status === 404) {
                toast.error("User not found");
            } else {
                toast.error("Failed to open chat. Please try again.");
            }
        }
    }, [openChats, currentUserId, handleWebSocketMessage, wsConnections]);

    /**
     * Open a group chat
     */
    const openGroupChat = useCallback(async (chatId: string, chatName: string) => {
        // Check if already open
        const existingChat = openChats.find((chat) => chat.chatId === chatId);
        if (existingChat) {
            setOpenChats((prev) =>
                prev.map((chat) =>
                    chat.chatId === chatId ? { ...chat, isMinimized: false } : chat
                )
            );
            return;
        }

        if (openChats.length >= MAX_OPEN_CHATS) {
            toast.error(`You can only have ${MAX_OPEN_CHATS} chats open at once`);
            return;
        }

        try {
            // Load previous messages
            const previousMessages = await chatApi.getChatMessages(chatId);

            // Store messages in state
            setMessages((prev) => {
                const updated = new Map(prev);
                updated.set(chatId, previousMessages);
                return updated;
            });

            const newChatWindow: ChatWindowState = {
                chatId,
                isMinimized: false,
                chatName,
                isGroup: true,
            };

            setOpenChats((prev) => [...prev, newChatWindow]);

            // Initialize WebSocket for group chat
            const wsManager = new ChatWebSocketManager(chatId, currentUserId);
            wsManager.connect((data) => handleWebSocketMessage(chatId, data as WSMessageData));
            wsConnections.set(chatId, wsManager);

            toast.success(`Group chat ${chatName} opened`);
        } catch (error) {
            console.error("Failed to open group chat:", error);
            toast.error("Failed to open group chat");
        }
    }, [openChats, currentUserId, handleWebSocketMessage, wsConnections]);

    /**
     * Close a chat
     */
    const closeChat = useCallback((chatId: string) => {
        // Disconnect WebSocket
        const wsManager = wsConnections.get(chatId);
        if (wsManager) {
            wsManager.disconnect();
            wsConnections.delete(chatId);
        }

        // Remove from open chats
        setOpenChats((prev) => prev.filter((chat) => chat.chatId !== chatId));
    }, [wsConnections]);

    /**
     * Toggle minimize state
     */
    const toggleMinimize = useCallback((chatId: string) => {
        setOpenChats((prev) =>
            prev.map((chat) =>
                chat.chatId === chatId
                    ? { ...chat, isMinimized: !chat.isMinimized }
                    : chat
            )
        );
    }, []);

    /**
     * Send a message
     */
    const sendMessage = useCallback((chatId: string, message: string) => {
        const wsManager = wsConnections.get(chatId);
        if (wsManager && wsManager.isConnected()) {
            wsManager.sendMessage(message);
        } else {
            toast.error("Not connected to chat");
        }
    }, [wsConnections]);

    /**
     * Get messages for a chat
     */
    const getMessages = useCallback((chatId: string): ChatMessage[] => {
        return messages.get(chatId) || [];
    }, [messages]);

    return (
        <ChatContext.Provider
            value={{
                openChats,
                messages,
                currentUserId,
                openPersonalChat,
                openGroupChat,
                closeChat,
                toggleMinimize,
                sendMessage,
                getMessages,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within ChatProvider");
    }
    return context;
}