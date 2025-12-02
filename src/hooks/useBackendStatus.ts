import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useBackendStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "checking">(
    "checking"
  );

  useEffect(() => {
    let timeoutId: number | null = null;
    let isMounted = true;

    const checkBackend = async () => {
      if (!isMounted) return;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${API_URL}/api/health`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!isMounted) return;

        const newStatus = res.ok ? "online" : "offline";
        setStatus(newStatus);

        const delay = newStatus === "offline" ? 2000 : 300000;

        timeoutId = setTimeout(() => {
          if (isMounted) {
            checkBackend();
          }
        }, delay) as unknown as number;
      } catch (error) {
        if (!isMounted) return;

        setStatus("offline");

        timeoutId = setTimeout(() => {
          if (isMounted) {
            checkBackend();
          }
        }, 2000) as unknown as number;
      }
    };

    setStatus("checking");
    checkBackend();

    return () => {
      isMounted = false;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  return status;
}

