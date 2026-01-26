import * as React from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, glow = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl border border-border/60 bg-surface/60 backdrop-blur",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-(--ease-snappy)",
        "hover:-translate-y-px hover:border-border hover:bg-surface/70",
        glow && "glow-card",
        className
      )}
      {...props}
    />
  );
});

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm leading-relaxed text-muted-foreground", className)} {...props} />
  );
}
