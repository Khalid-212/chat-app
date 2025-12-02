import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useChatStore } from "@/store/useChatStore";
import { BackendStatus } from "./BackendStatus";
import { useBackendStatus } from "@/hooks/useBackendStatus";

const API_URL = import.meta.env.VITE_API_URL;

export function AuthForm() {
  const { setUser, setToken } = useChatStore();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const backendStatus = useBackendStatus();

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
            <BackendStatus status={backendStatus} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

