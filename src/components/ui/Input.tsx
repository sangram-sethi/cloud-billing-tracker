import * as React from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type State = "default" | "error" | "success";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state?: State;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, state = "default", ...props }, ref) => {
    const stateCls =
      state === "error"
        ? "border-danger/50 focus-visible:border-danger/60 focus-visible:ring-danger/20"
        : state === "success"
        ? "border-success/50 focus-visible:border-success/60 focus-visible:ring-success/20"
        : "focus-visible:ring-primary/20";

    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-border/70 bg-surface/60 px-3 text-sm text-foreground backdrop-blur",
          "placeholder:text-muted-foreground",
          "outline-none",
          "transition-[box-shadow,border-color,background-color] duration-200 ease-(--ease-snappy)",
          "focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:border-border",
          stateCls,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
