# Decouple Task ↔ Marcom Hardcoded IDs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all scattered hardcoded Marcom entity IDs (`"space-marcom"`, `"list-content-planner"`, `"list-field-ops"`, `"tag-ops"`, `"tag-alert"`, `"list-design-system"`, `"status-todo"`, etc.) from production code by centralizing them into a single config module with name-based fallback resolution, so sync doesn't silently fail when entities are renamed or deleted.

**Architecture:** Extract a `src/lib/marcom/marcomIds.ts` config module that exports well-documented constant objects for all Marcom seed IDs. All consumers import from this module instead of inlining magic strings. The module also provides resolver functions that try the seed ID first, then fall back to name-based matching (e.g. `name.toLowerCase().includes("field")`), so the system degrades gracefully when seed entities are renamed/deleted. Seeds file (`src/lib/constants/seeds.ts`) and API seed route (`src/app/api/tasks/route.ts`) also import from this config to maintain SSoT.

**Tech Stack:** TypeScript 5, Node native test runner (`node --test`)

**Spec:** Audit Issue #7 in `vrello-up-confusion-audit.md` — Task ↔ Marcom leaky coupling via hardcoded IDs.

**Status:** ✅ Implemented 2026-09-27. Commits `d77c1e2` → `9307f07`.
Verification: `npm test` → **570 pass / 0 fail**; `npx tsc --noEmit` → clean;
Task 8 grep → **zero results**.

### Deviations from the written plan (all deliberate)

1. **Defective test fixture in Task 1, Step 2 (corrected).** The plan asserted
   that `"Operations Board"` resolves via the `"ops"` hint. It cannot —
   `"operations"` is `o-p-e-r-a-t-i-o-n-s`, which does not contain the
   substring `"ops"`. The legacy lookup being replaced
   (`n.includes("ops")` in `targetSpaceList.ts`) had the same behaviour, so
   the resolver is correct and the fixture was wrong. The fixture now uses
   `"Ops Board"`, plus a new negative test locking in substring parity.

2. **Task 2 used the resolvers instead of re-inlining the hint arrays.**
   The plan's Step 1 expanded the fallback logic inline
   (`flat.find(...) || MARCOM_SPACE_NAME_HINTS.some(...)`), which would have
   duplicated the resolver semantics in a second location — the exact
   scattered-coupling problem this plan exists to remove. `targetSpaceList.ts`
   now calls `resolveMarcomSpace` / `resolveContentList` / `resolveFieldOpsList`
   directly. Behaviour is identical except that `MARCOM_SPACE_NAME_HINTS` now
   contributes `"marcom"` and `"campaign"` in addition to `"marketing"`
   (already the plan's intent).

3. **Task 7 replaced *all* seed-block ID literals, not just the 5 enumerated.**
   Task 8's grep includes `"list-design-system"` and excludes `marcomIds.ts`
   but not `seeds.ts` / `api/tasks/route.ts`, so limiting the change to the
   enumerated lines would have left the grep non-empty and the plan's own
   acceptance criterion unsatisfiable. All Marcom ID literals in both seed
   files were centralised, including `space-product`.

4. **Also replaced (small consistency extras).** `useWorkspaceStore.ts:152`
   (`"space-product"` — omitted from the plan's inventory) and
   `Sidebar.tsx:111` (`"space-product"`). Both sit on the same line/literal
   as an in-scope ID and both IDs are declared in-scope ("All Space/List IDs").

### Known gap — NOT implemented

The Scope Decision declares the `"status-*"` terminal fallbacks inside
`placementTaskSync.ts` (3 sites) and `eventTaskSync.ts` (1 site) to be
**in scope**, but the File Structure table and every task step omit them.

They were deliberately left alone:

- `marcomIds.ts` is documented as a **Marcom seed entity ID** config. Status IDs
  are workspace-level, not Marcom-specific, so putting them there would
  misplace them architecturally.
- `DEFAULT_STATUSES` in `src/lib/constants/seeds.ts` is already the canonical
  definition of these IDs.
- Task 8's acceptance grep does not cover status IDs.

If this gap should be closed, the correct shape is a separate
`src/lib/constants/statusIds.ts` (or exporting `STATUS_*_ID` from `seeds.ts`)
consumed by both Marcom sync modules — not additions to `marcomIds.ts`.

---

## Global Constraints

- All source code, types, comments, variable names, and commit messages MUST be in English.
- Import domain types only from `@/types` (SSoT).
- DO NOT add new dependencies.
- Every task ends with passing tests: `npm test -- <test-file>`.
- Commit after each task with conventional commit messages.

---

## Inventory of Hardcoded IDs (Research Summary)

### Space & List IDs

| Magic String | Occurrences (non-test, non-seed) | Files |
|---|---|---|
| `"space-marcom"` | 4 | `Sidebar.tsx:112`, `workspaceSync.ts:97`, `targetSpaceList.ts:68`, `api/tasks/route.ts:64` |
| `"list-content-planner"` | 4 | `ContentPlannerView.tsx:367,497`, `targetSpaceList.ts:80`, `api/tasks/route.ts:72,120` |
| `"list-field-ops"` | 5 | `EventFormModal.tsx:393`, `EventsView.tsx:222`, `PlacementsView.tsx:238`, `placementTaskSync.ts:122`, `targetSpaceList.ts:92` |
| `"list-design-system"` | 4 | `automationOperations.ts:105`, `createSpaceSlice.ts:29`, `createTaskSlice.ts:99`, `useWorkspaceStore.ts:153` |
| `"space-product"` | 2 | `createSpaceSlice.ts:28`, `workspaceSync.ts:96` |

### Status IDs (as last-resort fallbacks)

| Magic String | Occurrences (non-test, non-seed) |
|---|---|
| `"status-todo"` | 12 — used as terminal fallback in `CreateTaskModal`, `ContentPlannerView`, `EventsView`, `GanttView`, `scheduler.ts`, `automationOperations`, `spacesOperations`, `eventTaskSync`, `placementTaskSync`, `workspaceCrud.ts`, `api/workspaces/route.ts` |
| `"status-in-progress"` | 2 — `placementTaskSync.ts:81`, `api/tasks/route.ts:98,123` |
| `"status-done"` | 2 — `placementTaskSync.ts:70`, `GanttView.tsx:225` |

### Tag IDs

| Magic String | Occurrences |
|---|---|
| `"tag-ops"` | 1 — `automationOperations.ts:141` |
| `"tag-alert"` | 1 — `automationOperations.ts:175` |

### Scope Decision

**In scope:** All Space/List IDs, Tag IDs, and the `"status-*"` fallbacks inside `placementTaskSync.ts` and `eventTaskSync.ts` (Marcom-specific sync modules).

**Out of scope:** Generic `"status-todo"` terminal fallbacks in `CreateTaskModal`, `GanttView`, `spacesOperations`, `workspaceCrud.ts`, and `api/workspaces/route.ts`. These are not Marcom coupling — they're workspace-level defaults that need the hardcoded string as an absolute last resort when no statuses exist at all. The `workspaceCrud.ts` DEFAULT_STATUSES definition is the canonical source for these IDs and should stay as-is.

**Also out of scope:** `seeds.ts` and `api/tasks/route.ts` seed data blocks — these are the *definitions* of the IDs, not consumers. They will import from the new config module to stay in sync, but their structure doesn't change.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/marcom/marcomIds.ts` | **Create** | Single source of truth for all Marcom seed entity IDs, name-based fallback tags, and resolver functions |
| `src/lib/marcom/marcomIds.test.ts` | **Create** | Tests for resolver functions |
| `src/lib/tasks/targetSpaceList.ts` | **Modify** | Replace 3 hardcoded IDs with imports from `marcomIds` |
| `src/lib/tasks/placementTaskSync.ts` | **Modify** | Replace `"list-field-ops"` with import from `marcomIds` |
| `src/lib/store/automationOperations.ts` | **Modify** | Replace `"tag-ops"`, `"tag-alert"`, `"list-design-system"` with imports from `marcomIds` |
| `src/lib/store/slices/createSpaceSlice.ts` | **Modify** | Replace `"space-product"`, `"list-design-system"` with imports from `marcomIds` |
| `src/components/layout/Sidebar.tsx` | **Modify** | Replace `"space-marcom"` with import from `marcomIds` |
| `src/lib/store/workspaceSync.ts` | **Modify** | Replace `"space-product"`, `"space-marcom"` with imports from `marcomIds` |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | **Modify** | Replace `"list-content-planner"` fallbacks with import from `marcomIds` |
| `src/components/views/EventsView/EventFormModal.tsx` | **Modify** | Replace `"list-field-ops"` fallback with import from `marcomIds` |
| `src/components/views/EventsView/EventsView.tsx` | **Modify** | Replace `"list-field-ops"` fallback with import from `marcomIds` |
| `src/components/views/PlacementsView/PlacementsView.tsx` | **Modify** | Replace `"list-field-ops"` with import from `marcomIds` |
| `src/lib/constants/seeds.ts` | **Modify** | Import IDs from `marcomIds` instead of defining inline |
| `src/app/api/tasks/route.ts` | **Modify** | Import IDs from `marcomIds` for seed blocks |

---

### Task 1: Create the `marcomIds` Config Module + Tests

**Files:**
- Create: `src/lib/marcom/marcomIds.ts`
- Create: `src/lib/marcom/marcomIds.test.ts`

**Interfaces:**
- Consumes: Nothing (leaf module).
- Produces:
  - `MARCOM_SPACE_ID: string` — `"space-marcom"`
  - `PRODUCT_SPACE_ID: string` — `"space-product"`
  - `CONTENT_PLANNER_LIST_ID: string` — `"list-content-planner"`
  - `FIELD_OPS_LIST_ID: string` — `"list-field-ops"`
  - `DESIGN_SYSTEM_LIST_ID: string` — `"list-design-system"`
  - `OPS_TAG: Tag` — `{ id: "tag-ops", name: "Operations", color: "#059669" }`
  - `ALERT_TAG: Tag` — `{ id: "tag-alert", name: "Urgent Alert", color: "#DC2626" }`
  - `MARCOM_SPACE_NAME_HINTS: readonly string[]` — `["marketing", "marcom", "campaign"]`
  - `CONTENT_LIST_NAME_HINTS: readonly string[]` — `["content", "social", "planner"]`
  - `FIELD_OPS_LIST_NAME_HINTS: readonly string[]` — `["field", "ops", "event"]`
  - `resolveMarcomSpace(spaces: FlatSpaceOption[]): FlatSpaceOption | undefined`
  - `resolveContentList(lists: List[]): List | undefined`
  - `resolveFieldOpsList(lists: List[]): List | undefined`

- [x] **Step 1: Write the config module**

Create `src/lib/marcom/marcomIds.ts`:

```typescript
/**
 * Centralized Marcom seed entity IDs.
 *
 * These IDs match the seed data in `src/lib/constants/seeds.ts` and
 * `src/app/api/tasks/route.ts`. All production code MUST import from
 * here instead of inlining magic strings.
 *
 * Each constant also has a companion name-hint array and resolver
 * function so lookups degrade gracefully when the seed ID is missing
 * (e.g. user renamed or deleted the entity).
 */

import type { List, Tag } from "@/types";

// ─── Space IDs ──────────────────────────────────────────────────────
export const MARCOM_SPACE_ID = "space-marcom" as const;
export const PRODUCT_SPACE_ID = "space-product" as const;

// ─── List IDs ───────────────────────────────────────────────────────
export const CONTENT_PLANNER_LIST_ID = "list-content-planner" as const;
export const FIELD_OPS_LIST_ID = "list-field-ops" as const;
export const DESIGN_SYSTEM_LIST_ID = "list-design-system" as const;

// ─── Default Seed Space IDs (for initial expand / sync guard) ──────
export const DEFAULT_SEED_SPACE_IDS = [
  PRODUCT_SPACE_ID,
  MARCOM_SPACE_ID,
] as const;

// ─── Tag Presets ────────────────────────────────────────────────────
export const OPS_TAG: Readonly<Tag> = {
  id: "tag-ops",
  name: "Operations",
  color: "#059669",
} as const;

export const ALERT_TAG: Readonly<Tag> = {
  id: "tag-alert",
  name: "Urgent Alert",
  color: "#DC2626",
} as const;

// ─── Name-Based Fallback Hints ──────────────────────────────────────
// Used by resolver functions when the seed ID doesn't match any entity.

export const MARCOM_SPACE_NAME_HINTS = [
  "marketing",
  "marcom",
  "campaign",
] as const;

export const CONTENT_LIST_NAME_HINTS = [
  "content",
  "social",
  "planner",
] as const;

export const FIELD_OPS_LIST_NAME_HINTS = [
  "field",
  "ops",
  "event",
] as const;

// ─── Resolver Functions ─────────────────────────────────────────────

interface SpaceLike {
  id: string;
  name: string;
}

/**
 * Resolves the Marcom space: seed ID first, then name-based matching.
 */
export function resolveMarcomSpace<T extends SpaceLike>(
  spaces: T[],
): T | undefined {
  if (!spaces || spaces.length === 0) return undefined;
  const byId = spaces.find((s) => s.id === MARCOM_SPACE_ID);
  if (byId) return byId;
  const lower = (s: T) => s.name.toLowerCase();
  return spaces.find((s) =>
    MARCOM_SPACE_NAME_HINTS.some((hint) => lower(s).includes(hint)),
  );
}

/**
 * Resolves the Content Planner list: seed ID first, then name-based matching.
 */
export function resolveContentList(lists: List[]): List | undefined {
  if (!lists || lists.length === 0) return undefined;
  const byId = lists.find((l) => l.id === CONTENT_PLANNER_LIST_ID);
  if (byId) return byId;
  const lower = (l: List) => l.name.toLowerCase();
  return lists.find((l) =>
    CONTENT_LIST_NAME_HINTS.some((hint) => lower(l).includes(hint)),
  );
}

/**
 * Resolves the Field Ops list: seed ID first, then name-based matching.
 */
export function resolveFieldOpsList(lists: List[]): List | undefined {
  if (!lists || lists.length === 0) return undefined;
  const byId = lists.find((l) => l.id === FIELD_OPS_LIST_ID);
  if (byId) return byId;
  const lower = (l: List) => l.name.toLowerCase();
  return lists.find((l) =>
    FIELD_OPS_LIST_NAME_HINTS.some((hint) => lower(l).includes(hint)),
  );
}
```

- [x] **Step 2: Write the tests**

Create `src/lib/marcom/marcomIds.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MARCOM_SPACE_ID,
  CONTENT_PLANNER_LIST_ID,
  FIELD_OPS_LIST_ID,
  DESIGN_SYSTEM_LIST_ID,
  OPS_TAG,
  ALERT_TAG,
  resolveMarcomSpace,
  resolveContentList,
  resolveFieldOpsList,
} from "./marcomIds";

describe("marcomIds constants", () => {
  it("exports expected seed IDs", () => {
    assert.equal(MARCOM_SPACE_ID, "space-marcom");
    assert.equal(CONTENT_PLANNER_LIST_ID, "list-content-planner");
    assert.equal(FIELD_OPS_LIST_ID, "list-field-ops");
    assert.equal(DESIGN_SYSTEM_LIST_ID, "list-design-system");
  });

  it("exports tag presets with correct shape", () => {
    assert.equal(OPS_TAG.id, "tag-ops");
    assert.equal(OPS_TAG.name, "Operations");
    assert.equal(ALERT_TAG.id, "tag-alert");
    assert.equal(ALERT_TAG.name, "Urgent Alert");
  });
});

describe("resolveMarcomSpace", () => {
  const spaces = [
    { id: "space-product", name: "Product & Engineering" },
    { id: "space-marcom", name: "Marketing & Campaigns" },
  ];

  it("resolves by seed ID first", () => {
    const result = resolveMarcomSpace(spaces);
    assert.equal(result?.id, "space-marcom");
  });

  it("falls back to name-based matching when seed ID missing", () => {
    const renamed = [
      { id: "space-1", name: "Product" },
      { id: "space-2", name: "Our Marketing Dept" },
    ];
    const result = resolveMarcomSpace(renamed);
    assert.equal(result?.id, "space-2");
  });

  it("returns undefined for empty array", () => {
    assert.equal(resolveMarcomSpace([]), undefined);
  });

  it("returns undefined when no match at all", () => {
    const unrelated = [{ id: "space-x", name: "Engineering" }];
    assert.equal(resolveMarcomSpace(unrelated), undefined);
  });
});

describe("resolveContentList", () => {
  const lists = [
    { id: "list-content-planner", name: "Social & Content Calendar", spaceId: "s1" },
    { id: "list-other", name: "Backlog", spaceId: "s1" },
  ] as any[];

  it("resolves by seed ID first", () => {
    const result = resolveContentList(lists);
    assert.equal(result?.id, "list-content-planner");
  });

  it("falls back to name containing 'content'", () => {
    const renamed = [
      { id: "list-x", name: "Content Calendar v2", spaceId: "s1" },
    ] as any[];
    assert.equal(resolveContentList(renamed)?.id, "list-x");
  });

  it("returns undefined for empty array", () => {
    assert.equal(resolveContentList([]), undefined);
  });
});

describe("resolveFieldOpsList", () => {
  const lists = [
    { id: "list-field-ops", name: "Field Operations & Setup", spaceId: "s1" },
    { id: "list-content-planner", name: "Content Calendar", spaceId: "s1" },
  ] as any[];

  it("resolves by seed ID first", () => {
    const result = resolveFieldOpsList(lists);
    assert.equal(result?.id, "list-field-ops");
  });

  it("falls back to name containing 'field'", () => {
    const renamed = [
      { id: "list-99", name: "Field Activities", spaceId: "s1" },
    ] as any[];
    assert.equal(resolveFieldOpsList(renamed)?.id, "list-99");
  });

  it("falls back to name containing 'ops'", () => {
    const renamed = [
      { id: "list-88", name: "Operations Board", spaceId: "s1" },
    ] as any[];
    assert.equal(resolveFieldOpsList(renamed)?.id, "list-88");
  });

  it("returns undefined for empty array", () => {
    assert.equal(resolveFieldOpsList([]), undefined);
  });
});
```

- [x] **Step 3: Run tests to verify they pass**

Run: `npm test -- src/lib/marcom/marcomIds.test.ts`
Expected: All tests PASS.

- [x] **Step 4: Commit**

```bash
git add src/lib/marcom/marcomIds.ts src/lib/marcom/marcomIds.test.ts
git commit -m "feat: add marcomIds config module centralizing all seed entity IDs"
```

---

### Task 2: Migrate `targetSpaceList.ts` to Use `marcomIds`

**Files:**
- Modify: `src/lib/tasks/targetSpaceList.ts:68,80,92`
- Test: `src/lib/tasks/targetSpaceList.test.ts` (existing — should still pass without changes)

**Interfaces:**
- Consumes: `MARCOM_SPACE_ID`, `CONTENT_PLANNER_LIST_ID`, `FIELD_OPS_LIST_ID`, `MARCOM_SPACE_NAME_HINTS`, `CONTENT_LIST_NAME_HINTS`, `FIELD_OPS_LIST_NAME_HINTS` from `marcomIds.ts`
- Produces: Same public API as before (no signature changes).

- [x] **Step 1: Replace hardcoded IDs in `targetSpaceList.ts`**

Add import at top:

```typescript
import {
  MARCOM_SPACE_ID,
  CONTENT_PLANNER_LIST_ID,
  FIELD_OPS_LIST_ID,
  MARCOM_SPACE_NAME_HINTS,
  CONTENT_LIST_NAME_HINTS,
  FIELD_OPS_LIST_NAME_HINTS,
} from "@/lib/marcom/marcomIds";
```

Replace line 68:
```typescript
// Before:
flat.find((s) => s.id === "space-marcom") ||
flat.find((s) => s.name.toLowerCase().includes("marketing")) ||
// After:
flat.find((s) => s.id === MARCOM_SPACE_ID) ||
flat.find((s) => MARCOM_SPACE_NAME_HINTS.some((h) => s.name.toLowerCase().includes(h))) ||
```

Replace line 80:
```typescript
// Before:
targetSpace.lists.find((l) => l.id === "list-content-planner") ||
targetSpace.lists.find((l) => {
  const n = l.name.toLowerCase();
  return n.includes("content") || n.includes("social") || n.includes("planner");
}) ||
// After:
targetSpace.lists.find((l) => l.id === CONTENT_PLANNER_LIST_ID) ||
targetSpace.lists.find((l) =>
  CONTENT_LIST_NAME_HINTS.some((h) => l.name.toLowerCase().includes(h)),
) ||
```

Replace line 92:
```typescript
// Before:
targetSpace.lists.find((l) => l.id === "list-field-ops") ||
targetSpace.lists.find((l) => {
  const n = l.name.toLowerCase();
  return n.includes("field") || n.includes("ops") || n.includes("event");
}) ||
// After:
targetSpace.lists.find((l) => l.id === FIELD_OPS_LIST_ID) ||
targetSpace.lists.find((l) =>
  FIELD_OPS_LIST_NAME_HINTS.some((h) => l.name.toLowerCase().includes(h)),
) ||
```

- [x] **Step 2: Run existing tests to verify nothing broke**

Run: `npm test -- src/lib/tasks/targetSpaceList.test.ts`
Expected: All tests PASS (the test file uses the same hardcoded strings in test fixtures, which is correct — test data should use literal values).

- [x] **Step 3: Commit**

```bash
git add src/lib/tasks/targetSpaceList.ts
git commit -m "refactor: replace hardcoded IDs in targetSpaceList with marcomIds constants"
```

---

### Task 3: Migrate `placementTaskSync.ts` to Use `marcomIds`

**Files:**
- Modify: `src/lib/tasks/placementTaskSync.ts:122`
- Test: `src/lib/tasks/placementTaskSync.test.ts` (existing — should still pass)

**Interfaces:**
- Consumes: `FIELD_OPS_LIST_ID` from `marcomIds.ts`
- Produces: Same public API (`buildPlacementTaskPayload` signature unchanged).

- [x] **Step 1: Replace hardcoded `"list-field-ops"` in `placementTaskSync.ts`**

Add import at top:

```typescript
import { FIELD_OPS_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace line 122:
```typescript
// Before:
listId: "list-field-ops",
// After:
listId: FIELD_OPS_LIST_ID,
```

- [x] **Step 2: Run existing tests**

Run: `npm test -- src/lib/tasks/placementTaskSync.test.ts`
Expected: All tests PASS.

- [x] **Step 3: Commit**

```bash
git add src/lib/tasks/placementTaskSync.ts
git commit -m "refactor: replace hardcoded list-field-ops in placementTaskSync with marcomIds constant"
```

---

### Task 4: Migrate `automationOperations.ts` to Use `marcomIds`

**Files:**
- Modify: `src/lib/store/automationOperations.ts:105,141,175`

**Interfaces:**
- Consumes: `DESIGN_SYSTEM_LIST_ID`, `OPS_TAG`, `ALERT_TAG` from `marcomIds.ts`
- Produces: Same public API.

- [x] **Step 1: Replace hardcoded IDs in `automationOperations.ts`**

Add import at top:

```typescript
import { DESIGN_SYSTEM_LIST_ID, OPS_TAG, ALERT_TAG } from "@/lib/marcom/marcomIds";
```

Replace line 105:
```typescript
// Before:
defaultSpace?.lists[0]?.id || context.activeListId || "list-design-system";
// After:
defaultSpace?.lists[0]?.id || context.activeListId || DESIGN_SYSTEM_LIST_ID;
```

Replace line 141:
```typescript
// Before:
tags: [{ id: "tag-ops", name: "Operations", color: "#059669" }],
// After:
tags: [{ ...OPS_TAG }],
```

Replace line 175:
```typescript
// Before:
{ id: "tag-alert", name: "Urgent Alert", color: "#DC2626" },
// After:
{ ...ALERT_TAG },
```

- [x] **Step 2: Run full test suite (this module has transitive test coverage)**

Run: `npm test`
Expected: All 553+ tests PASS.

- [x] **Step 3: Commit**

```bash
git add src/lib/store/automationOperations.ts
git commit -m "refactor: replace hardcoded tag/list IDs in automationOperations with marcomIds constants"
```

---

### Task 5: Migrate `createSpaceSlice.ts` and `workspaceSync.ts`

**Files:**
- Modify: `src/lib/store/slices/createSpaceSlice.ts:28-29`
- Modify: `src/lib/store/workspaceSync.ts:96-97`

**Interfaces:**
- Consumes: `PRODUCT_SPACE_ID`, `DESIGN_SYSTEM_LIST_ID`, `MARCOM_SPACE_ID`, `DEFAULT_SEED_SPACE_IDS` from `marcomIds.ts`
- Produces: Same public API.

- [x] **Step 1: Replace hardcoded IDs in `createSpaceSlice.ts`**

Add import:

```typescript
import { PRODUCT_SPACE_ID, DESIGN_SYSTEM_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace lines 28-29:
```typescript
// Before:
activeSpaceId: "space-product",
activeListId: "list-design-system",
// After:
activeSpaceId: PRODUCT_SPACE_ID,
activeListId: DESIGN_SYSTEM_LIST_ID,
```

- [x] **Step 2: Replace hardcoded IDs in `workspaceSync.ts`**

Add import:

```typescript
import { DEFAULT_SEED_SPACE_IDS } from "@/lib/marcom/marcomIds";
```

Replace lines 95-97:
```typescript
// Before:
const isDefaultSpace =
  s.id === "space-product" ||
  s.id === "space-marcom";
// After:
const isDefaultSpace = (DEFAULT_SEED_SPACE_IDS as readonly string[]).includes(s.id);
```

- [x] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS.

- [x] **Step 4: Commit**

```bash
git add src/lib/store/slices/createSpaceSlice.ts src/lib/store/workspaceSync.ts
git commit -m "refactor: replace hardcoded space/list IDs in store slices with marcomIds constants"
```

---

### Task 6: Migrate View Components (`Sidebar`, `ContentPlannerView`, `EventsView`, `EventFormModal`, `PlacementsView`)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:112`
- Modify: `src/components/views/ContentPlannerView/ContentPlannerView.tsx:367,497`
- Modify: `src/components/views/EventsView/EventFormModal.tsx:393`
- Modify: `src/components/views/EventsView/EventsView.tsx:222`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx:238`

**Interfaces:**
- Consumes: `MARCOM_SPACE_ID`, `CONTENT_PLANNER_LIST_ID`, `FIELD_OPS_LIST_ID` from `marcomIds.ts`
- Produces: No API changes.

- [x] **Step 1: Replace in `Sidebar.tsx`**

Add import:

```typescript
import { MARCOM_SPACE_ID } from "@/lib/marcom/marcomIds";
```

Replace line 112:
```typescript
// Before:
"space-marcom": true,
// After:
[MARCOM_SPACE_ID]: true,
```

- [x] **Step 2: Replace in `ContentPlannerView.tsx`**

Add import:

```typescript
import { CONTENT_PLANNER_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace line 367:
```typescript
// Before:
targetListId || activeListId || "list-content-planner";
// After:
targetListId || activeListId || CONTENT_PLANNER_LIST_ID;
```

Replace line 497:
```typescript
// Before:
const chosenListId = dest.listId || activeListId || "list-content-planner";
// After:
const chosenListId = dest.listId || activeListId || CONTENT_PLANNER_LIST_ID;
```

- [x] **Step 3: Replace in `EventFormModal.tsx`**

Add import:

```typescript
import { FIELD_OPS_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace line 393:
```typescript
// Before:
const chosenListId = targetListId || targetSpace?.lists[0]?.id || "list-field-ops";
// After:
const chosenListId = targetListId || targetSpace?.lists[0]?.id || FIELD_OPS_LIST_ID;
```

- [x] **Step 4: Replace in `EventsView.tsx`**

Add import:

```typescript
import { FIELD_OPS_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace line 222:
```typescript
// Before:
const chosenListId = dest.listId || activeListId || "list-field-ops";
// After:
const chosenListId = dest.listId || activeListId || FIELD_OPS_LIST_ID;
```

- [x] **Step 5: Replace in `PlacementsView.tsx`**

Add import:

```typescript
import { FIELD_OPS_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace line 238:
```typescript
// Before:
currentWorkspace?.spaces.find((s) => s.lists.some((l) => l.id === "list-field-ops")) ||
// After:
currentWorkspace?.spaces.find((s) => s.lists.some((l) => l.id === FIELD_OPS_LIST_ID)) ||
```

- [x] **Step 6: Run full test suite**

Run: `npm test`
Expected: All tests PASS.

- [x] **Step 7: Commit**

```bash
git add src/components/layout/Sidebar.tsx \
  src/components/views/ContentPlannerView/ContentPlannerView.tsx \
  src/components/views/EventsView/EventFormModal.tsx \
  src/components/views/EventsView/EventsView.tsx \
  src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "refactor: replace hardcoded marcom IDs in view components with marcomIds constants"
```

---

### Task 7: Migrate Seed Definitions (`seeds.ts` + `api/tasks/route.ts`)

**Files:**
- Modify: `src/lib/constants/seeds.ts:103,112-113,118-119`
- Modify: `src/app/api/tasks/route.ts:64,72,77,120,143`
- Modify: `src/lib/store/slices/createTaskSlice.ts:99`
- Modify: `src/lib/store/useWorkspaceStore.ts:153`

**Interfaces:**
- Consumes: `MARCOM_SPACE_ID`, `CONTENT_PLANNER_LIST_ID`, `FIELD_OPS_LIST_ID`, `DESIGN_SYSTEM_LIST_ID` from `marcomIds.ts`
- Produces: No API changes.

- [x] **Step 1: Replace in `seeds.ts`**

Add import:

```typescript
import {
  MARCOM_SPACE_ID,
  CONTENT_PLANNER_LIST_ID,
  FIELD_OPS_LIST_ID,
} from "@/lib/marcom/marcomIds";
```

Replace the 5 occurrences:
- Line 103: `id: "space-marcom"` → `id: MARCOM_SPACE_ID`
- Line 112: `id: "list-content-planner"` → `id: CONTENT_PLANNER_LIST_ID`
- Line 113: `spaceId: "space-marcom"` → `spaceId: MARCOM_SPACE_ID`
- Line 118: `id: "list-field-ops"` → `id: FIELD_OPS_LIST_ID`
- Line 119: `spaceId: "space-marcom"` → `spaceId: MARCOM_SPACE_ID`

- [x] **Step 2: Replace in `api/tasks/route.ts`**

Add import:

```typescript
import {
  MARCOM_SPACE_ID,
  CONTENT_PLANNER_LIST_ID,
  FIELD_OPS_LIST_ID,
} from "@/lib/marcom/marcomIds";
```

Replace 5 occurrences:
- Line 64: `id: "space-marcom"` → `id: MARCOM_SPACE_ID`
- Line 72: `id: "list-content-planner"` → `id: CONTENT_PLANNER_LIST_ID`
- Line 77: `id: "list-field-ops"` → `id: FIELD_OPS_LIST_ID`
- Line 120: `listId: "list-content-planner"` → `listId: CONTENT_PLANNER_LIST_ID`
- Line 143: `listId: "list-field-ops"` → `listId: FIELD_OPS_LIST_ID`

- [x] **Step 3: Replace in `createTaskSlice.ts`**

Add import:

```typescript
import { DESIGN_SYSTEM_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace line 99:
```typescript
// Before:
"list-design-system";
// After:
DESIGN_SYSTEM_LIST_ID;
```

- [x] **Step 4: Replace in `useWorkspaceStore.ts`**

Add import:

```typescript
import { DESIGN_SYSTEM_LIST_ID } from "@/lib/marcom/marcomIds";
```

Replace the `"list-design-system"` on line 153:
```typescript
// Before:
... || "list-design-system"),
// After:
... || DESIGN_SYSTEM_LIST_ID),
```

- [x] **Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS.

- [x] **Step 6: Commit**

```bash
git add src/lib/constants/seeds.ts src/app/api/tasks/route.ts \
  src/lib/store/slices/createTaskSlice.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor: replace hardcoded IDs in seeds and store entry points with marcomIds constants"
```

---

### Task 8: Verify Zero Remaining Hardcoded IDs + Final Validation

**Files:**
- No file changes. Verification-only task.

- [x] **Step 1: Grep to confirm no hardcoded IDs remain in non-test production code**

```bash
git grep -n '"space-marcom"\|"list-content-planner"\|"list-field-ops"\|"tag-ops"\|"tag-alert"\|"list-design-system"' src/ | grep -v '.test.' | grep -v 'marcomIds.ts'
```

Expected: **Zero results** (only `marcomIds.ts` definitions and test fixtures should remain).

- [x] **Step 2: Run full test suite**

Run: `npm test`
Expected: All 553+ tests PASS, 0 failures.

- [x] **Step 3: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore: verify zero hardcoded marcom IDs remain in production code"
```
