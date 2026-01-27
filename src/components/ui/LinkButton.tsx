import Link, { type LinkProps } from "next/link";
import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: Variant;
    size?: Size;
  };

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
  "outline-none transition-[transform,opacity,background-color,border-color,color,box-shadow] duration-200 " +
  "[transition-timing-function:var(--ease-snappy)] " +
  "focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 active:scale-[0.99]";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_18px_60px_rgba(0,0,0,0.55)] hover:opacity-95",
  secondary:
    "border border-border/70 bg-surface/60 text-foreground backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-surface-2/70",
  ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface/40",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

export function LinkButton({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: Props) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
