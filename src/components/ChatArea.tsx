import { Card, CardContent } from "@/components/ui/card";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChatStore } from "@/store/useChatStore";

export function ChatArea() {
  const { selectedUser } = useChatStore();

  if (!selectedUser) {
    return (
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
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
}
