import type { HTMLAttributes } from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "default" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const base =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
  "transition-colors";

const variants: Record<Variant, string> = {
  default: "bg-surface-2 text-foreground border-border",
  neutral: "bg-muted text-foreground border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(base, variants[variant], className)} {...props} />;
}