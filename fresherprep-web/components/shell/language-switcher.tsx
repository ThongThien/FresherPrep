"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === "vi" ? "en" : "vi";
  const label = locale === "vi"
    ? t("Language: Vietnamese. Switch to English.")
    : t("Language: English. Switch to Vietnamese.");

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface px-2 text-xs font-bold text-text-muted shadow-input transition-colors hover:border-primary/35 hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
      aria-label={label}
      title={label}
    >
      {locale === "vi" ? "VN" : "EN"}
    </button>
  );
}
