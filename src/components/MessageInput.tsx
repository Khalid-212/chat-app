import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useSocket } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

export function MessageInput() {
  const { selectedUser, user, token, addMessage } = useChatStore();
  const [inputMessage, setInputMessage] = useState("");
  const socket = useSocket();
  const typingTimeoutRef = useRef<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!socket || !selectedUser) return;

    socket.emit("typing_start", { receiverId: selectedUser.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { receiverId: selectedUser.id });
    }, 1000) as unknown as number;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !inputMessage.trim() || !user) return;

    if (selectedUser.isAI) {
      try {
        const res = await fetch(`${API_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            aiBotId: selectedUser.id,
            message: inputMessage,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          addMessage(data.userMessage);
          setInputMessage("");
        } else {
          console.error(data.error || "Failed to send message to AI");
        }
      } catch (error) {
        console.error("Error sending message to AI:", error);
      }
    } else {
      if (!socket) return;

      socket.emit("send_message", {
        senderId: user.id,
        receiverId: selectedUser.id,
        content: inputMessage,
      });

      socket.emit("typing_stop", { receiverId: selectedUser.id });
      setInputMessage("");
    }
  };

  if (!selectedUser) return null;

  return (
    <div className="border-t-2 border-black bg-white p-4">
      <form onSubmit={sendMessage} className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={handleInputChange}
          className="flex-1 border-2 border-black p-3 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 h-11"
          placeholder="Type a message..."
        />
        <Button className="rounded-none h-11 w-11 p-0 border-2 border-black bg-black text-white hover:bg-black/90 transition-colors">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

