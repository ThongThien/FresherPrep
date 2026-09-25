"use client";

import { useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "fresherprep-theme";
const changeEvent = "fresherprep-theme-change";

export function useThemePreference() {
  const preference = useSyncExternalStore<ThemePreference>(subscribe, readPreference, readServerPreference);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themePreference = preference;
      document.documentElement.style.colorScheme = resolved;
    };

    if (preference === "system") {
      window.localStorage.setItem(storageKey, preference);
      media.addEventListener("change", apply);
    } else {
      window.localStorage.setItem(storageKey, preference);
    }
    apply();
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  return { preference, setPreference: setThemePreference };
}

function readPreference(): ThemePreference {
  const saved = window.localStorage.getItem(storageKey);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
}

function readServerPreference(): ThemePreference {
  return "light";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

function setThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(storageKey, preference);
  window.dispatchEvent(new Event(changeEvent));
}
