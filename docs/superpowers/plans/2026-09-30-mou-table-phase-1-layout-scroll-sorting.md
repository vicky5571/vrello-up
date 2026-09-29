# MOU Table Phase 1: Layout, Scroll & Sorting Plumbing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish fixed viewport height containment, lock sticky column headers, and fix TanStack Table sorting contracts on the MOU table.

**Architecture:** Pass `fixedViewport={true}` from `MousView` to `MarcomTableShell` to activate the flex-column container (`h-full flex flex-col min-h-0`) and `sticky top-0 z-20` headers. Convert the `partner` column from an untracked `display` column to a sortable accessor column (`accessorKey: "partnerName"`). Extract a pure helper module `mouSortingHelpers.ts` for lifecycle status ordering (`DRAFT` → `SUBMITTED` → `APPROVED` → `DONE` → `REJECTED`).

**Tech Stack:** Next.js 15, React 19, TypeScript 5, TanStack Table v9, Tailwind CSS v4, Node test runner (`node:test`).

**Spec:** [`docs/audit-mous-table-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-mous-table-ui-ux.md)

## Global Constraints

- Tech Stack: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Zustand 5, Node test runner (`node --test`).
- Single Source of Truth: Core domain entities (`MarcomMou`, `MouStatus`, `Branch`, `Outlet`) MUST be imported from `@/types`.
- Strangler Pattern on God Files: Extract sorting logic into dedicated pure module `mouSortingHelpers.ts`. Never dump helper functions directly into coordinator or view files.
- Dual-Persistence & Isolation: Preserve workspace isolation and offline fallback.
- Testing: All business logic must be accompanied by unit tests executed via `npm test -- <test-file>`.

---

## File Structure

```text
src/components/views/MousView/
├── mouSortingHelpers.ts       # Pure helper for MOU status sorting & comparator utilities
├── mouSortingHelpers.test.ts  # Node tests for lifecycle status sorting & accessor extractors
├── mouColumns.tsx             # Modified: accessor-based partner & status sorting
└── MousView.tsx               # Modified: fixedViewport={true}, explicit searchKeys
```

---

### Task 1: MOU Lifecycle Sorting & Comparator Utilities

**Files:**
- Create: `src/components/views/MousView/mouSortingHelpers.ts`
- Test: `src/components/views/MousView/mouSortingHelpers.test.ts`

**Interfaces:**
- Produces:
  - `MOU_STATUS_ORDER: Record<MouStatus, number>`
  - `compareMouStatus(statusA: MouStatus, statusB: MouStatus): number`
  - `getSearchableMouFields(mou: MarcomMou): string[]`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/views/MousView/mouSortingHelpers.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { compareMouStatus, MOU_STATUS_ORDER } from "./mouSortingHelpers.ts";
import type { MouStatus } from "@/types";

test("MOU_STATUS_ORDER prioritizes workflow lifecycle", () => {
  assert.equal(MOU_STATUS_ORDER["DRAFT"], 1);
  assert.equal(MOU_STATUS_ORDER["SUBMITTED"], 2);
  assert.equal(MOU_STATUS_ORDER["APPROVED"], 3);
  assert.equal(MOU_STATUS_ORDER["DONE"], 4);
  assert.equal(MOU_STATUS_ORDER["REJECTED"], 5);
});

test("compareMouStatus sorts statuses by operational lifecycle, not alphabetically", () => {
  const statuses: MouStatus[] = ["REJECTED", "APPROVED", "DRAFT", "DONE", "SUBMITTED"];
  statuses.sort(compareMouStatus);
  assert.deepEqual(statuses, ["DRAFT", "SUBMITTED", "APPROVED", "DONE", "REJECTED"]);
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/MousView/mouSortingHelpers.test.ts
```

- [ ] **Step 3: Implement minimal code to pass the test**

```typescript
// src/components/views/MousView/mouSortingHelpers.ts
import type { MouStatus, MarcomMou } from "@/types";

export const MOU_STATUS_ORDER: Record<MouStatus, number> = {
  DRAFT: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  DONE: 4,
  REJECTED: 5,
};

export function compareMouStatus(statusA: MouStatus, statusB: MouStatus): number {
  const orderA = MOU_STATUS_ORDER[statusA] ?? 99;
  const orderB = MOU_STATUS_ORDER[statusB] ?? 99;
  return orderA - orderB;
}

export const MOU_SEARCH_KEYS: (keyof MarcomMou)[] = [
  "partnerName",
  "outletName",
  "mouType",
  "picName",
  "picPhone",
  "notes",
];
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/components/views/MousView/mouSortingHelpers.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/views/MousView/mouSortingHelpers.ts src/components/views/MousView/mouSortingHelpers.test.ts
git commit -m "feat(mou): add mouSortingHelpers for lifecycle status ordering"
```

---

### Task 2: Fix TanStack Column Accessors & Sorting in `mouColumns.tsx`

**Files:**
- Modify: `src/components/views/MousView/mouColumns.tsx`

**Interfaces:**
- Consumes: `compareMouStatus` from `./mouSortingHelpers`
- Produces: Sortable `partner` and lifecycle-sorted `status` columns.

- [ ] **Step 1: Convert `partner` to accessor column and bind `compareMouStatus` to `status`**

In `src/components/views/MousView/mouColumns.tsx`:
1. Change `columnHelper.display({ id: "partner", ... })` to:
   ```tsx
   columnHelper.accessor("partnerName", {
     id: "partner",
     header: "Partner",
     size: 190,
     minSize: 130,
     cell: ({ row }) => (
       <button
         type="button"
         onClick={(e) => {
           e.stopPropagation();
           setMarcomFilter("mous", row.original.partnerName);
         }}
         className="truncate font-semibold text-slate-900 dark:text-slate-100 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:underline cursor-pointer text-left"
         title={`Filter MOUs by partner "${row.original.partnerName}"`}
       >
         {row.original.partnerName}
       </button>
     ),
   })
   ```
2. In the `status` column accessor, provide `sortingFn`:
   ```tsx
   columnHelper.accessor("status", {
     id: "status",
     header: "Status",
     size: 140,
     minSize: 110,
     sortingFn: (rowA, rowB) => compareMouStatus(rowA.original.status, rowB.original.status),
     cell: ({ row }) => { ... },
   })
   ```
3. Update `compensationValue` header to right-align numeric contents.

- [ ] **Step 2: Run typecheck & existing tests**

Run:
```bash
npm run typecheck
npm test -- src/components/views/MousView/
```

- [ ] **Step 3: Commit**

```bash
git add src/components/views/MousView/mouColumns.tsx
git commit -m "feat(mou): fix TanStack partner sorting and lifecycle status sorting in mouColumns"
```

---

### Task 3: Enable `fixedViewport` & Search Keys in `MousView.tsx`

**Files:**
- Modify: `src/components/views/MousView/MousView.tsx`

**Interfaces:**
- Consumes: `fixedViewport` on `MarcomTableShell`, `MOU_SEARCH_KEYS` from `./mouSortingHelpers`

- [ ] **Step 1: Pass `fixedViewport` and `searchKeys` to `MarcomTableShell`**

In `src/components/views/MousView/MousView.tsx:170`:
```tsx
      <MarcomTableShell
        fixedViewport
        searchKeys={MOU_SEARCH_KEYS}
        data={filteredMous}
        columns={columns}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "partner", desc: false }]}
        title="MOUs & Partnerships"
        titleIcon={FileText}
        countLabel={{ singular: "MOU", plural: "MOUs" }}
        entityName="MOU"
        entityPlural="MOUs"
        isLoading={isLoading}
        error={error}
        onRefresh={() => loadMous(true)}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin role"
        onDeleteOne={deleteOne}
        onDeleteBatch={deleteBatch}
        canAdd={canCreate}
        ...
```

- [ ] **Step 2: Verify viewport height and sticky header behavior**

Verify:
- `MarcomTableShell` renders with `h-full flex flex-col min-h-0`.
- The table header has `sticky top-0 z-20 shadow-2xs`.
- The pagination bar remains visible at the bottom of the viewport.

- [ ] **Step 3: Run complete test suite and typecheck**

Run:
```bash
npm run typecheck
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/components/views/MousView/MousView.tsx
git commit -m "feat(mou): activate fixedViewport and searchKeys on MousView"
```
