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
    <div
      className={cn(
        "relative overflow-hidden rounded-4xl border border-white/10 bg-surface/30 " +
          "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_140px_rgba(0,0,0,0.75)] backdrop-blur",
        className
      )}
    >
      {/* subtle top chrome */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-surface/30 px-5 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/14" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <div className="ml-auto text-xs text-muted-foreground">Demo</div>
      </div>

      <div className="p-4">{children}</div>
    </div>
  );
}
