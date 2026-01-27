"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

type Props = React.ComponentPropsWithoutRef<typeof Card> & {
  glowRgb?: string; // e.g. "124 58 237"
};

export const GlowCard = React.forwardRef<HTMLDivElement, Props>(
  ({ className, glowRgb = "124 58 237", onMouseMove, onMouseLeave, ...props }, ref) => {
    function handleMove(e: React.MouseEvent<HTMLDivElement>) {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;

      el.style.setProperty("--glow-x", `${x}%`);
      el.style.setProperty("--glow-y", `${y}%`);
      el.style.setProperty("--glow-opacity", "1");
      el.style.setProperty("--glow-rgb", glowRgb);

      onMouseMove?.(e);
    }

    function handleLeave(e: React.MouseEvent<HTMLDivElement>) {
      e.currentTarget.style.setProperty("--glow-opacity", "0");
      onMouseLeave?.(e);
    }

    return (
      <Card
        ref={ref}
        className={cn("glow-card", className)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        {...props}
      />
    );
  }
);
GlowCard.displayName = "GlowCard";
