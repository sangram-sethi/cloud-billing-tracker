import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "neutral" | "success" | "warning" | "danger";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "border-border/70 bg-surface/60 text-foreground",
    neutral: "border-border/70 bg-surface/40 text-muted-foreground",
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/25 bg-warning/10 text-warning",
    danger: "border-danger/25 bg-danger/10 text-danger",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide backdrop-blur",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
