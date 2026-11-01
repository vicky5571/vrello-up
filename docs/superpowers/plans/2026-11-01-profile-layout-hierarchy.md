# Global View Layout Isolation & Profile Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cleanly isolate layout rules for Global Account Views (`profile`), suppressing the contextual `Sidebar` on `profile` while retaining `GlobalRail`, establishing a direct root breadcrumb `Vrello / Profil & Keamanan Akun` with return navigation, suppressing `ProjectsFilterBar`, and preserving work item state in `createUiSlice.ts`.

**Architecture:** Create a pure helper module `layoutHierarchyHelpers.ts` defining classification functions for work items and global views. Update `Sidebar.tsx` to conditionally unmount when `activeView === "profile"`. Update `TopNavBreadcrumbs.tsx` to render a direct root breadcrumb with a "Kembali ke Workspace" shortcut. Restrict `ProjectsFilterBar` in `TopNav.tsx` to work items only. Guard `lastTaskView` in `createUiSlice.ts`. Maintain all coordinators $\le 250$ LOC.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand 5, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`  
**ADR:** `docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`

---

## File Manifest

| Phase | Target File | Purpose | LOC Delta (est.) |
|---|---|---|---|
| Phase 1 | `src/components/layout/layoutHierarchyHelpers.ts` | Pure helpers for view categorization & breadcrumbs | +50 LOC |
| Phase 1 | `src/components/layout/layoutHierarchyHelpers.test.ts` | Unit test suite for layout hierarchy helpers | +60 LOC |
| Phase 2 | `src/lib/store/slices/createUiSlice.ts` | Guard `lastTaskView` when navigating to `profile` | +10 LOC |
| Phase 3 | `src/components/layout/Sidebar.tsx` | Conditionally unmount Sidebar on `profile` | +6 LOC |
| Phase 3 | `src/components/layout/TopNav.tsx` | Suppress `ProjectsFilterBar` outside work items | +4 LOC |
| Phase 3 | `src/components/layout/TopNavBreadcrumbs.tsx` | Render root breadcrumb & "Kembali ke Workspace" | +25 LOC |
| Phase 4 | Verification & Documentation | Drift check, build check, test suite, READMEs | +15 LOC |

---

## Sequencing Rules

- **Phase 1** must be implemented and tested before modifying UI components in Phase 2 & 3.
- **Phase 2 & 3** must preserve coordinator limits ($\le 250$ LOC for `Sidebar.tsx`, `TopNav.tsx`, and `TopNavBreadcrumbs.tsx`).
- **Phase 4** verification gates must pass with 0 errors before completion.

---

### Phase 1: Pure Layout Hierarchy Helpers & Unit Tests

- [x] **Task 1.1: Write Unit Test Suite for Layout Hierarchy Helpers**
  - Create: `src/components/layout/layoutHierarchyHelpers.test.ts`
  - Test cases:
    - `shouldRenderSidebar`: returns `false` for `"profile"`, returns `true` for `"board"`, `"list"`, `"calendar"`, `"events"`, `"placements"`, etc.
    - `shouldRenderProjectsFilterBar`: returns `true` ONLY when `appMode === "tasks"` AND `activeView` is in `["board", "list", "calendar"]`. Returns `false` for `"profile"`, `"users"`, or any marcom view.
    - `getGlobalBreadcrumbInfo`: returns proper label and icon for `"profile"` ("Profil & Keamanan Akun") and `"users"`, returns `null` for operational views.
  - Run: `node --test src/components/layout/layoutHierarchyHelpers.test.ts`.

- [x] **Task 1.2: Implement `layoutHierarchyHelpers.ts`**
  - Create: `src/components/layout/layoutHierarchyHelpers.ts`
  - Implement and export:
    - `WORK_ITEM_VIEWS` and `GLOBAL_ACCOUNT_VIEWS` sets.
    - `shouldRenderSidebar(activeView: ViewMode | string): boolean`.
    - `shouldRenderProjectsFilterBar(appMode: string, activeView: ViewMode | string): boolean`.
    - `getGlobalBreadcrumbInfo(activeView: ViewMode | string)`.
  - Re-run unit tests: `node --test src/components/layout/layoutHierarchyHelpers.test.ts`.

---

### Phase 2: State Preservation in UI Slice

- [x] **Task 2.1: Update `createUiSlice.ts`**
  - Edit: `src/lib/store/slices/createUiSlice.ts`
  - In `setActiveView(view)`:
    - If `canonicalView === "profile"` or is in `GLOBAL_ACCOUNT_VIEWS`, do not overwrite `lastTaskView` or `lastMarcomView`.
    - Preserve the prior active work item tab so returning from Profile restores the user's exact workspace context.

---

### Phase 3: Layout Components Refactoring

- [x] **Task 3.1: Update `Sidebar.tsx`**
  - Edit: `src/components/layout/Sidebar.tsx`
  - Import `shouldRenderSidebar` from `./layoutHierarchyHelpers`.
  - If `!shouldRenderSidebar(activeView)`, return `null` immediately.
  - Verify `Sidebar.tsx` LOC remains $\le 250$ LOC.

- [x] **Task 3.2: Update `TopNav.tsx`**
  - Edit: `src/components/layout/TopNav.tsx`
  - Import `shouldRenderProjectsFilterBar` from `./layoutHierarchyHelpers`.
  - Replace `{appMode === "tasks" && <ProjectsFilterBar />}` with:
    `{shouldRenderProjectsFilterBar(appMode, activeView) && <ProjectsFilterBar />}`.
  - Verify `TopNav.tsx` LOC remains $\le 250$ LOC.

- [x] **Task 3.3: Update `TopNavBreadcrumbs.tsx`**
  - Edit: `src/components/layout/TopNavBreadcrumbs.tsx`
  - Import `getGlobalBreadcrumbInfo` from `./layoutHierarchyHelpers`.
  - If `activeView === "profile"`:
    - Render root brand anchor (`Vrello`), followed by `/`, followed by:
      `<User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />`
      `<span className="font-medium text-slate-800 dark:text-slate-200">Profil & Keamanan Akun</span>`
    - Render a "Kembali ke Workspace" shortcut button (ArrowLeft icon) that invokes `setActiveView(lastTaskView || "list")` and gives feedback.
  - Verify `TopNavBreadcrumbs.tsx` LOC remains $\le 250$ LOC.

---

### Phase 4: Verification & Documentation

- [x] **Task 4.1: Execute Verification Suite**
  - Run: `npm run drift:check` (Confirm 0 drift, 41 paired specs/plans).
  - Run: `npm run build:check` (Confirm 0 TypeScript compiler errors).
  - Run: `npm run test:smoke` (Confirm all smoke tests pass).
  - Run: `npm test` (Confirm all test suites pass with 0 failures).

- [x] **Task 4.2: Update Documentation & Session State**
  - Update: `docs/superpowers/specs/README.md` (Add entry for `profile-layout-hierarchy`).
  - Update: `docs/superpowers/plans/README.md` (Add entry for `profile-layout-hierarchy`).
  - Update: `docs/SESSION_STATE.md`.
  - Update: `CHANGELOG.md`.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Layout shift when Sidebar unmounts | Main stage already uses `flex-1` with smooth responsive boundary. GlobalRail (52px) remains static, preventing jarring left-margin shifts. |
| User trapped without a way back | GlobalRail icons (Home, Calendar, AI, Users) stay active; TopNavBreadcrumbs provides an explicit "Kembali ke Workspace" shortcut button. |
| Coordinator LOC explosion | Logic extracted into `layoutHierarchyHelpers.ts` keeping `Sidebar.tsx`, `TopNav.tsx`, and `TopNavBreadcrumbs.tsx` comfortably under 250 LOC. |

