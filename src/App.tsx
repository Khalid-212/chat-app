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
    token,
    selectedUser,
    messages,
    users,
    typingUsers,
    onlineUsers,
    setUser,
    setToken,
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
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");
  const [showCreateAI, setShowCreateAI] = useState(false);
  const [aiName, setAiName] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [isCreatingAI, setIsCreatingAI] = useState(false);

  // Typing timeout ref
  const typingTimeoutRef = useRef<number | null>(null);

  // Check backend status with adaptive intervals
  useEffect(() => {
    let timeoutId: number | null = null;
    let isMounted = true;

    const checkBackend = async () => {
      if (!isMounted) return;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const res = await fetch(`${API_URL}/api/health`, {
          method: "GET",
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (!isMounted) return;
        
        const newStatus = res.ok ? "online" : "offline";
        setBackendStatus(newStatus);

        // Schedule next check based on status
        // 2 seconds if offline, 5 minutes (300000ms) if online
        const delay = newStatus === "offline" ? 2000 : 300000;
        
        timeoutId = setTimeout(() => {
          if (isMounted) {
            checkBackend();
          }
        }, delay);
      } catch (error) {
        if (!isMounted) return;
        
        setBackendStatus("offline");
        
        // If offline, check again in 2 seconds
        timeoutId = setTimeout(() => {
          if (isMounted) {
            checkBackend();
          }
        }, 2000);
      }
    };

    // Initial check
    setBackendStatus("checking");
    checkBackend();

    return () => {
      isMounted = false;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  // Initialize Socket
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

  // Fetch Users
  useEffect(() => {
    if (user && token) {
      fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch users");
          return res.json();
        })
        .then((data) => setUsers(data))
        .catch((err) => console.error("Error fetching users:", err));
    }
  }, [user, token, setUsers]);

  // Fetch Chat History
  useEffect(() => {
    if (user && selectedUser && token) {
      // For AI bots, messages are already fetched via the chat endpoint
      // For regular users, fetch from messages endpoint
      if (!selectedUser.isAI) {
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
      } else {
        // For AI, fetch messages with aiBotId filter
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
          .catch((err) => console.error("Error fetching AI messages:", err));
      }
    }
  }, [user, selectedUser, token, setMessages]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailInput || !passwordInput) {
      setError("Email and password are required");
      return;
    }

    if (isSignup && !nameInput) {
      setError("Name is required for signup");
      return;
    }

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup
        ? {
            email: emailInput,
            password: passwordInput,
            name: nameInput,
            picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${
              nameInput || emailInput
            }`,
          }
        : {
            email: emailInput,
            password: passwordInput,
          };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      setUser(data.user);
      setToken(data.token);
      setEmailInput("");
      setPasswordInput("");
      setNameInput("");
    } catch (error) {
      console.error("Auth failed", error);
      setError("Network error. Please try again.");
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !inputMessage.trim() || !user) return;

    // Check if selected user is an AI
    if (selectedUser.isAI) {
      // Send to AI API
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
          addMessage(data.aiMessage);
          setInputMessage("");
        } else {
          setError(data.error || "Failed to send message to AI");
        }
      } catch (error) {
        console.error("Error sending message to AI:", error);
        setError("Failed to send message to AI");
      }
    } else {
      // Send to regular user via socket
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

  const handleCreateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiName || !aiDescription) {
      setError("Name and description are required");
      return;
    }

    setIsCreatingAI(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/ai/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: aiName,
          description: aiDescription,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh users list to include new AI
        const usersRes = await fetch(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const usersData = await usersRes.json();
        setUsers(usersData.filter((u: any) => u.id !== user?.id));

        setShowCreateAI(false);
        setAiName("");
        setAiDescription("");
        setError("");
      } else {
        setError(data.error || "Failed to create AI bot");
      }
    } catch (error) {
      console.error("Error creating AI bot:", error);
      setError("Failed to create AI bot");
    } finally {
      setIsCreatingAI(false);
    }
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
              {isSignup ? "Create Account" : "Login"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm">
                  {error}
                </div>
              )}
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
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your display name"
                    required
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full rounded-none border-2 border-black bg-black text-white hover:bg-black/90 transition-colors"
              >
                {isSignup ? "Sign Up" : "Login"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError("");
                  }}
                  className="text-black underline hover:no-underline"
                >
                  {isSignup
                    ? "Already have an account? Login"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    backendStatus === "online"
                      ? "bg-green-500"
                      : backendStatus === "offline"
                      ? "bg-red-500"
                      : "bg-yellow-500 animate-pulse"
                  }`}
                />
                <span>
                  {backendStatus === "online"
                    ? "Backend online"
                    : backendStatus === "offline"
                    ? "Backend offline"
                    : "Checking..."}
                </span>
              </div>
            </div>
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
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Contacts
            </h3>
            <Button
              onClick={() => setShowCreateAI(true)}
              size="sm"
              className="h-6 px-2 text-[10px] rounded-none border border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
            >
              + AI
            </Button>
          </div>
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
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm truncate">{u.name}</span>
                    {u.isAI && (
                      <Badge className="text-[8px] px-1 py-0 h-3 bg-purple-500 text-white border-0 rounded-none">
                        AI
                      </Badge>
                    )}
                  </div>
                  {typingUsers.has(u.id) ? (
                    <span className="text-[10px] animate-pulse text-gray-500 font-medium">
                      typing...
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      {u.isAI ? "AI Assistant" : onlineUsers.has(u.id) ? "Online" : "Offline"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendStatus === "online"
                  ? "bg-green-500"
                  : backendStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span>
              {backendStatus === "online"
                ? "Backend online"
                : backendStatus === "offline"
                ? "Backend offline"
                : "Checking..."}
            </span>
          </div>
        </div>
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
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-semibold leading-none">
                      {selectedUser.name}
                    </h2>
                    {selectedUser.isAI && (
                      <Badge className="text-[8px] px-1 py-0 h-3 bg-purple-500 text-white border-0 rounded-none">
                        AI
                      </Badge>
                    )}
                  </div>
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
                  // For AI messages, check isFromAI flag; for regular messages, check senderId
                  const isMe = selectedUser?.isAI 
                    ? !msg.isFromAI 
                    : msg.senderId === user.id;
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

      {/* Create AI Modal */}
      {showCreateAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2 border-black rounded-none shadow-sm bg-white">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Create AI Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAI} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="ai-name" className="text-sm font-medium">
                    AI Name
                  </Label>
                  <Input
                    id="ai-name"
                    type="text"
                    className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                    placeholder="e.g., Funny Roasting Bot"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <textarea
                    id="ai-description"
                    className="w-full min-h-[100px] border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2 resize-none"
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="Describe the AI's personality and behavior (e.g., 'A funny roasting bot that makes witty jokes')"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateAI(false);
                      setAiName("");
                      setAiDescription("");
                      setError("");
                    }}
                    variant="outline"
                    className="flex-1 rounded-none border-2 border-black bg-white text-black hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingAI}
                    className="flex-1 rounded-none border-2 border-black bg-black text-white hover:bg-black/90 transition-colors"
                  >
                    {isCreatingAI ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
