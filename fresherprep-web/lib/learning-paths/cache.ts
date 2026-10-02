import type { LearningPathListData } from "./types";

const cachePrefix = "fresherprep-learning-paths:";
const maxAgeMs = 5 * 60 * 1000;

interface LearningPathCacheEntry {
  savedAt: number;
  data: LearningPathListData;
}

export function readLearningPathListCache(userId: string) {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(cachePrefix + userId);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as LearningPathCacheEntry;
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

export function writeLearningPathListCache(userId: string, data: LearningPathListData) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    cachePrefix + userId,
    JSON.stringify({ savedAt: Date.now(), data } satisfies LearningPathCacheEntry),
  );
}

export function clearLearningPathListCache(userId: string) {
  if (typeof window !== "undefined") sessionStorage.removeItem(cachePrefix + userId);
}

export function clearAllLearningPathListCaches() {
  if (typeof window === "undefined") return;
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(cachePrefix)) sessionStorage.removeItem(key);
  }
}
