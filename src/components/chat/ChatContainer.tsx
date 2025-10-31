// components/chat/ChatContainer.tsx
import { useChat } from "@/contexts/ChatContext";
import { ChatWindow } from "./ChatWindow";

/**
 * Container that renders all open chat windows
 * Should be placed at the root level of your app
 */
export function ChatContainer() {
    const { openChats } = useChat();

    return (
        <>
            {openChats.map((chatWindow, index) => (
                <ChatWindow
                    key={chatWindow.chatId}
                    chatWindow={chatWindow}
                    position={index}
                />
            ))}
        </>
    );
}