import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/store/useChatStore";
import { BackendStatus } from "./BackendStatus";
import { useBackendStatus } from "@/hooks/useBackendStatus";

interface SidebarProps {
  onShowCreateAI: () => void;
}

export function Sidebar({ onShowCreateAI }: SidebarProps) {
  const {
    user,
    selectedUser,
    users,
    typingUsers,
    onlineUsers,
    setSelectedUser,
    logout,
    unreadCounts,
  } = useChatStore();
  const backendStatus = useBackendStatus();

  if (!user) return null;

  return (
    <div className="w-1/3 max-w-sm border-r-2 border-black bg-white flex min-h-0 flex-col">
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
            onClick={onShowCreateAI}
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
                {(unreadCounts[u.id] ?? 0) > 0 && (
                  <Badge className="absolute top-0 -right-1 bg-red-500 text-white rounded-full px-1.5 py-0 text-[10px] min-w-5 flex items-center justify-center">
                    {unreadCounts[u.id]}
                  </Badge>
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
                    {u.isAI
                      ? "AI Assistant"
                      : onlineUsers.has(u.id)
                      ? "Online"
                      : "Offline"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-gray-200 p-2">
        <BackendStatus status={backendStatus} />
      </div>
    </div>
  );
}

