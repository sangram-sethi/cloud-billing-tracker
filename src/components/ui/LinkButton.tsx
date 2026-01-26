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
  "inline-flex items-center justify-center gap-2 font-semibold select-none " +
  "transition-[scale,translate,opacity,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-snappy)] " +
  "hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:opacity-90 border border-transparent hover:shadow-sm",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-muted hover:shadow-sm",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-2 border border-transparent",
  danger:
    "bg-danger text-primary-foreground hover:opacity-90 border border-transparent hover:shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 rounded-lg text-sm",
  md: "h-10 px-4 rounded-xl text-sm",
  lg: "h-11 px-5 rounded-xl text-sm",
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
