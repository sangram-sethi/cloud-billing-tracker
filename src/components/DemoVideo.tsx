"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function DemoVideo({
  src = "/demos/demo.mp4",
  poster,
  className,
}: {
  src?: string;
  poster?: string;
  className?: string;
}) {
  const [ready, setReady] = React.useState(false);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10", className)}>
      {/* placeholder (shows even if video 404s) */}
      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(800px_circle_at_30%_20%,rgba(124,58,237,0.18),transparent_60%)] " +
            "opacity-100 transition-opacity duration-300",
          ready && "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 bg-surface/40 backdrop-blur opacity-100 transition-opacity duration-300",
          ready && "opacity-0"
        )}
      />

      <video
        className="relative z-10 h-full w-full rounded-2xl object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        onLoadedData={() => setReady(true)}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_-80px_120px_rgba(0,0,0,0.65)]" />
    </div>
  );
}
