import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-brand-600)] text-white rounded-[var(--radius-md)]",
          "hover:bg-[var(--color-brand-700)] active:bg-[var(--color-brand-800)]",
          "shadow-[var(--shadow-sm)]",
        ].join(" "),
        secondary: [
          "bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border-2)] rounded-[var(--radius-md)]",
          "hover:bg-[var(--color-surface-2)] hover:border-[var(--color-brand-300)] active:bg-[var(--color-border)]",
          "shadow-[var(--shadow-xs)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--color-fg-muted)] rounded-[var(--radius-md)]",
          "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
        ].join(" "),
        outline: [
          "bg-transparent text-[var(--color-brand-600)] border border-[var(--color-brand-300)] rounded-[var(--radius-md)]",
          "hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-500)]",
        ].join(" "),
        danger: [
          "bg-[var(--color-danger)] text-white rounded-[var(--radius-md)]",
          "hover:opacity-90 active:opacity-80",
        ].join(" "),
        link: "bg-transparent text-[var(--color-brand-600)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
