# Pilih Outlet Phase 1: UI & Layout Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the duplicate selected outlet preview card, fix the empty bracket `[]` rendering bug on store codes, and consolidate draft outlet status indicators into `OutletSearchCombobox`.

**Architecture:** Remove the redundant profile card in `Step1Outlet.tsx` so that `OutletSearchCombobox` becomes the single source of truth for selected store rendering. Update `OutletSearchCombobox.tsx` to conditionally render code badges only when non-empty, and incorporate the draft approval notice and amber alert box cleanly inside the combobox's selected card.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Node test runner (`node:test`).

**Spec:** [`docs/audit-add-placement-outlet-selection.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-add-placement-outlet-selection.md)

## Global Constraints

- Single Source of Truth: Core domain entities (`Outlet`, `MarcomPlacement`, `Brand`) MUST be imported from `@/types`.
- Non-Destructive Refactoring: Do NOT delete keyboard navigation, Leaflet coordinate synchronization, or recent placement history pills in `OutletSearchCombobox`.
- Visual Consistency: Preserve Tailwind v4 styling tokens, dark mode compatibility, and mobile tap targets.
- Verification Discipline: Every task must have an accompanying automated unit test run with `npm test -- <test-file>` resulting in 0 failures.

---

## File Structure

```text
src/components/views/PlacementsView/
├── OutletSearchCombobox.tsx                   # Modified: conditional code badge, integrated draft warning badge
├── OutletSearchCombobox.test.ts               # Modified/Extended: unit tests for code rendering and draft badge logic
├── outletSearchComboboxHelpers.ts             # Modified: helper to check if outlet is draft status
└── wizard/
    └── Step1Outlet.tsx                        # Modified: remove duplicate lines 98–165
```

---

### Task 1: Guard Store Code Rendering & Draft Outlet Metadata Helpers

**Files:**
- Modify: `src/components/views/PlacementsView/outletSearchComboboxHelpers.ts`
- Test: `src/components/views/PlacementsView/OutletSearchCombobox.test.ts`

**Interfaces:**
- Produces:
  - `isDraftOutletRecord(outlet?: { code?: string | null; status?: string | null } | null): boolean`
  - `formatOutletCodeDisplay(code?: string | null): string | null`

- [ ] **Step 1: Write the failing test**

```typescript
// Add to src/components/views/PlacementsView/OutletSearchCombobox.test.ts
import { isDraftOutletRecord, formatOutletCodeDisplay } from "./outletSearchComboboxHelpers.ts";

test("formatOutletCodeDisplay returns formatted code when present and null when empty or missing", () => {
  assert.equal(formatOutletCodeDisplay("O-SMG-001"), "[O-SMG-001]");
  assert.equal(formatOutletCodeDisplay(""), null);
  assert.equal(formatOutletCodeDisplay("   "), null);
  assert.equal(formatOutletCodeDisplay(null), null);
  assert.equal(formatOutletCodeDisplay(undefined), null);
});

test("isDraftOutletRecord accurately identifies draft outlets", () => {
  assert.equal(isDraftOutletRecord({ code: "DRAFT-123", status: "DRAFT" }), true);
  assert.equal(isDraftOutletRecord({ code: "O-SMG-001", status: "DRAFT" }), true);
  assert.equal(isDraftOutletRecord({ code: "DRAFT-123", status: "APPROVED" }), true);
  assert.equal(isDraftOutletRecord({ code: "O-SMG-001", status: "APPROVED" }), false);
  assert.equal(isDraftOutletRecord(null), false);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- src/components/views/PlacementsView/OutletSearchCombobox.test.ts
```

- [ ] **Step 3: Implement minimal helper code**

In `src/components/views/PlacementsView/outletSearchComboboxHelpers.ts`:
```typescript
export function formatOutletCodeDisplay(code?: string | null): string | null {
  if (!code || typeof code !== "string" || code.trim() === "") {
    return null;
  }
  return `[${code.trim()}]`;
}

export function isDraftOutletRecord(outlet?: { code?: string | null; status?: string | null } | null): boolean {
  if (!outlet) return false;
  const code = outlet.code || "";
  const status = outlet.status || "";
  return code.startsWith("DRAFT-") || status === "DRAFT" || status === "PENDING_APPROVAL";
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- src/components/views/PlacementsView/OutletSearchCombobox.test.ts
```

---

### Task 2: Update `OutletSearchCombobox.tsx` to Render Clean Badges and Draft Banners

**Files:**
- Modify: `src/components/views/PlacementsView/OutletSearchCombobox.tsx:339-354`

**Interfaces:**
- Consumes:
  - `formatOutletCodeDisplay` from `./outletSearchComboboxHelpers`
  - `isDraftOutletRecord` from `./outletSearchComboboxHelpers`

- [ ] **Step 1: Update code badge rendering to eliminate empty `[]`**

Replace the unconditional `[{currentOutlet.code}]` at lines 343-345 with:
```tsx
{(() => {
  const formattedCode = formatOutletCodeDisplay(currentOutlet.code);
  return formattedCode ? (
    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
      {formattedCode}
    </span>
  ) : null;
})()}
```

- [ ] **Step 2: Add Draft Status Notice inside `OutletSearchCombobox` selection card**

In the top header area of the selection card in `OutletSearchCombobox.tsx`, add the draft badge and explanatory banner:
```tsx
{isDraftOutletRecord(currentOutlet) && (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
    ⏳ Menunggu ACC Atasan
  </span>
)}
```
And beneath the store details before the GPS status divider:
```tsx
{isDraftOutletRecord(currentOutlet) && (
  <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
    Outlet ini berstatus draf pengajuan baru. Data akan otomatis terhubung ke kode resmi setelah di-ACC oleh Atasan.
  </div>
)}
```

- [ ] **Step 3: Verify existing tests pass**

```bash
npm test -- src/components/views/PlacementsView/OutletSearchCombobox.test.ts
```

---

### Task 3: Deduplicate UI by Removing Redundant Card in `Step1Outlet.tsx`

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/Step1Outlet.tsx:98-165`

- [ ] **Step 1: Remove lines 98–165 in `Step1Outlet.tsx`**

Delete the entire `{/* Selected Outlet Quick Profile Card */}` block (lines 98 to 165) that renders the second `<div className="p-3 rounded-xl bg-slate-50 ...">` card.

- [ ] **Step 2: Clean up unused imports in `Step1Outlet.tsx`**

Remove unused icons (`Store`, `User`, `X`) from `lucide-react` import at line 4 if they are no longer referenced in `Step1Outlet.tsx`.

- [ ] **Step 3: Run full placement test suite to verify no regressions**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
npm test -- src/components/views/PlacementsView/OutletSearchCombobox.test.ts
```
