import type { Stage } from "./types";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function formatUsd(n: number) {
  const v = Math.round(n);
  return `$${v.toLocaleString("en-US")}`;
}

export function stageProgress(stage: Stage) {
  switch (stage) {
    case "idle":
      return 0;
    case "detecting":
      return 33;
    case "routing":
      return 58;
    case "sending":
      return 82;
    case "delivered":
      return 100;
  }
}

export function stageLabel(stage: Stage) {
  switch (stage) {
    case "idle":
      return "Standing by";
    case "detecting":
      return "Anomaly detected";
    case "routing":
      return "Routing";
    case "sending":
      return "Sending";
    case "delivered":
      return "Delivered";
  }
}

export function channelStatus(stage: Stage) {
  if (stage === "idle") return "Standby";
  if (stage === "sending") return "Sending";
  if (stage === "delivered") return "Delivered";
  return "Queued";
}

export function statusBadgeVariant(stage: Stage) {
  if (stage === "sending") return "warning" as const;
  if (stage === "delivered") return "success" as const;
  if (stage === "idle") return "neutral" as const;
  return "neutral" as const;
}
