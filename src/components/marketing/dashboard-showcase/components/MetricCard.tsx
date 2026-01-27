import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "../types";
import { valueToneClass } from "../utils";

function toneChipClass(tone: Tone) {
  switch (tone) {
    case "success":
      return cn(
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
        "shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_16px_40px_rgba(16,185,129,0.08)]"
      );
    case "warning":
      return cn(
        "border-amber-500/25 bg-amber-500/10 text-amber-200",
        "shadow-[0_0_0_1px_rgba(245,158,11,0.10),0_16px_40px_rgba(245,158,11,0.08)]"
      );
    case "danger":
      return cn(
        "border-rose-500/25 bg-rose-500/10 text-rose-200",
        "shadow-[0_0_0_1px_rgba(244,63,94,0.10),0_16px_40px_rgba(244,63,94,0.08)]"
      );
    default:
      return "border-white/10 bg-white/5 text-foreground/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
  }
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  valueTone,
  onClick,
  active,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone?: Tone;
  valueTone?: Tone;
  onClick?: () => void;
  active?: boolean;
}) {
  const badgeVariant =
    tone === "success"
      ? "success"
      : tone === "warning"
      ? "warning"
      : tone === "danger"
      ? "danger"
      : "neutral";

  const numberTone: Tone = valueTone ?? tone;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border border-white/10 bg-surface/30 p-4",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_60px_rgba(0,0,0,0.45)]",
        "transition-[transform,background-color,border-color,box-shadow] duration-200 ease-(--ease-snappy)",
        "hover:bg-surface/35 active:scale-[0.995]",
        active
          ? "border-primary/25 bg-primary/8 shadow-[0_0_0_1px_rgba(124,58,237,0.18),0_22px_70px_rgba(0,0,0,0.55)]"
          : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>

          {/* ✅ value now truly colored */}
          <div
            className={cn(
              "mt-1 truncate text-xl font-semibold tracking-tight transition-colors duration-200 ease-(--ease-snappy)",
              valueToneClass(numberTone)
            )}
          >
            {value}
          </div>
        </div>

        {/* ✅ icon chip colored */}
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl border transition-colors duration-200 ease-(--ease-snappy)",
            toneChipClass(tone)
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">{hint}</span>
        <Badge variant={badgeVariant} className="px-2 py-0.5">
          {tone === "neutral"
            ? "Stable"
            : tone === "success"
            ? "Good"
            : tone === "warning"
            ? "Watch"
            : "Spike"}
        </Badge>
      </div>
    </button>
  );
}
