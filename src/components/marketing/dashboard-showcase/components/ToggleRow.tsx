import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

function toneTrackClasses(tone: Tone) {
  switch (tone) {
    case "primary":
      return "border-primary/25 bg-primary/12";
    case "success":
      return "border-emerald-500/25 bg-emerald-500/12";
    case "warning":
      return "border-amber-500/25 bg-amber-500/12";
    case "danger":
      return "border-rose-500/25 bg-rose-500/12";
    default:
      return "border-white/12 bg-white/6";
  }
}

function toneKnobClasses(tone: Tone) {
  switch (tone) {
    case "primary":
      return "bg-primary shadow-[0_0_18px_rgba(124,58,237,0.20)]";
    case "success":
      return "bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.18)]";
    case "warning":
      return "bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.18)]";
    case "danger":
      return "bg-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.18)]";
    default:
      return "bg-white/45 shadow-[0_0_18px_rgba(255,255,255,0.08)]";
  }
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  tone = "neutral",
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/4 p-3 text-left",
        "transition-[transform,background-color,border-color] duration-200 ease-(--ease-snappy) active:scale-[0.995]",
        "hover:bg-white/5"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {description ? <div className="mt-1 text-xs text-muted-foreground">{description}</div> : null}
        </div>

        <div
          role="switch"
          aria-checked={checked}
          className={cn(
            "relative h-7 w-12 rounded-full border backdrop-blur",
            "transition-[background-color,border-color] duration-200 ease-(--ease-snappy)",
            checked ? toneTrackClasses(tone) : "border-white/12 bg-white/6"
          )}
        >
          <div
            className={cn(
              "absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full",
              "transition-[transform,background-color,box-shadow] duration-200 ease-(--ease-snappy)",
              checked ? "translate-x-5" : "translate-x-0",
              checked ? toneKnobClasses(tone) : "bg-white/35"
            )}
          />
        </div>
      </div>
    </button>
  );
}
