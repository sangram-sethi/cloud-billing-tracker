import Link from "next/link";
import type { ReactNode } from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  prefetch?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none " +
  "rounded-full text-sm font-medium tracking-tight " +
  "transition-[transform,opacity,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-snappy)] " +
  "hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.99] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background border border-transparent hover:opacity-90 shadow-[0_18px_60px_-40px_rgba(255,255,255,0.35)]",
  secondary:
    "border border-border/70 bg-surface/40 text-foreground backdrop-blur hover:bg-surface/60",
  ghost:
    "bg-transparent text-foreground border border-transparent hover:bg-surface/50",
  danger:
    "bg-danger text-white border border-transparent hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-10 px-5",
  lg: "h-12 px-7",
};

export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
  size = "md",
  prefetch,
}: Props) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}
