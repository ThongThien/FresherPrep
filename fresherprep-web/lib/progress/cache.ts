import type { ProgressData } from "./types";

const cachePrefix = "fresherprep-progress:";
const maxAgeMs = 5 * 60 * 1000;

interface ProgressCacheEntry {
  savedAt: number;
  data: ProgressData;
}

export function readProgressCache(userId: string) {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(cachePrefix + userId);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as ProgressCacheEntry;
    if (!entry.data || Date.now() - entry.savedAt > maxAgeMs) {
      sessionStorage.removeItem(cachePrefix + userId);
      return undefined;
    }
    return entry.data;
  } catch {
    sessionStorage.removeItem(cachePrefix + userId);
    return undefined;
  }
}

export function writeProgressCache(userId: string, data: ProgressData) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    cachePrefix + userId,
    JSON.stringify({ savedAt: Date.now(), data } satisfies ProgressCacheEntry),
  );
}

export function clearProgressCache(userId: string) {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(cachePrefix + userId);
  }
}

export function clearAllProgressCaches() {
  if (typeof window === "undefined") return;
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(cachePrefix)) sessionStorage.removeItem(key);
  }
}
