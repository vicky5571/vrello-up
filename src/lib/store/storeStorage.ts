import { type StateStorage } from "zustand/middleware";
import { toast } from "sonner";

/**
 * Warns before this size so users can export a backup before writes fail.
 * localStorage quotas are typically ~5MB; serialized workspace JSON included.
 */
export const STORAGE_WARN_BYTES = 4 * 1024 * 1024;

let storageWarned = false;

function getBrowserStorage(): Storage | undefined {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return typeof ls === "undefined" ? undefined : ls;
  } catch {
    return undefined;
  }
}

function notifyStorage(message: string, level: "error" | "warning") {
  console.warn(`[vrello-up storage] ${message}`);
  try {
    if (typeof document !== "undefined") toast[level](message);
  } catch {
    // Headless environment (tests/SSR) — the console warning suffices.
  }
}

/**
 * localStorage wrapper: quota failures no longer throw out of persist,
 * and payloads near the ~5MB browser limit trigger a one-time warning.
 */
export const quotaAwareStorage: StateStorage = {
  getItem: (name) => getBrowserStorage()?.getItem(name) ?? null,
  setItem: (name, value) => {
    const storage = getBrowserStorage();
    if (!storage) return;
    try {
      storage.setItem(name, value);
    } catch {
      notifyStorage(
        "Workspace is too large to save — export a JSON backup, then delete old tasks.",
        "error",
      );
      return;
    }
    if (value.length > STORAGE_WARN_BYTES && !storageWarned) {
      storageWarned = true;
      notifyStorage(
        "Workspace is approaching the browser storage limit — export a backup soon.",
        "warning",
      );
    }
  },
  removeItem: (name) => {
    try {
      getBrowserStorage()?.removeItem(name);
    } catch {
      // Ignore cleanup failures; worst case a stale key remains.
    }
  },
};
