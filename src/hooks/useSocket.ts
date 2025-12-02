import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore, type Message } from "@/store/useChatStore";

const API_URL = import.meta.env.VITE_API_URL;

export function useSocket() {
  const {
    user,
    selectedUser,
    addMessage,
    setTypingUser,
    updateUserStatus,
    setOnlineUsers,
  } = useChatStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(API_URL, {
        query: { userId: user.id },
      });

      newSocket.on("connect", () => {
        console.log("Connected to socket");
      });

      newSocket.on("receive_message", (message: Message) => {
        if (
          selectedUser &&
          (message.senderId === selectedUser.id || message.senderId === user.id)
        ) {
          addMessage(message);
        }
      });

      newSocket.on("message_sent", (message: Message) => {
        addMessage(message);
      });

      newSocket.on("user_typing", ({ userId }: { userId: string }) => {
        setTypingUser(userId, true);
      });

      newSocket.on("user_stopped_typing", ({ userId }: { userId: string }) => {
        setTypingUser(userId, false);
      });

      newSocket.on(
        "user_status",
        ({
          userId,
          status,
        }: {
          userId: string;
          status: "online" | "offline";
        }) => {
          updateUserStatus(userId, status);
        }
      );

      newSocket.on("online_users", (userIds: string[]) => {
        setOnlineUsers(userIds);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [
    user,
    selectedUser,
    addMessage,
    setTypingUser,
    updateUserStatus,
    setOnlineUsers,
  ]);

  return socket;
}

