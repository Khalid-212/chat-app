import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { io, Socket } from "socket.io-client";
import { Send } from "lucide-react";
import { useChatStore, type Message } from "@/store/useChatStore";

// API Helper
const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  // Global State
  const {
    user,
    selectedUser,
    messages,
    users,
    typingUsers,
    onlineUsers,
    setUser,
    setSelectedUser,
    setMessages,
    addMessage,
    setUsers,
    setTypingUser,
    updateUserStatus,
    setOnlineUsers,
    logout,
  } = useChatStore();

  // Local State
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket
  useEffect(() => {
    if (user) {
      const newSocket = io("http://localhost:3000", {
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

  // Fetch Users
  useEffect(() => {
    if (user) {
      fetch(`${API_URL}/users`)
        .then((res) => res.json())
        .then((data) => setUsers(data.filter((u: any) => u.id !== user.id)));
    }
  }, [user, setUsers]);

  // Fetch Chat History
  useEffect(() => {
    if (user && selectedUser) {
      fetch(`${API_URL}/messages/${user.id}/${selectedUser.id}`)
        .then((res) => res.json())
        .then((data) => setMessages(data));
    }
  }, [user, selectedUser, setMessages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          name: nameInput,
          picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nameInput}`,
        }),
      });
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!socket || !selectedUser) return;

    socket.emit("typing_start", { receiverId: selectedUser.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { receiverId: selectedUser.id });
    }, 1000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !selectedUser || !inputMessage.trim()) return;

    socket.emit("send_message", {
      senderId: user?.id,
      receiverId: selectedUser.id,
      content: inputMessage,
    });

    socket.emit("typing_stop", { receiverId: selectedUser.id });
    setInputMessage("");
  };

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundColor: "#fafafa",
        }}
      >
        <Card className="w-full max-w-md border-2 border-black rounded-none shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Join Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Display Name"
                  required
                />
              </div>
              <Button className="w-full rounded-none border-2 border-black bg-black text-white hover:bg-black/90 transition-colors">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen text-black"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "#fafafa",
      }}
    >
      {/* Sidebar / User List */}
      <div className="w-1/3 max-w-sm border-r-2 border-black bg-white flex flex-col">
        <div className="border-b-2 border-black p-4 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-black rounded-full">
                <AvatarImage src={user.picture || ""} />
                <AvatarFallback className="font-semibold bg-white text-black">
                  {user.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-sm">{user.name}</h2>
                <Badge
                  variant="outline"
                  className="rounded-none border-black bg-green-500 text-white text-[10px] px-1.5 py-0 h-4 font-medium"
                >
                  ONLINE
                </Badge>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs hover:bg-black hover:text-white rounded-none border border-transparent hover:border-black transition-colors"
            >
              Logout
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-1">
            Contacts
          </h3>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`flex cursor-pointer items-center gap-3 border-2 border-black p-3 transition-all relative
                ${
                  selectedUser?.id === u.id
                    ? "bg-black text-white"
                    : "bg-white hover:bg-gray-50"
                }
              `}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-black rounded-full">
                    <AvatarImage src={u.picture || ""} />
                    <AvatarFallback className="font-semibold bg-transparent border border-black text-xs">
                      {u.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.has(u.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-sm truncate">{u.name}</span>
                  {typingUsers.has(u.id) ? (
                    <span className="text-[10px] animate-pulse text-gray-500 font-medium">
                      typing...
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      {onlineUsers.has(u.id) ? "Online" : "Offline"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black bg-white p-4 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9 border-2 border-black rounded-full">
                    <AvatarImage src={selectedUser.picture || ""} />
                    <AvatarFallback className="font-semibold">
                      {selectedUser.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.has(selectedUser.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-semibold leading-none">
                    {selectedUser.name}
                  </h2>
                  {typingUsers.has(selectedUser.id) ? (
                    <span className="text-xs font-medium text-gray-500 animate-pulse mt-0.5">
                      typing...
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400 mt-0.5">
                      {onlineUsers.has(selectedUser.id) ? "Online" : "Offline"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea
              className="flex-1 bg-[#fafafa] p-6"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] border-2 border-black p-3 text-sm font-normal
                        ${isMe ? "bg-black text-white" : "bg-white text-black"}
                      `}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {typingUsers.has(selectedUser.id) && (
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
              </div>
            </ScrollArea>

            {/* Input */}
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
          </>
        ) : (
          <div
            className="flex flex-1 items-center justify-center text-center p-4"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundColor: "#fafafa",
            }}
          >
            <Card className="max-w-md w-full border-2 border-black rounded-none shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">No Chat Selected</h3>
                <p className="text-sm text-gray-600">
                  Select a user from the sidebar to start messaging.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
