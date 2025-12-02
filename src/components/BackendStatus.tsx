export function BackendStatus({
  status,
}: {
  status: "online" | "offline" | "checking";
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "online"
            ? "bg-green-500"
            : status === "offline"
            ? "bg-red-500"
            : "bg-yellow-500 animate-pulse"
        }`}
      />
      <span>
        {status === "online"
          ? "Backend online"
          : status === "offline"
          ? "Backend offline"
          : "Checking..."}
      </span>
    </div>
  );
}

