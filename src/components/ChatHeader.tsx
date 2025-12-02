import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/store/useChatStore";

export function ChatHeader() {
  const { selectedUser, typingUsers, onlineUsers } = useChatStore();

  if (!selectedUser) return null;

  return (
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
              {selectedUser.isAI
                ? "Online"
                : onlineUsers.has(selectedUser.id)
                ? "Online"
                : "Offline"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

