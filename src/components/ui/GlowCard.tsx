"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";

type Props = React.ComponentProps<typeof Card>;

export function GlowCard({ className, ...props }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;

    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  }

  return (
    <Card
      ref={ref}
      glow
      onMouseMove={onMove}
      className={className}
      {...props}
    />
  );
}
