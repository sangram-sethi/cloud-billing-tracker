"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

type SyncOk = {
  ok: true;
  range: { start: string; endExclusive: string; days: number };
  stored: { days: number; services: number; rows: number };
  anomalies?: {
    totalOnly: boolean;
    count: number;
    // ✅ new fields (Step 5)
    totalCount?: number;
    serviceCount?: number;
    topServicesScanned?: number;
  };
  syncedAt: string | Date;
};

type SyncErr = { ok: false; error: string; code?: string; retryAfter?: number };

type SyncResult = SyncOk | SyncErr;

export function SyncNowButton({
  days = 30,
  disabled,
  onResult,
  variant = "secondary",
  size = "md",
}: {
  days?: number;
  disabled?: boolean;
  onResult?: (r: SyncResult) => void;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function sync() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/aws/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      const json = (await res.json().catch(() => null)) as SyncResult | null;
      const payload: SyncResult =
        json && typeof json === "object" ? json : { ok: false, error: "Unexpected response" };

      onResult?.(payload);

      if (res.ok) {
        router.refresh();
      }
    } catch {
      onResult?.({ ok: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={sync} disabled={disabled || loading}>
      <RefreshCw className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
      {loading ? "Syncing…" : "Sync now"}
    </Button>
  );
}
