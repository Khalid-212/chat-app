import { useEffect } from "react";
import { useChatStore } from "@/store/useChatStore";

const API_URL = import.meta.env.VITE_API_URL;

export function useMessages() {
  const { user, selectedUser, token, setMessages } = useChatStore();

  useEffect(() => {
    if (user && selectedUser && token) {
      fetch(`${API_URL}/api/messages/${selectedUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch messages");
          return res.json();
        })
        .then((data) => setMessages(data))
        .catch((err) => console.error("Error fetching messages:", err));
    }
  }, [user, selectedUser, token, setMessages]);
}

