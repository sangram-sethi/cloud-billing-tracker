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
  "inline-flex items-center justify-center gap-2 font-semibold select-none cursor-pointer " +
  "transition-[scale,translate,opacity,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-snappy)] " +
  "hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.98] " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

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
