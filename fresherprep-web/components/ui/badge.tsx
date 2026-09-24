import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-muted text-text-muted",
  info: "border-primary/20 bg-primary-subtle text-primary-strong",
  success: "border-success/20 bg-success-subtle text-success-strong",
  warning: "border-warning/25 bg-warning-subtle text-warning-strong",
  danger: "border-danger/20 bg-danger-subtle text-danger-strong",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
