import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useChatStore } from "@/store/useChatStore";

const API_URL = import.meta.env.VITE_API_URL;

interface CreateAIModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateAIModal({ open, onClose }: CreateAIModalProps) {
  const { user, token, setUsers } = useChatStore();
  const [aiName, setAiName] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [isCreatingAI, setIsCreatingAI] = useState(false);
  const [error, setError] = useState("");

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
        const usersRes = await fetch(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const usersData = await usersRes.json();
        setUsers(usersData.filter((u: any) => u.id !== user?.id));

        onClose();
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

  if (!open) return null;

  return (
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
                  onClose();
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
  );
}

