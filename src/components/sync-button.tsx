"use client";

import { useState } from "react";

export function SyncButton({ onSynced }: { onSynced?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      setStatus("Sync complete");
      onSynced?.();
    } catch {
      setStatus("Sync failed");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Sync Now"}
      </button>
      {status && (
        <span
          className={`text-xs ${status.includes("complete") ? "text-success" : "text-destructive"}`}
        >
          {status}
        </span>
      )}
    </div>
  );
}
