import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { AuthForm } from "@/components/AuthForm";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { CreateAIModal } from "@/components/CreateAIModal";
import { useSocket } from "@/hooks/useSocket";
import { useUsers } from "@/hooks/useUsers";
import { useMessages } from "@/hooks/useMessages";

export default function App() {
  const { user } = useChatStore();
  const [showCreateAI, setShowCreateAI] = useState(false);

  // Initialize hooks
  useSocket();
  useUsers();
  useMessages();

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden text-black"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "#fafafa",
      }}
    >
      <Sidebar onShowCreateAI={() => setShowCreateAI(true)} />
      <ChatArea />
      <CreateAIModal
        open={showCreateAI}
        onClose={() => setShowCreateAI(false)}
      />
    </div>
  );
}
