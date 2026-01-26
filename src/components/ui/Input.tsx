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
        ? "border-danger/40 focus-visible:ring-danger/20"
        : state === "success"
        ? "border-success/40 focus-visible:ring-success/20"
        : "border-border focus-visible:ring-primary/20";

    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border bg-surface px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "outline-none",
          "transition-[box-shadow,border-color,background-color] duration-200 ease-(--ease-snappy)",
          "focus-visible:ring-2 focus-visible:ring-offset-0",
          stateCls,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
