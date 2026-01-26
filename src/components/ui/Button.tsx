import type { ButtonHTMLAttributes } from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none cursor-pointer " +
  "rounded-full text-sm font-medium tracking-tight " +
  "transition-[transform,opacity,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-snappy)] " +
  "hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.99] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

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

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
