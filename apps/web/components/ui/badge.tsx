import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-[var(--color-brand-100)] text-[var(--color-brand-800)]",
        success:  "bg-emerald-50 text-emerald-700",
        warning:  "bg-amber-50 text-amber-700",
        danger:   "bg-red-50 text-red-700",
        neutral:  "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] border border-[var(--color-border)]",
        outline:  "border border-[var(--color-border-2)] text-[var(--color-fg-muted)] bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
