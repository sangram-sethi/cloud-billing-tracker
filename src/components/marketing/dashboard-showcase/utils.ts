import { cn } from "@/lib/cn";
import type { Tone } from "./types";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function fmtUsd0(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function pillClass(active?: boolean) {
  return cn(
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs " +
      "transition-[background-color,border-color,box-shadow,transform,color] duration-200 " +
      "ease-(--ease-snappy) active:scale-[0.99]",
    active
      ? "border-white/12 bg-white/6 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
      : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/5"
  );
}

/** ✅ Uses real Tailwind colors (works out-of-the-box) */
export function valueToneClass(tone: Tone) {
  switch (tone) {
    case "success":
      return "text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.16)]";
    case "warning":
      return "text-amber-300 drop-shadow-[0_0_18px_rgba(245,158,11,0.16)]";
    case "danger":
      return "text-rose-300 drop-shadow-[0_0_18px_rgba(244,63,94,0.16)]";
    default:
      return "text-foreground";
  }
}

/** Threshold helpers */
export function toneForToday(today: number, baseToday: number): Tone {
  if (today > baseToday * 1.25) return "danger";
  if (today > baseToday * 1.1) return "warning";
  return "success";
}

export function toneForForecast(forecast: number, budget: number): Tone {
  if (forecast > budget) return "danger";
  if (forecast > budget * 0.85) return "warning";
  return "success";
}

export function toneForScore(score: number): Tone {
  if (score > 0.72) return "danger";
  if (score > 0.55) return "warning";
  return "success";
}

export function toneForMtd(mtd: number, budget: number): Tone {
  if (mtd > budget) return "danger";
  if (mtd > budget * 0.85) return "warning";
  return "success";
}
