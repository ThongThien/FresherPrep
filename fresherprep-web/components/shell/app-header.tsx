"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import {
  isNavigationItemActive,
  learningNavigation,
} from "./navigation-items";
import { UserArea, type UserState } from "./user-area";
import { ThemeToggle } from "./theme-toggle";

interface AppHeaderProps {
  userState: UserState;
  onOpenNavigation: () => void;
  onLogout?: () => void;
  logoutPending?: boolean;
}

export function AppHeader({
  userState,
  onOpenNavigation,
  onLogout,
  logoutPending,
}: AppHeaderProps) {
  const pathname = usePathname();
  const currentContext = learningNavigation.find((item) =>
    isNavigationItemActive(pathname, item.href),
  )?.label;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="mr-3 inline-flex size-11 items-center justify-center rounded-md border border-transparent text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 lg:hidden"
          aria-label="Open learning navigation"
          aria-haspopup="dialog"
        >
          <MenuGlyph />
        </button>

        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
          aria-label="FresherPrep dashboard"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-md bg-primary-solid text-xs font-bold tracking-tight text-white"
          >
            FP
          </span>
          <span className="text-base font-semibold tracking-tight text-text">FresherPrep</span>
        </Link>

        {currentContext ? (
          <div className="ml-5 hidden items-center gap-3 border-l border-border pl-5 md:flex">
            <span className="text-sm text-text-muted">{currentContext}</span>
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">
            <UserArea
              state={userState}
              compact
              onLogout={onLogout}
              logoutPending={logoutPending}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuGlyph({ className }: { className?: string }) {
  return (
    <span className={cn("flex w-5 flex-col gap-1.5", className)} aria-hidden="true">
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
    </span>
  );
}
