import type { HTMLAttributes } from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm",
        "transition-transform duration-200 ease-(--ease-snappy)",
        "hover:-translate-y-px",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("px-6 pt-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p className={cn("mt-1 text-sm leading-relaxed text-muted-foreground", className)} {...props} />
  );
}
