"use client";

import { useEffect, useSyncExternalStore } from "react";

type ThemePreference = "light" | "dark" | "system";

const storageKey = "fresherprep-theme";
const changeEvent = "fresherprep-theme-change";
const order: ThemePreference[] = ["system", "light", "dark"];
const labels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    readPreference,
    readServerPreference,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themePreference = preference;
      document.documentElement.style.colorScheme = resolved;
    };

    if (preference === "system") {
      window.localStorage.removeItem(storageKey);
      media.addEventListener("change", apply);
    } else {
      window.localStorage.setItem(storageKey, preference);
    }
    apply();
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  const current = preference;
  const next = order[(order.indexOf(current) + 1) % order.length];

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted shadow-input transition-colors hover:border-primary/35 hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
      aria-label={"Theme: " + labels[current] + ". Switch to " + labels[next] + "."}
      title={"Theme: " + labels[current]}
    >
      <ThemeIcon theme={current} />
    </button>
  );
}

function readPreference(): ThemePreference {
  const saved = window.localStorage.getItem(storageKey);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function readServerPreference(): ThemePreference {
  return "system";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

function setPreference(preference: ThemePreference) {
  if (preference === "system") window.localStorage.removeItem(storageKey);
  else window.localStorage.setItem(storageKey, preference);
  window.dispatchEvent(new Event(changeEvent));
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
