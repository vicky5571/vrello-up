# User Management Global View Layout Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Global View Layout Isolation to User Management (`users`), cleanly suppressing the operational `Sidebar` while retaining `GlobalRail`, providing direct root breadcrumbs `Vrello / Manajemen Pengguna` with return navigation, and allowing `UsersView` to expand to full widescreen viewport width.

**Architecture:** Update `shouldRenderSidebar` in `layoutHierarchyHelpers.ts` to check `GLOBAL_ACCOUNT_VIEWS.has(activeView)` so both `"profile"` and `"users"` suppress the module `Sidebar`. Update unit tests in `layoutHierarchyHelpers.test.ts`. Verify coordinator limits remain $\le 250$ LOC and run all verification gates.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand 5, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-user-management-global-layout-design.md`  
**ADR:** `docs/adr/0010-user-management-global-view-layout-isolation.md`

---

## File Manifest

| Phase | Target File | Purpose | LOC Delta (est.) |
|---|---|---|---|
| Phase 1 | `src/components/layout/layoutHierarchyHelpers.test.ts` | Update unit tests to assert `shouldRenderSidebar("users") === false` | +10 LOC |
| Phase 1 | `src/components/layout/layoutHierarchyHelpers.ts` | Refactor `shouldRenderSidebar` to use `GLOBAL_ACCOUNT_VIEWS` | +5 LOC |
| Phase 2 | Verification & Documentation | Drift check, build check, test suite, READMEs | +15 LOC |

---

## Sequencing Rules

- **Phase 1** updates helper logic and tests first.
- **Phase 2** runs full verification suite and updates session state / change log.

---

### Phase 1: Pure Layout Hierarchy Helpers & Tests

- [x] **Task 1.1: Update Unit Tests for User Management Sidebar Suppression**
  - Edit: `src/components/layout/layoutHierarchyHelpers.test.ts`
  - Add assertion: `assert.equal(shouldRenderSidebar("users"), false)`
  - Run: `node --test src/components/layout/layoutHierarchyHelpers.test.ts` (verify failing test).

- [x] **Task 1.2: Refactor `shouldRenderSidebar` Implementation**
  - Edit: `src/components/layout/layoutHierarchyHelpers.ts`
  - Update:
    ```typescript
    export function shouldRenderSidebar(activeView: ViewMode | string): boolean {
      if (GLOBAL_ACCOUNT_VIEWS.has(activeView as ViewMode)) {
        return false;
      }
      return true;
    }
    ```
  - Run: `node --test src/components/layout/layoutHierarchyHelpers.test.ts` (verify all tests pass).

---

### Phase 2: Verification & Documentation

- [x] **Task 2.1: Execute Verification Suite**
  - Run: `npm run drift:check` (Confirm 0 drift, 42 paired specs/plans).
  - Run: `npm run build:check` (Confirm 0 TypeScript compiler errors).
  - Run: `npm run test:smoke` (Confirm all smoke tests pass).
  - Run: `npm test` (Confirm all test suites pass with 0 failures).

- [x] **Task 2.2: Update Documentation & Session State**
  - Update: `docs/superpowers/specs/README.md` (Add entry for `user-management-global-layout`).
  - Update: `docs/superpowers/plans/README.md` (Add entry for `user-management-global-layout`).
  - Update: `docs/SESSION_STATE.md`.
  - Update: `CHANGELOG.md`.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| User trapped on User Management screen | `GlobalRail` (52px) remains active with Home, Calendar, AI, and Users buttons. `TopNavBreadcrumbs` provides "Kembali ke Workspace" shortcut button. |
| Inadvertent sidebar suppression on operational views | Unit test suite explicitly asserts `shouldRenderSidebar` returns `true` for all board, list, calendar, and marcom views. |
| Coordinator LOC limits exceeded | Change modifies only `layoutHierarchyHelpers.ts` (+5 LOC) without bloating `Sidebar.tsx` or `TopNav.tsx`. |

