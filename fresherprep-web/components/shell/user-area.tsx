"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

export type UserState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "error" }
  | {
      status: "authenticated";
      displayName: string;
      email: string;
      role: "USER" | "ADMIN";
    };

interface UserAreaProps {
  state: UserState;
  compact?: boolean;
  className?: string;
  onLogout?: () => void;
  logoutPending?: boolean;
}

export function UserArea({ state, compact = false, className }: UserAreaProps) {
  const { t } = useI18n();
  if (state.status === "loading") {
    return (
      <div
        className={cn("flex min-h-11 items-center gap-3", className)}
        role="status"
        aria-label={t("Loading account")}
      >
        <span className="size-9 animate-pulse rounded-full bg-surface-strong motion-reduce:animate-none" />
        {!compact ? (
          <span className="space-y-2">
            <span className="block h-3 w-24 animate-pulse rounded bg-surface-strong motion-reduce:animate-none" />
            <span className="block h-2.5 w-32 animate-pulse rounded bg-surface-strong motion-reduce:animate-none" />
          </span>
        ) : null}
      </div>
    );
  }

  const authenticated = state.status === "authenticated";
  const title = authenticated ? state.displayName : t("Account");
  const description = authenticated
    ? state.email
    : state.status === "error"
      ? t("Account unavailable")
      : t("Ready for user integration");
  const initials = authenticated ? getInitials(state.displayName) : "FP";

  return (
    <div
      className={cn(
        compact ? "flex items-center gap-2" : "space-y-3",
        className,
      )}
    >
      <Link
        href={authenticated ? "/profile" : "/login"}
        className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
        aria-label={
          authenticated ? t("Open profile and settings") : t("Open account")
        }
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary-subtle text-xs font-bold text-primary-strong"
          aria-hidden="true"
        >
          {initials}
        </span>
        {!compact ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-text">
              {title}
            </span>
            <span className="block truncate text-xs text-text-muted">
              {description}
            </span>
          </span>
        ) : (
          <span className="sr-only">{title}</span>
        )}
      </Link>
    </div>
  );
}

function getInitials(displayName: string) {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
