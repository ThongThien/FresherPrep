"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useI18n } from "@/lib/i18n";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
            aria-label={t("FresherPrep home")}
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-md bg-primary-solid text-xs font-bold tracking-tight text-white"
            >
              FP
            </span>
            <span className="text-base font-semibold tracking-tight text-text">
              FresherPrep
            </span>
          </Link>
          <p className="ml-auto hidden text-sm text-text-muted sm:block">{t("Java made simple, focused on the fundamentals you need for a backend interview.")}</p>
          <div className="ml-3 flex items-center gap-2"><LanguageSwitcher /><ThemeToggle /></div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-text-subtle">
        {t("Build practical knowledge for your first backend role.")} {t("Built by an anonymous unpaid intern, September 2026. hihi..")}
      </footer>
    </div>
  );
}
