import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "violet" | "blue" | "green";

const WASH: Record<Tone, string> = {
  neutral: "from-white/0 via-white/0 to-white/0",
  violet: "from-violet-500/18 via-blue-500/10 to-emerald-500/6",
  blue: "from-blue-500/16 via-violet-500/10 to-emerald-500/6",
  green: "from-emerald-500/16 via-cyan-500/10 to-blue-500/6",
};

const ICON_BASE: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  violet: "text-violet-200/75",
  blue: "text-sky-200/75",
  green: "text-emerald-200/80",
};

const ICON_HOVER: Record<Tone, string> = {
  neutral: "group-hover:text-foreground",
  violet: "group-hover:text-violet-200/95",
  blue: "group-hover:text-sky-200/95",
  green: "group-hover:text-emerald-200/95",
};

export function IconButton({
  label,
  active,
  tone = "neutral",
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  tone?: Tone;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const hasTone = tone !== "neutral";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden grid h-9 w-9 place-items-center rounded-2xl",
        "border border-white/10 bg-white/4",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        "transition-[transform,background-color,border-color,box-shadow] duration-200 ease-(--ease-snappy)",
        "hover:bg-white/5 active:scale-[0.985]",
        active ? "border-white/18 bg-white/6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : ""
      )}
    >
      {/* subtle RGB wash (always present if toned, stronger on hover/active) */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br",
          WASH[tone],
          "transition-opacity duration-200 ease-(--ease-snappy)",
          hasTone ? "opacity-35" : "opacity-0",
          active ? "opacity-100" : hasTone ? "group-hover:opacity-70" : ""
        )}
      />

      <span
        className={cn(
          "relative transition-transform duration-200 ease-(--ease-snappy)",
          "group-hover:-translate-y-px group-active:translate-y-0",
          ICON_BASE[tone],
          ICON_HOVER[tone]
        )}
      >
        {children}
      </span>
    </button>
  );
}
