import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, type, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center text-[var(--color-fg-subtle)] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full h-10 rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2 text-sm",
              "text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]",
              "border-[var(--color-border-2)] focus:border-[var(--color-brand-400)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-150",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-[var(--color-danger)] focus:ring-red-100",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-[var(--color-fg-subtle)]">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full h-10 rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2 text-sm",
          "text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]",
          "border-[var(--color-border-2)] focus:border-[var(--color-brand-400)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          error && "border-[var(--color-danger)] focus:ring-red-100",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
