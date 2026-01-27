import * as React from "react";
import { cn } from "@/lib/cn";

type InputState = "default" | "success" | "error";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: InputState;
}

const stateStyles: Record<InputState, string> = {
  default:
    "border-border/70 focus-visible:border-primary/40 focus-visible:ring-primary/20",
  success:
    "border-success/40 focus-visible:border-success/60 focus-visible:ring-success/20",
  error:
    "border-danger/45 focus-visible:border-danger/70 focus-visible:ring-danger/20",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, state = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded-2xl border bg-surface/55 px-3 text-sm text-foreground " +
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur " +
            "outline-none transition-[box-shadow,border-color,background-color] duration-200 " +
            "ease-(--ease-snappy) " +
            "placeholder:text-muted-foreground/70 " +
            "focus-visible:ring-2",
          stateStyles[state],
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
