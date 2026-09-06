import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { quotaAwareStorage, STORAGE_WARN_BYTES } from "./useWorkspaceStore.ts";

function fakeStorage(impl: Partial<Storage> = {}): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    ...impl,
  } as Storage;
}

function withLocalStorage(storage: Storage | undefined, fn: () => void) {
  const key = "localStorage";
  const prev = (globalThis as Record<string, unknown>)[key];
  try {
    if (storage === undefined) delete (globalThis as Record<string, unknown>)[key];
    else (globalThis as Record<string, unknown>)[key] = storage;
    fn();
  } finally {
    if (prev === undefined) delete (globalThis as Record<string, unknown>)[key];
    else (globalThis as Record<string, unknown>)[key] = prev;
  }
}

function captureWarnings(fn: () => void): string[] {
  const messages: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    messages.push(args.map(String).join(" "));
  };
  try {
    fn();
  } finally {
    console.warn = original;
  }
  return messages;
}

test("quotaAwareStorage passes reads, writes, and removals through", () => {
  withLocalStorage(fakeStorage(), () => {
    quotaAwareStorage.setItem("k", "v");
    assert.equal(quotaAwareStorage.getItem("k"), "v");
    quotaAwareStorage.removeItem?.("k");
    assert.equal(quotaAwareStorage.getItem("k"), null);
  });
});

test("quotaAwareStorage swallows quota errors instead of throwing", () => {
  const full = fakeStorage({
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  });
  withLocalStorage(full, () => {
    const warnings = captureWarnings(() => {
      quotaAwareStorage.setItem("k", "v");
    });
    assert.match(warnings.join("\n"), /too large to save/);
  });
});

test("quotaAwareStorage warns once when the payload nears the limit", () => {
  withLocalStorage(fakeStorage(), () => {
    const warnings = captureWarnings(() => {
      quotaAwareStorage.setItem("k", "small");
      quotaAwareStorage.setItem("k", "x".repeat(STORAGE_WARN_BYTES + 1));
      quotaAwareStorage.setItem("k", "x".repeat(STORAGE_WARN_BYTES + 1));
    });
    assert.equal(warnings.filter((m) => /approaching/.test(m)).length, 1);
  });
});

test("quotaAwareStorage does nothing when localStorage is unavailable", () => {
  withLocalStorage(undefined, () => {
    const warnings = captureWarnings(() => {
      quotaAwareStorage.setItem("k", "v");
    });
    assert.equal(quotaAwareStorage.getItem("k"), null);
    assert.deepEqual(warnings, []);
  });
});
