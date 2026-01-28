import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { Stage } from "./types";
import { stageLabel, stageProgress } from "./utils";

export function StatusPill({ stage }: { stage: Stage }) {
  const label = stageLabel(stage);
  const progress = stageProgress(stage);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">Pipeline</div>
          <div className="mt-1 truncate text-xs font-semibold text-foreground">{label}</div>
        </div>
        <Badge variant={stage === "idle" ? "neutral" : stage === "delivered" ? "success" : "warning"}>{progress}%</Badge>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/6">
        <div
          className={cn(
            "h-2 rounded-full transition-[width] duration-700 ease-(--ease-snappy) motion-reduce:transition-none",
            stage === "delivered" ? "bg-emerald-500/70" : stage === "idle" ? "bg-white/14" : "bg-primary/60"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
