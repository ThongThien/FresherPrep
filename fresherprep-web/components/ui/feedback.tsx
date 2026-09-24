import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type FeedbackTone = "info" | "success" | "warning" | "error";

interface FeedbackProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  title: string;
  children?: ReactNode;
}

const toneClasses: Record<FeedbackTone, string> = {
  info: "border-primary/20 bg-primary-subtle text-primary-strong",
  success: "border-success/20 bg-success-subtle text-success-strong",
  warning: "border-warning/25 bg-warning-subtle text-warning-strong",
  error: "border-danger/20 bg-danger-subtle text-danger-strong",
};

const symbols: Record<FeedbackTone, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "×",
};

export function Feedback({
  tone = "info",
  title,
  className,
  children,
  ...props
}: FeedbackProps) {
  return (
    <div
      className={cn("flex gap-3 rounded-md border p-4 text-sm", toneClasses[tone], className)}
      role={tone === "error" ? "alert" : "status"}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold"
      >
        {symbols[tone]}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-1 leading-6 opacity-85">{children}</div> : null}
      </div>
    </div>
  );
}
