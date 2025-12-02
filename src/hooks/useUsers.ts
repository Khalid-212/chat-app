import { useEffect } from "react";
import { useChatStore } from "@/store/useChatStore";

const API_URL = import.meta.env.VITE_API_URL;

export function useUsers() {
  const { user, token, setUsers } = useChatStore();

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
}

