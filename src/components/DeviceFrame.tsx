import * as React from "react";
import { cn } from "@/lib/cn";

export function DeviceFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Premium outer glow (subtle, not neon). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[3.25rem] blur-3xl"
        style={{
          background:
            "radial-gradient(900px 420px at 50% 0%, rgba(124,58,237,0.18), transparent 60%)," +
            "radial-gradient(720px 420px at 10% 28%, rgba(59,130,246,0.10), transparent 62%)," +
            "radial-gradient(820px 480px at 92% 40%, rgba(255,255,255,0.06), transparent 64%)",
        }}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-4xl border border-white/10 bg-surface/30 backdrop-blur",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_140px_rgba(0,0,0,0.75)]"
        )}
      >
        {/* Inner sheen (reads like glass, stays inside the frame) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 26%)",
          }}
        />

        {/* macOS-style top chrome (no 'Demo' text) */}
        <div className="relative flex items-center gap-2 border-b border-white/5 bg-surface/30 px-5 py-3">
          <div className="flex gap-2">
            {/* Close */}
            <span
              aria-hidden
              className={cn(
                "h-3 w-3 rounded-full",
                "bg-[#ff5f57]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                "ring-1 ring-black/20"
              )}
            />
            {/* Minimize */}
            <span
              aria-hidden
              className={cn(
                "h-3 w-3 rounded-full",
                "bg-[#febc2e]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                "ring-1 ring-black/20"
              )}
            />
            {/* Zoom */}
            <span
              aria-hidden
              className={cn(
                "h-3 w-3 rounded-full",
                "bg-[#28c840]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                "ring-1 ring-black/20"
              )}
            />
          </div>

          {/* Keep right side intentionally empty for premiumness */}
          <div className="ml-auto" />
        </div>

        <div className="relative p-4">{children}</div>
      </div>
    </div>
  );
}
