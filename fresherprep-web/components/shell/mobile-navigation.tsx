"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

import { LearningNavigation } from "./navigation";
import type { NavigationItem } from "./navigation-items";
import { UserArea, type UserState } from "./user-area";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
  userState: UserState;
  onLogout?: () => void;
  logoutPending?: boolean;
  items?: readonly NavigationItem[];
}

export function MobileNavigation({
  open,
  onClose,
  userState,
  onLogout,
  logoutPending,
  items,
}: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      aria-labelledby="mobile-navigation-title"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-text/35 lg:hidden"
    >
      <aside className="flex h-full w-[min(21rem,88vw)] flex-col border-r border-border bg-surface shadow-card">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div>
            <p id="mobile-navigation-title" className="text-sm font-semibold text-text">
              {t("Learning workspace")}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">{t("Navigate FresherPrep")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="inline-flex size-11 items-center justify-center rounded-md text-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
            aria-label={t("Close learning navigation")}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <LearningNavigation items={items} onNavigate={onClose} className="flex-1 overflow-y-auto p-4" />

        <div className="border-t border-border p-4">
          <UserArea state={userState} onLogout={onLogout} logoutPending={logoutPending} />
        </div>
      </aside>
    </dialog>
  );
}
