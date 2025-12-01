import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export type User = {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
};

interface ChatState {
  user: User | null;
  token: string | null;
  selectedUser: User | null;
  messages: Message[];
  users: User[];
  typingUsers: Set<string>; // Set of user IDs who are typing
  onlineUsers: Set<string>; // Set of user IDs who are online

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setSelectedUser: (user: User | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setUsers: (users: User[]) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;
  updateUserStatus: (userId: string, status: 'online' | 'offline') => void;
  logout: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      selectedUser: null,
      messages: [],
      users: [],
      typingUsers: new Set(),
      onlineUsers: new Set(),

      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      setSelectedUser: (selectedUser) => set({ selectedUser }),

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setUsers: (users) => set({ users }),

      setTypingUser: (userId, isTyping) =>
        set((state) => {
          const newTypingUsers = new Set(state.typingUsers);
          if (isTyping) {
            newTypingUsers.add(userId);
          } else {
            newTypingUsers.delete(userId);
          }
          return { typingUsers: newTypingUsers };
        }),

      setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),

      updateUserStatus: (userId, status) =>
        set((state) => {
          const newOnlineUsers = new Set(state.onlineUsers);
          if (status === 'online') {
            newOnlineUsers.add(userId);
          } else {
            newOnlineUsers.delete(userId);
          }
          return { onlineUsers: newOnlineUsers };
        }),

      logout: () => {
        localStorage.removeItem("chat-storage");
        set({ user: null, token: null, selectedUser: null, messages: [], onlineUsers: new Set() });
      },
    }),
    {
      name: "chat-storage", // unique name
      partialize: (state) => ({ user: state.user, token: state.token }), // Persist user and token
    }
  )
);
