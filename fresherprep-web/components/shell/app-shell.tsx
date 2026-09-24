"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { AppHeader } from "./app-header";
import { LearningNavigation } from "./navigation";
import { MobileNavigation } from "./mobile-navigation";
import { adminNavigationEntry, learningNavigation } from "./navigation-items";
import { UserArea, type UserState } from "./user-area";

interface AppShellProps {
  children: ReactNode;
  userState: UserState;
  onLogout?: () => void;
  logoutPending?: boolean;
}

export function AppShell({ children, userState, onLogout, logoutPending }: AppShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const navigationItems =
    userState.status === "authenticated" && userState.role === "ADMIN"
      ? [...learningNavigation, adminNavigationEntry]
      : learningNavigation;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-md bg-primary-solid px-4 py-2 text-sm font-semibold text-white shadow-button transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        Skip to main content
      </a>

      <AppHeader
        userState={userState}
        onLogout={onLogout}
        logoutPending={logoutPending}
        onOpenNavigation={() => setMobileNavigationOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="px-5 pb-3 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
              Learning
            </p>
          </div>
          <LearningNavigation items={navigationItems} className="flex-1 overflow-y-auto px-3 pb-6" />
          <div className="border-t border-border p-4">
            <UserArea state={userState} onLogout={onLogout} logoutPending={logoutPending} />
          </div>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>

      <MobileNavigation
        open={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
        userState={userState}
        onLogout={onLogout}
        logoutPending={logoutPending}
        items={navigationItems}
      />
    </div>
  );
}
