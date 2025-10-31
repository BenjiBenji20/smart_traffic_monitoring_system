// components/chat/ChatWindow.tsx
import { useState, useRef, useEffect } from "react";
import { X, Minus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import type { ChatWindowState } from "@/types/chat.types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
    chatWindow: ChatWindowState;
    position: number; // 0, 1 for positioning
}

export function ChatWindow({ chatWindow, position }: ChatWindowProps) {
    const { closeChat, toggleMinimize, sendMessage, getMessages, currentUserId } = useChat(); // Add currentUserId
    const [messageInput, setMessageInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messages = getMessages(chatWindow.chatId);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            sendMessage(chatWindow.chatId, messageInput.trim());
            setMessageInput("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Get display name and initials
    const displayName = chatWindow.isGroup
        ? chatWindow.chatName
        : chatWindow.otherUser?.name;
    const initials = displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

    // Calculate position from bottom-left
    const leftPosition = 32 + position * 340; // 16px base + 340px per chat (320px width + 20px gap)

    return (
        <div
            className={cn(
                "fixed bottom-0 bg-background border border-border rounded-t-lg shadow-xl transition-all duration-200 z-50",
                chatWindow.isMinimized ? "h-14" : "h-[520px]"
            )}
            style={{
                left: `${leftPosition + 248}px`,
                width: "320px",
            }}
        >
            {/* Chat Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 rounded-t-lg cursor-pointer"
                onClick={() => toggleMinimize(chatWindow.chatId)}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">{displayName}</h3>
                        <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMinimize(chatWindow.chatId);
                        }}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeChat(chatWindow.chatId);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Chat Body - Only show when not minimized */}
            {!chatWindow.isMinimized && (
                <>
                    {/* Messages Area */}
                    <ScrollArea className="h-[396px] p-4">
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    // FIX: Check if message is from current user
                                    const isOwnMessage = msg.user_id === currentUserId;
                                    const timeAgo = getRelativeTime(msg.created_at);

                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex gap-2",
                                                isOwnMessage ? "flex-row-reverse" : "flex-row"
                                            )}
                                        >
                                            <Avatar className="h-7 w-7 flex-shrink-0">
                                                <AvatarFallback className="text-xs bg-muted">
                                                    {msg.user_name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={cn(
                                                    "flex flex-col gap-1 max-w-[70%]",
                                                    isOwnMessage ? "items-end" : "items-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "px-3 py-2 rounded-2xl text-sm break-words",
                                                        isOwnMessage
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                    )}
                                                >
                                                    {msg.message}
                                                </div>
                                                <span className="text-xs text-muted-foreground px-2">
                                                    {timeAgo}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex items-center gap-2 p-3 border-t">
                        <Input
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="flex-1 h-9 text-sm"
                        />
                        <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="h-9 w-9 flex-shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}