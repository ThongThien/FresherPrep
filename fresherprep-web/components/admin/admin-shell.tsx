"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { UserArea, type UserState } from "@/components/shell/user-area";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { useI18n } from "@/lib/i18n";

import { AdminNavigation } from "./admin-navigation";
import { adminNavigation } from "./navigation-items";

interface AdminShellProps {
  children: ReactNode;
  userState: UserState;
  onLogout: () => void;
  logoutPending: boolean;
}

export function AdminShell({ children, userState, onLogout, logoutPending }: AdminShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = adminNavigation.find((item) =>
    item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href),
  );

  return (
    <div className="min-h-dvh bg-background">
      <a href="#admin-main" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-md bg-primary-solid px-4 py-2 text-sm font-semibold text-white shadow-button transition-transform focus:translate-y-0 motion-reduce:transition-none">
        {t("Skip to admin content")}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="mr-3 inline-flex size-11 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-focus/20 lg:hidden" aria-label={t("Open admin navigation")} aria-haspopup="dialog">
            <span aria-hidden="true" className="text-xl">☰</span>
          </button>
          <Link href="/admin" className="flex items-center gap-2.5 rounded-sm focus-visible:ring-3 focus-visible:ring-focus/20" aria-label={t("FresherPrep admin dashboard")}>
            <span className="flex size-8 items-center justify-center rounded-md bg-primary-solid text-xs font-bold text-white" aria-hidden="true">FP</span>
            <span className="font-semibold tracking-tight text-text">FresherPrep</span>
            <span className="rounded-sm border border-border bg-surface-muted px-2 py-0.5 text-xs font-semibold text-text-muted">{t("Admin")}</span>
          </Link>
          {current ? <span className="ml-5 hidden border-l border-border pl-5 text-sm text-text-muted md:block">{t(current.label)}</span> : null}
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="hidden items-center gap-4 sm:flex">
              <Link href="/dashboard" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:text-primary-hover">{t("Learning area")}</Link>
              <UserArea state={userState} compact onLogout={onLogout} logoutPending={logoutPending} />
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <p className="px-5 pb-3 pt-6 text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{t("Management")}</p>
          <AdminNavigation className="flex-1 overflow-y-auto px-3 pb-6" />
          <div className="border-t border-border p-4">
            <Link href="/dashboard" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:text-primary-hover">{t("Back to learning")}</Link>
            <UserArea className="mt-3" state={userState} onLogout={onLogout} logoutPending={logoutPending} />
          </div>
        </aside>
        <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
      <AdminMobileNavigation open={open} onClose={() => setOpen(false)} userState={userState} onLogout={onLogout} logoutPending={logoutPending} />
    </div>
  );
}

function AdminMobileNavigation({ open, onClose, userState, onLogout, logoutPending }: { open: boolean; onClose: () => void; userState: UserState; onLogout: () => void; logoutPending: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} onClose={onClose} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="admin-navigation-title" className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-text/35 lg:hidden">
      <aside className="flex h-full w-[min(21rem,88vw)] flex-col border-r border-border bg-surface shadow-card">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div><p id="admin-navigation-title" className="text-sm font-semibold text-text">{t("Admin workspace")}</p><p className="mt-0.5 text-xs text-text-muted">{t("Manage FresherPrep content")}</p></div>
          <button type="button" onClick={onClose} autoFocus className="inline-flex size-11 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-focus/20" aria-label={t("Close admin navigation")}>X</button>
        </div>
        <AdminNavigation onNavigate={onClose} className="flex-1 overflow-y-auto p-4" />
        <div className="border-t border-border p-4">
          <Link href="/dashboard" onClick={onClose} className="mb-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary">{t("Back to learning")}</Link>
          <UserArea state={userState} onLogout={onLogout} logoutPending={logoutPending} />
        </div>
      </aside>
    </dialog>
  );
}
