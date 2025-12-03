import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/useChatStore";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect } from "react";

export function MessageList() {
  const { messages, selectedUser, user, typingUsers } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTyping = selectedUser ? typingUsers.has(selectedUser.id) : false;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);
  return (
    <ScrollArea
      className="h-0 flex-1 bg-[#fafafa] p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="space-y-3">
        {messages.map((msg) => {
          const isMe = selectedUser?.isAI
            ? !msg.isFromAI
            : msg.senderId === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] border-2 border-black p-3 text-sm font-normal
                ${isMe ? "bg-black text-white" : "bg-white text-black"}
              `}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}
        {selectedUser && typingUsers.has(selectedUser.id) && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-black p-2.5 flex gap-1.5 items-center">
              <span
                className="w-2 h-2 bg-black rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-black rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-black rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
