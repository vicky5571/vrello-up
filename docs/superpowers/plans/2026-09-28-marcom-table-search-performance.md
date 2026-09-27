# MarcomTableShell Performance & Search Extraction (Issue #11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unmemoized, full-object `JSON.stringify(row).toLowerCase().includes(q)` search in `MarcomTableShell.tsx` with a lightweight, pre-computed string extraction index that ignores technical IDs, URLs, and timestamps, preventing keystroke UI lag and false-positive matches.

**Architecture:**
1. Create a pure utility `extractSearchableText` in `src/components/views/shared/searchUtils.ts` that recursively extracts strings and numbers up to depth 2 while skipping internal IDs (`*Id`, `_id`), asset URLs (`photoUrl`, `mediaUrl`), technical metadata (`createdAt`, `updatedAt`, `__typename`), and ISO timestamp formats.
2. In `src/components/views/shared/MarcomTableShell.tsx`, add optional `searchKeys?: (keyof T)[]` and `getSearchableText?: (row: T) => string` props, and memoize a `searchIndex = [{ row, text }]` using a stable key hash so typing triggers instant `item.text.includes(q)` checks with zero object allocations or re-serialization per keystroke.
3. Verify zero regressions across all 7 consumer views (`BranchesView`, `ContentPlannerView`, `DocumentsView`, `EventTableView`, `MousView`, `OutletsView`, `PlacementsView`) and the entire 582-test suite.

**Tech Stack:** TypeScript 5, React 19, Node native test runner (`node --test`), Next.js 15 App Router

**Spec:** Audit Issue #11 in `vrello-up-confusion-audit.md` — `MarcomTableShell.tsx` Performance (`JSON.stringify` search 🟢).

---

## Global Constraints

- All source code, types, comments, variable names, test descriptions, and git commit messages MUST be in English.
- Import domain types from `@/types` (SSoT).
- DO NOT introduce new third-party dependencies (no Lunr, Fuse.js, or external search libraries — YAGNI).
- Keep `@ts-expect-error` directly above single-line imports when importing `.ts` files in Node test runner files.
- Dual-persistence and client responsiveness invariants must be preserved.
- Every task must end with passing tests (`npm test -- <test-file>`) and clean typecheck (`npx tsc --noEmit`).
- Commit after each task with conventional commit messages in English.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/views/shared/searchUtils.ts` | **Create** | Pure helper `extractSearchableText`, `isIgnoredKey`, `isIgnoredValue` for clean token extraction |
| `src/components/views/shared/searchUtils.test.ts` | **Create** | Unit tests for `extractSearchableText` covering primitives, nested objects, key whitelisting, and noise exclusion |
| `src/components/views/shared/MarcomTableShell.tsx` | **Modify** | Extend `MarcomTableShellProps` with `searchKeys` & `getSearchableText`, integrate pre-computed `searchIndex` |
| `vrello-up-confusion-audit.md` | **Modify** | Update Issue #11 status to `✅ Fixed` in the audit artifact |

---

### Task 1: Create `extractSearchableText` Utility & Unit Tests

**Files:**
- Create: `src/components/views/shared/searchUtils.ts`
- Create: `src/components/views/shared/searchUtils.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ExtractSearchableTextOptions {
    /** Optional explicit keys to inspect at root level. If omitted, all non-ignored keys are inspected. */
    keys?: string[];
    /** Maximum recursion depth for nested objects (default: 2). */
    maxDepth?: number;
  }

  export function isIgnoredKey(key: string): boolean;
  export function isIgnoredValue(val: string): boolean;
  export function extractSearchableText(
    value: unknown,
    options?: ExtractSearchableTextOptions | string[],
    currentDepth?: number
  ): string;
  ```

- [ ] **Step 1: Write failing unit tests in `src/components/views/shared/searchUtils.test.ts`**

Create `src/components/views/shared/searchUtils.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { extractSearchableText, isIgnoredKey, isIgnoredValue } from "./searchUtils.ts";

describe("searchUtils", () => {
  describe("isIgnoredKey", () => {
    it("identifies ID keys to ignore", () => {
      assert.strictEqual(isIgnoredKey("id"), true);
      assert.strictEqual(isIgnoredKey("outletId"), true);
      assert.strictEqual(isIgnoredKey("workspaceId"), true);
      assert.strictEqual(isIgnoredKey("branch_id"), true);
      assert.strictEqual(isIgnoredKey("createdById"), true);
      assert.strictEqual(isIgnoredKey("name"), false);
      assert.strictEqual(isIgnoredKey("code"), false);
      assert.strictEqual(isIgnoredKey("city"), false);
    });

    it("identifies URL and media asset keys to ignore", () => {
      assert.strictEqual(isIgnoredKey("photoUrl"), true);
      assert.strictEqual(isIgnoredKey("mediaUrl"), true);
      assert.strictEqual(isIgnoredKey("avatarUrl"), true);
      assert.strictEqual(isIgnoredKey("avatar"), true);
      assert.strictEqual(isIgnoredKey("thumbnail"), true);
      assert.strictEqual(isIgnoredKey("title"), false);
    });

    it("identifies metadata and audit keys to ignore", () => {
      assert.strictEqual(isIgnoredKey("createdAt"), true);
      assert.strictEqual(isIgnoredKey("updatedAt"), true);
      assert.strictEqual(isIgnoredKey("deletedAt"), true);
      assert.strictEqual(isIgnoredKey("__typename"), true);
      assert.strictEqual(isIgnoredKey("version"), true);
    });
  });

  describe("isIgnoredValue", () => {
    it("identifies ISO timestamps to ignore", () => {
      assert.strictEqual(isIgnoredValue("2026-09-28T01:27:11.000Z"), true);
      assert.strictEqual(isIgnoredValue("2026-01-15T12:00:00"), true);
      assert.strictEqual(isIgnoredValue("2026 Event Kickoff"), false);
    });

    it("identifies URLs to ignore", () => {
      assert.strictEqual(isIgnoredValue("https://r2.cloudflarestorage.com/photo.jpg"), true);
      assert.strictEqual(isIgnoredValue("http://example.com/asset.png"), true);
      assert.strictEqual(isIgnoredValue("Jl. Merdeka No. 45"), false);
    });

    it("identifies empty strings as ignored", () => {
      assert.strictEqual(isIgnoredValue(""), true);
      assert.strictEqual(isIgnoredValue("   "), true);
      assert.strictEqual(isIgnoredValue("Valid text"), false);
    });
  });

  describe("extractSearchableText", () => {
    it("handles primitives and nullish values safely", () => {
      assert.strictEqual(extractSearchableText(null), "");
      assert.strictEqual(extractSearchableText(undefined), "");
      assert.strictEqual(extractSearchableText("Hello World"), "Hello World");
      assert.strictEqual(extractSearchableText(42), "42");
      assert.strictEqual(extractSearchableText(true), "");
      assert.strictEqual(extractSearchableText(false), "");
    });

    it("extracts clean text from flat objects while skipping IDs, URLs, and timestamps", () => {
      const row = {
        id: "cuid-999",
        name: "Toko Berkah Abadi",
        code: "OUT-0091",
        city: "Bandung",
        photoUrl: "https://r2.cloudflarestorage.com/photo.jpg",
        createdAt: "2026-09-28T01:20:00.000Z",
        status: "APPROVED",
      };

      const extracted = extractSearchableText(row);
      assert.strictEqual(extracted, "Toko Berkah Abadi OUT-0091 Bandung APPROVED");
      assert.strictEqual(extracted.includes("cuid-999"), false);
      assert.strictEqual(extracted.includes("cloudflarestorage"), false);
      assert.strictEqual(extracted.includes("2026"), false);
    });

    it("extracts nested relations up to depth 2", () => {
      const placement = {
        id: "plc-123",
        notes: "Facing main road",
        status: "INSTALLED",
        outlet: {
          id: "out-456",
          name: "Sinar Jaya Cell",
          city: "Surabaya",
        },
        material: {
          id: "mat-789",
          name: "Neon Box 2x1",
        },
      };

      const extracted = extractSearchableText(placement);
      assert.strictEqual(
        extracted,
        "Facing main road INSTALLED Sinar Jaya Cell Surabaya Neon Box 2x1"
      );
    });

    it("stops recursion when maxDepth is reached to avoid deep traversal", () => {
      const deepObject = {
        level0: "Root",
        child: {
          level1: "Child",
          grandchild: {
            level2: "Grandchild",
            greatGrandchild: {
              level3: "TooDeep",
            },
          },
        },
      };

      const extracted = extractSearchableText(deepObject, { maxDepth: 2 });
      assert.strictEqual(extracted.includes("Root"), true);
      assert.strictEqual(extracted.includes("Child"), true);
      assert.strictEqual(extracted.includes("Grandchild"), true);
      assert.strictEqual(extracted.includes("TooDeep"), false);
    });

    it("handles arrays of strings or nested objects", () => {
      const eventItem = {
        eventName: "Roadshow 2026",
        tags: ["promo", "weekend", "mall"],
      };

      const extracted = extractSearchableText(eventItem);
      assert.strictEqual(extracted, "Roadshow 2026 promo weekend mall");
    });

    it("respects whitelist keys when specified", () => {
      const outlet = {
        id: "out-101",
        name: "Berkah Cell",
        code: "BC-01",
        city: "Jakarta",
        secretInternalNote: "Do not search this",
      };

      const extracted = extractSearchableText(outlet, { keys: ["name", "code"] });
      assert.strictEqual(extracted, "Berkah Cell BC-01");
      assert.strictEqual(extracted.includes("Jakarta"), false);
      assert.strictEqual(extracted.includes("secretInternalNote"), false);
    });

    it("supports string array shorthand for keys", () => {
      const outlet = {
        name: "Berkah Cell",
        code: "BC-01",
        city: "Jakarta",
      };

      const extracted = extractSearchableText(outlet, ["name", "city"]);
      assert.strictEqual(extracted, "Berkah Cell Jakarta");
      assert.strictEqual(extracted.includes("BC-01"), false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/shared/searchUtils.test.ts`
Expected: FAIL with "Cannot find module './searchUtils.ts'"

- [ ] **Step 3: Implement `src/components/views/shared/searchUtils.ts`**

Create `src/components/views/shared/searchUtils.ts`:

```typescript
/**
 * Utility functions for clean, high-performance text extraction and indexing.
 * Used by MarcomTableShell and search components to replace expensive full-object JSON.stringify.
 */

export interface ExtractSearchableTextOptions {
  /** Optional explicit keys to inspect at root level. If omitted, all non-ignored keys are inspected. */
  keys?: string[];
  /** Maximum recursion depth for nested objects (default: 2). */
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 2;

// Regular expression to match keys that should be ignored (IDs)
const IGNORED_KEY_SUFFIX_REGEX = /(^id$|[a-z0-9]+(_id|id)$)/i;

// Set of exact lowercased key names to ignore (audit, technical, and asset fields)
const IGNORED_KEY_EXACT_SET = new Set([
  "createdat",
  "updatedat",
  "deletedat",
  "__typename",
  "version",
  "avatar",
  "thumbnail",
]);

// Values that should be ignored to prevent false-positive queries (ISO dates, URLs)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const HTTP_URL_REGEX = /^https?:\/\//i;

/**
 * Determines whether an object property key represents technical noise (IDs, URLs, timestamps)
 * and should be excluded from search indexing.
 */
export function isIgnoredKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (IGNORED_KEY_EXACT_SET.has(lower)) return true;
  if (lower.includes("url")) return true;
  if (IGNORED_KEY_SUFFIX_REGEX.test(key)) return true;
  return false;
}

/**
 * Determines whether a string value represents technical noise (ISO date, web URL, empty whitespace)
 * rather than meaningful search terms.
 */
export function isIgnoredValue(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (ISO_DATE_REGEX.test(trimmed)) return true;
  if (HTTP_URL_REGEX.test(trimmed)) return true;
  return false;
}

/**
 * Recursively extracts clean, space-separated searchable text tokens from an entity or object.
 *
 * Excludes:
 * - Internal / relation IDs (e.g. `id`, `outletId`, `workspaceId`)
 * - URLs and image assets (e.g. `photoUrl`, `avatarUrl`)
 * - Technical metadata and ISO timestamps (e.g. `createdAt`, `2026-09-28T...`)
 * - Booleans, functions, and symbols
 *
 * Supports:
 * - Nested objects up to `maxDepth` (default: 2)
 * - Array of primitives or nested objects
 * - Optional restricted `keys` whitelist at the root level
 */
export function extractSearchableText(
  value: unknown,
  options?: ExtractSearchableTextOptions | string[],
  currentDepth = 0
): string {
  if (value == null) return "";

  const opts: ExtractSearchableTextOptions = Array.isArray(options)
    ? { keys: options }
    : options || {};
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;

  // Primitives
  if (typeof value === "string") {
    return isIgnoredValue(value) ? "" : value.trim();
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value !== "object") {
    return "";
  }

  // Arrays
  if (Array.isArray(value)) {
    if (currentDepth >= maxDepth) return "";
    const tokens: string[] = [];
    for (const item of value) {
      const extracted = extractSearchableText(item, { maxDepth }, currentDepth + 1);
      if (extracted) tokens.push(extracted);
    }
    return tokens.join(" ");
  }

  // Stop recursion beyond maxDepth
  if (currentDepth >= maxDepth) return "";

  const obj = value as Record<string, unknown>;
  const tokens: string[] = [];

  // Whitelisted keys at root level if specified
  const targetKeys =
    currentDepth === 0 && opts.keys && opts.keys.length > 0
      ? opts.keys
      : Object.keys(obj);

  for (const key of targetKeys) {
    if (isIgnoredKey(key)) continue;

    const val = obj[key];
    if (val == null) continue;

    if (typeof val === "string") {
      if (!isIgnoredValue(val)) {
        tokens.push(val.trim());
      }
    } else if (typeof val === "number") {
      if (Number.isFinite(val)) {
        tokens.push(String(val));
      }
    } else if (typeof val === "object") {
      // Recurse for child objects/arrays (whitelisted keys apply only to root level)
      const nested = extractSearchableText(val, { maxDepth }, currentDepth + 1);
      if (nested) {
        tokens.push(nested);
      }
    }
  }

  return tokens.join(" ");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/shared/searchUtils.test.ts`
Expected: PASS (all tests pass)

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/components/views/shared/searchUtils.ts src/components/views/shared/searchUtils.test.ts
git commit -m "feat: add extractSearchableText utility to clean and tokenize table search values"
```

---

### Task 2: Integrate `extractSearchableText` and Pre-Computed Index into `MarcomTableShell.tsx`

**Files:**
- Modify: `src/components/views/shared/MarcomTableShell.tsx:82-93` (props definition)
- Modify: `src/components/views/shared/MarcomTableShell.tsx:126` (component destructuring)
- Modify: `src/components/views/shared/MarcomTableShell.tsx:136-140` (search filtering logic)

**Interfaces:**
- Consumes:
  - `extractSearchableText` from `./searchUtils`
- Produces:
  - Extended `MarcomTableShellProps<T>` with:
    - `searchKeys?: (keyof T)[]`
    - `getSearchableText?: (row: T) => string`
  - Pre-computed `searchIndex` memoization in `MarcomTableShell`

- [ ] **Step 1: Update `MarcomTableShellProps` in `src/components/views/shared/MarcomTableShell.tsx`**

Add import at top of `src/components/views/shared/MarcomTableShell.tsx`:

```typescript
import { extractSearchableText } from "./searchUtils";
```

Extend `MarcomTableShellProps<T>`:

```typescript
  // search/filter control
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchKeys?: (keyof T)[];
  getSearchableText?: (row: T) => string;
```

- [ ] **Step 2: Destructure new props in `MarcomTableShell`**

In `MarcomTableShell` component signature / destructuring:

```typescript
  searchTerm,
  onSearchChange,
  searchKeys,
  getSearchableText,
  renderFloatingBulkBar,
```

- [ ] **Step 3: Replace `JSON.stringify` search with memoized `searchIndex`**

Replace lines 136-140:

```typescript
  // Pre-compute stable key hash to prevent unnecessary re-indexing if searchKeys is passed as an inline array
  const searchKeysHash = searchKeys ? (searchKeys as string[]).join(",") : "";

  // Pre-compute searchable string per row only when data or search configuration changes
  const searchIndex = useMemo(() => {
    return data.map((row) => {
      const text = getSearchableText
        ? getSearchableText(row).toLowerCase()
        : extractSearchableText(row, { keys: searchKeys as string[] }).toLowerCase();
      return { row, text };
    });
  }, [data, searchKeysHash, getSearchableText]);

  // High-performance filter: matches against pre-computed text with zero string allocations or object traversal per keystroke
  const filteredData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return data;
    return searchIndex
      .filter((item) => item.text.includes(q))
      .map((item) => item.row);
  }, [searchIndex, globalFilter, data]);
```

- [ ] **Step 4: Run full test suite and typecheck**

Run: `npm test`
Expected: All 582+ tests pass (0 failures).

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/shared/MarcomTableShell.tsx
git commit -m "perf: replace JSON.stringify table search with pre-computed extractSearchableText index"
```

---

### Task 3: Update Audit Ledger & Final Verification

**Files:**
- Modify: `vrello-up-confusion-audit.md` (artifact in conversation directory)

- [ ] **Step 1: Update Issue #11 status in `vrello-up-confusion-audit.md`**

Update the table row for Issue #11:
Change:
```markdown
| 11 | `JSON.stringify` search in MarcomTableShell | 🟢 Performance | Small | Field-specific search with memoization | ⏳ Open |
```
To:
```markdown
| 11 | `JSON.stringify` search in MarcomTableShell | 🟢 Performance | Small | Field-specific search with memoization | ✅ Fixed |
```

- [ ] **Step 2: Run complete project test suite**

Run: `npm test`
Expected: All suites pass with 0 failures.

Run: `npx tsc --noEmit`
Expected: Clean output with 0 errors.

- [ ] **Step 3: Verify git status is clean**

Run: `git status`
Expected: Working tree clean.
