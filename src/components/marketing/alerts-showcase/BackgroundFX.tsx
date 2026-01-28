import * as React from "react";
import { cn } from "@/lib/cn";

export function BackgroundFX({ hot }: { hot: boolean }) {
  return (
    <>
      {/* Full-bleed texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(900px 520px at 18% 0%, rgba(59,130,246,0.16), transparent 60%)," +
            (hot
              ? "radial-gradient(760px 520px at 78% 38%, rgba(244,63,94,0.16), transparent 64%),"
              : "radial-gradient(760px 520px at 78% 38%, rgba(124,58,237,0.14), transparent 64%),") +
            "radial-gradient(620px 420px at 50% 110%, rgba(34,197,94,0.10), transparent 60%)," +
            "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 24%)",
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-[0.18]",
          "bg-[linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)]",
          "bg-size-[48px_48px]"
        )}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(800px 520px at 50% 20%, transparent 55%, rgba(0,0,0,0.70) 100%)",
        }}
      />
    </>
  );
}
