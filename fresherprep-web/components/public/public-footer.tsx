"use client";

import { useI18n } from "@/lib/i18n";

export function PublicFooter() {
  const { t } = useI18n();
  return <footer className="border-t border-border bg-surface"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© 2026 FresherPrep</p><p>{t("A personal learning project for Java Backend Intern and Fresher preparation.")}</p></div></footer>;
}
