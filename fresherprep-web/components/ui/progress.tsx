import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  label?: string;
  showValue?: boolean;
  tone?: "primary" | "success";
}

export function Progress({
  value,
  label,
  showValue = false,
  tone = "primary",
  className,
  ...props
}: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const fillColor = tone === "success" ? "bg-success" : "bg-primary-solid";

  return (
    <div className={cn("w-full", className)} {...props}>
      {label || showValue ? (
        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-text">{label}</span>
          {showValue ? (
            <span className="tabular-nums text-text-muted">{Math.round(normalizedValue)}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        className="h-2.5 overflow-hidden rounded-full bg-surface-strong"
        role="progressbar"
        aria-label={label || "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", fillColor)}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}
