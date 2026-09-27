# Consolidate 8 Duplicate Type Definitions into SSoT Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 8 duplicate, divergent, and unexported type declarations across the codebase by consolidating them into the Single Source of Truth (`src/types/index.ts`), strictly upholding `AGENTS.md` invariants without introducing runtime regressions or breaking backwards compatibility.

**Architecture:**
1. Keep `src/types/index.ts` as the single canonical registry for all domain types.
2. In modules currently declaring duplicate types (`mouMachine.ts`, `placementMachine.ts`, `workspaceAuth.ts`, `placementTaskSync.ts`), import the canonical type from `@/types` and re-export it with `export type { ... }` so existing consumers do not break.
3. In components declaring identical models (`BranchesView.tsx`, `BranchDetailDrawer.tsx`), replace duplicated shapes with types imported directly from `@/types` or extending existing SSoT interfaces (`BranchItem`).
4. In `AutomationsModal.tsx`, rename local static mockup presets (`AutomationRule`) to `PresetAutomationRecipe` to eliminate shadowing against the domain `AutomationRule` (aliased to `CustomAutomationRule` in SSoT per `AGENTS.md`).
5. Derive `UnifiedPlacementStatus` from `PlacementStatus` via `Exclude<PlacementStatus, "ISSUE">` to formalize the semantic relationship.

**Tech Stack:** TypeScript 5, React 19, Next.js 15 App Router, Node test runner (`node --test`).

**Spec:** Identified in Codebase Confusion Audit, Issue #5.

---

## Global Constraints

- **Strict SSoT Invariant**: Every core entity must originate from `src/types/index.ts`. No new inline duplicate interfaces.
- **Zero Breaking Changes**: Re-export canonical types from their old locations so any external or dynamic consumers continue functioning.
- **Zero Runtime Regressions**: Types only; zero logic changes. All existing 546+ tests across 72 suites must pass after every single task.
- **Verification Gate**: `npx tsc --noEmit` and targeted `npm test` after each task.
- **Atomic Commits**: Git commit after each task with clear descriptive English messages.

---

## Implementation Tasks

### Task 1: Consolidate `MouStatus` and `PlacementStatus` to SSoT

**Files:**
- Modify: `src/lib/marcom/mouMachine.ts`
- Modify: `src/lib/marcom/placementMachine.ts`
- Read: `src/types/index.ts`

**Interfaces:**
- Consumes: `MouStatus`, `PlacementStatus` from `@/types`
- Produces: Re-exports `MouStatus` from `mouMachine.ts` and `PlacementStatus` from `placementMachine.ts`

- [x] **Step 1: Update `src/lib/marcom/mouMachine.ts`**
  Replace duplicate definition:
  ```ts
  export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";
  ```
  With:
  ```ts
  import type { MouStatus } from "@/types";
  export type { MouStatus };
  ```

- [x] **Step 2: Update `src/lib/marcom/placementMachine.ts`**
  Replace duplicate definition:
  ```ts
  export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";
  ```
  With:
  ```ts
  import type { PlacementStatus } from "@/types";
  export type { PlacementStatus };
  ```

- [x] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Clean exit code 0.

- [x] **Step 4: Run targeted unit tests**
  Run: `npm test -- src/lib/marcom/mouMachine.test.ts src/lib/marcom/placementMachine.test.ts`
  Expected: All tests pass (0 failures).

- [x] **Step 5: Commit**
  ```bash
  git add src/lib/marcom/mouMachine.ts src/lib/marcom/placementMachine.ts
  git commit -m "refactor(types): consolidate MouStatus and PlacementStatus to SSoT"
  ```

---

### Task 2: Consolidate `BranchStatus` and `MarcomBranch` in `BranchesView.tsx`

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/views/BranchesView/BranchesView.tsx`

**Interfaces:**
- `src/types/index.ts`: Export `export type MarcomBranch = BranchItem;`
- `BranchesView.tsx`: Import `BranchStatus`, `BranchItem`, `MarcomBranch` from `@/types`

- [x] **Step 1: Add `MarcomBranch` alias in `src/types/index.ts`**
  Under `export type Branch = BranchItem;` (line ~489), add:
  ```ts
  export type MarcomBranch = BranchItem;
  ```

- [x] **Step 2: Update `src/components/views/BranchesView/BranchesView.tsx`**
  Remove lines 13-28:
  ```ts
  export type BranchStatus = "DONE" | "ON_PROGRESS" | "PENDING";

  export interface MarcomBranch {
    id: string;
    code: string;
    ...
  }
  ```
  Import from `@/types`:
  ```ts
  import type { BranchStatus, BranchItem, MarcomBranch } from "@/types";
  export type { BranchStatus, MarcomBranch };
  ```

- [x] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Clean exit code 0.

- [x] **Step 4: Commit**
  ```bash
  git add src/types/index.ts src/components/views/BranchesView/BranchesView.tsx
  git commit -m "refactor(types): unify BranchStatus and MarcomBranch with BranchItem in SSoT"
  ```

---

### Task 3: Refactor `BranchDetail` in `BranchDetailDrawer.tsx` to extend `BranchItem`

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/branches/BranchDetailDrawer.tsx`

**Interfaces:**
- In `src/types/index.ts`:
  ```ts
  export interface BranchDetail extends BranchItem {
    outlets?: { id: string; code: string; name: string; type: string; city: string; active: boolean }[];
    mous?: { id: string; partnerName: string; mouType: string; status: string; compensationValue: number }[];
  }
  ```

- [x] **Step 1: Add `BranchDetail` interface to `src/types/index.ts`**
  Directly following `BranchItem` and its aliases:
  ```ts
  export interface BranchDetail extends BranchItem {
    outlets?: { id: string; code: string; name: string; type: string; city: string; active: boolean }[];
    mous?: { id: string; partnerName: string; mouType: string; status: string; compensationValue: number }[];
  }
  ```

- [x] **Step 2: Update `src/components/branches/BranchDetailDrawer.tsx`**
  Remove the manual 15-line `interface BranchDetail` duplicate (lines 20-34).
  Import `BranchDetail` from `@/types`:
  ```ts
  import type { BranchDetail } from "@/types";
  ```

- [x] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Clean exit code 0.

- [x] **Step 4: Commit**
  ```bash
  git add src/types/index.ts src/components/branches/BranchDetailDrawer.tsx
  git commit -m "refactor(types): formalize BranchDetail in SSoT extending BranchItem"
  ```

---

### Task 4: Export Canonical `WorkspaceRole` and Type `User.role` in SSoT

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/server/workspaceAuth.ts`

**Interfaces:**
- In `src/types/index.ts`:
  ```ts
  export type WorkspaceRole = "admin" | "staff" | "viewer";
  ```
  Update `User`:
  ```ts
  export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: WorkspaceRole;
    assignedBranchIds?: string[];
  }
  ```
- In `src/lib/server/workspaceAuth.ts`:
  Import `WorkspaceRole` from `@/types` and re-export it.

- [x] **Step 1: Add `WorkspaceRole` in `src/types/index.ts`**
  Define `export type WorkspaceRole = "admin" | "staff" | "viewer";` above `User` (line ~18), and set `User.role?: WorkspaceRole;`.

- [x] **Step 2: Update `src/lib/server/workspaceAuth.ts`**
  Replace:
  ```ts
  export type WorkspaceRole = "admin" | "staff" | "viewer";
  ```
  With:
  ```ts
  import type { WorkspaceRole } from "@/types";
  export type { WorkspaceRole };
  ```

- [x] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Clean exit code 0.

- [x] **Step 4: Run unit tests**
  Run: `npm test`
  Expected: All tests pass.

- [x] **Step 5: Commit**
  ```bash
  git add src/types/index.ts src/lib/server/workspaceAuth.ts
  git commit -m "refactor(types): export canonical WorkspaceRole from SSoT and type User.role"
  ```

---

### Task 5: Consolidate `AutomationRule` in SSoT and Rename `AutomationsModal.tsx` Preset

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/modals/AutomationsModal.tsx`

**Context:**
`AGENTS.md` explicitly lists `AutomationRule` as a core entity that must be imported from `@/types`. Currently, `CustomAutomationRule` exists in `src/types/index.ts`, while `AutomationsModal.tsx` declares an inline `interface AutomationRule` for static preset UI cards.

- [x] **Step 1: Add `AutomationRule` alias in `src/types/index.ts`**
  Immediately after `CustomAutomationRule` (~line 470):
  ```ts
  export type AutomationRule = CustomAutomationRule;
  ```

- [x] **Step 2: Rename local preset in `src/components/modals/AutomationsModal.tsx`**
  Rename `interface AutomationRule` to `interface PresetAutomationRecipe`:
  ```ts
  interface PresetAutomationRecipe {
    id: string;
    name: string;
    trigger: string;
    action: string;
    live: boolean;
  }
  ```
  Update `INITIAL_RULES: PresetAutomationRecipe[] = ...`.
  Import `AutomationRule` from `@/types` if needed for future rule handling or reference.

- [x] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Clean exit code 0.

- [x] **Step 4: Run automation unit tests**
  Run: `npm test -- src/lib/store/automationOperations.test.ts`
  Expected: All tests pass.

- [x] **Step 5: Commit**
  ```bash
  git add src/types/index.ts src/components/modals/AutomationsModal.tsx
  git commit -m "refactor(types): alias AutomationRule in SSoT and rename modal preset recipe"
  ```

---

### Task 6: Derive `UnifiedPlacementStatus` in SSoT

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/tasks/placementTaskSync.ts`
- Test: `src/lib/tasks/placementTaskSync.test.ts`

**Context:**
`placementTaskSync.ts` declared `export type UnifiedPlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE"`, which omitted `"ISSUE"`. In SSoT, derive this cleanly from `PlacementStatus`:
```ts
export type UnifiedPlacementStatus = Exclude<PlacementStatus, "ISSUE">;
```

- [x] **Step 1: Add `UnifiedPlacementStatus` in `src/types/index.ts`**
  Under `export type PlacementStatus = ...;` (line ~260):
  ```ts
  /**
   * The 3 placement statuses supported by standard Kanban bidirectional task synchronization.
   * "ISSUE" is excluded from standard task category mapping and is handled via manual Marcom inspection.
   */
  export type UnifiedPlacementStatus = Exclude<PlacementStatus, "ISSUE">;
  ```

- [x] **Step 2: Update `src/lib/tasks/placementTaskSync.ts`**
  Import `UnifiedPlacementStatus` from `@/types`:
  ```ts
  import type { Space, Task, UnifiedPlacementStatus } from "@/types";
  export type { UnifiedPlacementStatus };
  ```
  Remove duplicate inline type declaration.

- [x] **Step 3: Run targeted test**
  Run: `npm test -- src/lib/tasks/placementTaskSync.test.ts`
  Expected: All tests pass.

- [x] **Step 4: Verify full test suite and TypeScript compilation**
  Run: `npx tsc --noEmit`
  Run: `npm test`
  Expected: 0 TypeScript errors, 546+ tests passing across all suites.

- [x] **Step 5: Commit**
  ```bash
  git add src/types/index.ts src/lib/tasks/placementTaskSync.ts
  git commit -m "refactor(types): derive UnifiedPlacementStatus from SSoT PlacementStatus"
  ```

---

## Verification Checklist

- [x] `npx tsc --noEmit` passes with 0 errors.
- [x] `npm test` runs with 0 failures across the entire suite (546+ tests).
- [x] `git grep -n "export type MouStatus"` only exists in `src/types/index.ts` (with re-export in `mouMachine.ts`).
- [x] `git grep -n "export type PlacementStatus"` only exists in `src/types/index.ts` (with re-export in `placementMachine.ts`).
- [x] `git grep -n "export type BranchStatus"` only exists in `src/types/index.ts`.
- [x] `git grep -n "export interface MarcomBranch"` replaced with `export type MarcomBranch = BranchItem`.
- [x] `git grep -n "export type WorkspaceRole"` defined in `src/types/index.ts`.
- [x] `git grep -n "export type AutomationRule"` defined in `src/types/index.ts`.
- [x] `git grep -n "export type UnifiedPlacementStatus"` derived in `src/types/index.ts`.
- [x] All 6 commits recorded on branch `vicky`.

---

## Execution Notes (2026-09-27)

All 6 tasks completed on branch `vicky`. Gate evidence: `npx tsc --noEmit` exit 0 after every task; full suite **546 tests / 70 suites / 0 failures / exit 0** at baseline, after Task 4, and after Task 6 — no regression.

Commits: `f69ec96`, `b16f445`, `9e21d55`, `bddf810`, `4bce673`, `8d55f4f`.

### Deviations from the plan as written

1. **Task 2** — the plan's import line included `BranchItem`, which is unused once `MarcomBranch = BranchItem` exists. Omitted to avoid a dead import.
2. **Task 5** — the plan said "Import `AutomationRule` from `@/types` if needed". It is not needed: the local preset is renamed, not replaced. Omitted.
3. **Task 5 Step 4** — the named test file `src/lib/store/automationOperations.test.ts` **does not exist**. Substituted the real automation suites: `automationRules.test.ts` and `customAutomations.test.ts` (12/12 pass).
4. **Task 4** — the `WorkspaceRole` type import was grouped with the existing imports at the top of `workspaceAuth.ts` rather than placed mid-file after a function body.
5. **Verification Checklist** — `git grep "export type BranchStatus"` cannot match the braced re-export form `export type { BranchStatus }`; those checks pass by syntax accident. Verified semantically instead: all 8 canonical declarations confirmed to exist **only** in `src/types/index.ts`, with 6 backwards-compatible braced re-exports at the legacy locations.

### Discrepancies noted

- Plan states "546+ tests across 72 suites" — actual is 70 suites.
- `AGENTS.md` §5 claims the full suite runs in "~4s". Measured: **~136s**. Targeted single-file runs are the only viable inner loop.

### Scope gap discovered (not addressed)

`src/lib/marcom/guards.ts:1` declares `export type MarcomRole = "admin" | "staff" | "viewer"` — byte-identical to the newly canonicalised `WorkspaceRole`. This is a **9th duplicate** that the plan's audit did not enumerate. It is actively consumed by `src/lib/marcom/permissions.ts`, `src/lib/marcom/auth.ts`, and `src/lib/marcom/permissions.test.ts`, so consolidating it would touch 4 files. Deliberately left out of scope — recommend a follow-up plan.

