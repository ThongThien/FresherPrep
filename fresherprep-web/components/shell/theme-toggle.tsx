"use client";

import { useI18n } from "@/lib/i18n";
import { type ThemePreference, useThemePreference } from "@/lib/theme";

const order: ThemePreference[] = ["system", "light", "dark"];
export function ThemeToggle() {
  const { t } = useI18n();
  const { preference, setPreference } = useThemePreference();

  const current = preference;
  const next = order[(order.indexOf(current) + 1) % order.length];

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted shadow-input transition-colors hover:border-primary/35 hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
      aria-label={t("Theme: {{current}}. Switch to {{next}}.", { current: t(themeLabel(current)), next: t(themeLabel(next)) })}
      title={t("Theme: {{current}}", { current: t(themeLabel(current)) })}
    >
      <ThemeIcon theme={current} />
    </button>
  );
}

function themeLabel(theme: ThemePreference) {
  return theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
}

function ThemeIcon({ theme }: { theme: ThemePreference }) {
  if (theme === "light") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" /></svg>;
  }
  if (theme === "dark") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
}
