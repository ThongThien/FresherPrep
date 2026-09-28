"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded bg-surface-strong motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export function PageLoading({ label }: { label: string }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8" role="status" aria-live="polite" aria-busy="true">
      <LoadingState title={t(label)} description={t("Please wait a moment.")} />
      <div className="space-y-3">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>
    </div>
  );
}

export function LoadingState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface px-5 py-8 text-center", className)} role="status" aria-live="polite" aria-busy="true">
      <span className="mx-auto block size-6 animate-spin rounded-full border-2 border-primary border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
      <p className="mt-4 font-semibold text-text">{title}</p>
      {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
    </div>
  );
}
