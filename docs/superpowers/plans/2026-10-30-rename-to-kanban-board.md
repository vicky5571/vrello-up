# Rename Work Item Board and Board to Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all user-facing names and labels for the visual work item board from "Work Items Board" / "Board" / "Kanban View" to "Kanban Board" across navigation, headers, command palette, menus, help guides, and URL aliases.

**Architecture:** Update UI presentation strings and constants across layout and modal components without breaking internal identifiers (`ViewMode: "board"`, `projectsBoardOrder`). Add URL parameter normalization in `parseUrlNavState` to support `?view=kanban` and `?view=kanban-board` deep links.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand 5, Node test runner (`node:test`).

**Spec:** `docs/superpowers/specs/2026-10-30-rename-to-kanban-board-design.md`

## Global Constraints

- Coordinator files must remain strictly $\le 250$ LOC (`ProjectsBoardView.tsx`, `Sidebar.tsx`, `TopNavBreadcrumbs.tsx`).
- Single Source of Truth: `ViewMode` union in `src/types/index.ts` remains canonical.
- URL and Store Invariant: Internal key remains `"board"`; incoming aliases `"kanban"` and `"kanban-board"` map to `"board"`.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`) must pass with 0 errors.

---

### Task 1: URL Router Aliases & Tests (`urlState.ts` & `urlState.test.ts`)

**Files:**
- Modify: `src/lib/router/urlState.ts:76-100`
- Modify: `src/lib/router/urlState.test.ts:44-55`

**Interfaces:**
- Consumes:
  - `parseUrlNavState` from `@/lib/router/urlState`
- Produces:
  - `parseUrlNavState("?view=kanban")` $\rightarrow$ `{ view: "board" }`
  - `parseUrlNavState("?view=kanban-board")` $\rightarrow$ `{ view: "board" }`
  - `parseUrlNavState("?v=kanban")` $\rightarrow$ `{ view: "board" }`

- [ ] **Step 1: Write failing test for kanban view aliases**

In `src/lib/router/urlState.test.ts`, add the following test case:

```typescript
test("parseUrlNavState normalizes 'kanban' and 'kanban-board' aliases to 'board'", () => {
  assert.equal(parseUrlNavState("?view=kanban").view, "board");
  assert.equal(parseUrlNavState("?view=kanban-board").view, "board");
  assert.equal(parseUrlNavState("?v=kanban").view, "board");
  assert.equal(parseUrlNavState("?v=kanban-board").view, "board");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --import ./test/register-alias.mjs src/lib/router/urlState.test.ts`  
Expected: FAIL with assertion error (`undefined !== "board"`).

- [ ] **Step 3: Implement alias normalization in `urlState.ts`**

In `src/lib/router/urlState.ts`, update the view validation block inside `parseUrlNavState`:

```typescript
    if (trimmedView === "content") {
      state.view = "content-planner";
    } else if (trimmedView === "table") {
      state.view = "list";
    } else if (trimmedView === "kanban" || trimmedView === "kanban-board") {
      state.view = "board";
    } else if (trimmedView === "mou") {
      state.view = "mous";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --import ./test/register-alias.mjs src/lib/router/urlState.test.ts`  
Expected: PASS (all tests passing).

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/router/urlState.ts src/lib/router/urlState.test.ts
git commit -m "feat(router): normalize kanban and kanban-board url aliases to board"
```

---

### Task 2: Projects Board View Header & Navigation Config

**Files:**
- Modify: `src/components/views/ProjectsView/ProjectsBoardView.tsx:88-98`
- Modify: `src/components/layout/navConfig.ts:26-30`
- Modify: `src/components/layout/topNavConstants.ts:1-15`
- Modify: `src/components/layout/TopNavBreadcrumbs.tsx:50-66`

**Interfaces:**
- Consumes:
  - `PROJECTS_NAV_ITEMS` from `@/components/layout/navConfig`
  - `PROJECTS_VIEW_LABELS` from `@/components/layout/topNavConstants`
- Produces:
  - Projects Board view heading renders `Kanban Board`
  - Sidebar renders navigation item label `Kanban Board`
  - Top breadcrumbs render `Projects / Kanban Board`

- [ ] **Step 1: Update heading in `ProjectsBoardView.tsx`**

In `src/components/views/ProjectsView/ProjectsBoardView.tsx`, replace line 93:

```tsx
        <div className="flex items-center gap-2">
          <Kanban className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Kanban Board
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
            {allWorkItems.length}
          </span>
        </div>
```

- [ ] **Step 2: Update navigation label in `navConfig.ts`**

In `src/components/layout/navConfig.ts`, update `PROJECTS_NAV_ITEMS`:

```typescript
export const PROJECTS_NAV_ITEMS: NavItem[] = [
  { id: "board", label: "Kanban Board", icon: Kanban, iconColor: "text-blue-500" },
  { id: "list", label: "List", icon: List, iconColor: "text-slate-500" },
  { id: "calendar", label: "Calendar", icon: Calendar, iconColor: "text-emerald-500" },
];
```

- [ ] **Step 3: Add `PROJECTS_VIEW_LABELS` in `topNavConstants.ts`**

In `src/components/layout/topNavConstants.ts`, export `PROJECTS_VIEW_LABELS`:

```typescript
export const PROJECTS_VIEW_LABELS: Record<string, string> = {
  board: "Kanban Board",
  list: "List",
  calendar: "Calendar",
};

export const MARCOM_VIEW_LABELS: Record<string, string> = {
  pipeline: "Pipeline 360°",
  "content-planner": "Content Planner",
  events: "Field Events",
  content: "Content Planner",
  placements: "Placements",
  mous: "MOUs",
  branches: "Branches",
  outlets: "Outlets",
  documents: "Documents",
  reports: "Reports",
  analytics: "Analytics",
};
```

- [ ] **Step 4: Update breadcrumb trail in `TopNavBreadcrumbs.tsx`**

In `src/components/layout/TopNavBreadcrumbs.tsx`, import `PROJECTS_VIEW_LABELS` and update `renderProjectsTrail`:

```tsx
import { MARCOM_VIEW_LABELS, PROJECTS_VIEW_LABELS } from "./topNavConstants";
```

And in `renderProjectsTrail`:

```tsx
      <span className="text-slate-400 shrink-0">/</span>

      <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0 capitalize truncate">
        {PROJECTS_VIEW_LABELS[activeView] || activeView}
      </span>
```

- [ ] **Step 5: Verify build and LOC limits**

Run: `wc -l src/components/views/ProjectsView/ProjectsBoardView.tsx src/components/layout/Sidebar.tsx src/components/layout/TopNavBreadcrumbs.tsx`  
Expected: All files $\le 250$ LOC.  
Run: `npm run build:check`  
Expected: 0 TypeScript errors.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/components/views/ProjectsView/ProjectsBoardView.tsx src/components/layout/navConfig.ts src/components/layout/topNavConstants.ts src/components/layout/TopNavBreadcrumbs.tsx
git commit -m "feat(projects): update board header, nav label, and breadcrumbs to Kanban Board"
```

---

### Task 3: Command Palette, Menus, Modals & Marketing Copy

**Files:**
- Modify: `src/components/layout/CommandPalette.tsx:332-337`
- Modify: `src/components/modals/MoreAppsMenu.tsx:148-156`
- Modify: `src/components/modals/HelpDocsModal.tsx:24-34`
- Modify: `src/components/layout/ExportCenter.tsx:210-216`
- Modify: `src/components/auth/AuthBrandPanel.tsx:23-28`
- Modify: `src/components/views/ContentPlannerView/ContentDrawer.tsx:270-276`

**Interfaces:**
- Consumes:
  - Command palette view switchers, modal buttons, and help documentation
- Produces:
  - Consistent "Kanban Board" naming throughout menus, dialogs, and tooltips

- [ ] **Step 1: Update view name in `CommandPalette.tsx`**

In `src/components/layout/CommandPalette.tsx`, line 335:

```typescript
    const viewsList: { id: ViewMode; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { id: "home", name: "Home Dashboard", icon: HomeIcon },
      { id: "list", name: "List View", icon: ListIcon },
      { id: "board", name: "Kanban Board", icon: Kanban },
      { id: "calendar", name: "Calendar View", icon: Calendar },
```

- [ ] **Step 2: Update Quick Views button in `MoreAppsMenu.tsx`**

In `src/components/modals/MoreAppsMenu.tsx`, line 154:

```tsx
                <button
                  type="button"
                  onClick={() => handleLaunchView("board")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <Kanban className="w-3.5 h-3.5 text-orange-500" />
                  <span>Kanban Board</span>
                </button>
```

- [ ] **Step 3: Update shortcut description in `HelpDocsModal.tsx`**

In `src/components/modals/HelpDocsModal.tsx`, line 28:

```typescript
const SHORTCUTS = [
  { key: "⌘ / Ctrl + K", label: "Open Command Palette & Global Search" },
  { key: "N / C", label: "Create New Task" },
  { key: "Space", label: "Toggle Task Slide-Over Drawer" },
  { key: "1 - 3", label: "Quick Switch Views (List, Kanban Board, Calendar)" },
```

- [ ] **Step 4: Update export tooltip and copy in `ExportCenter.tsx`**

In `src/components/layout/ExportCenter.tsx`, lines 212-213:

```tsx
                      hasSelection
                        ? "Exports the current Kanban Board / List batch selection."
                        : "Select tasks on the Kanban Board or List view first to enable this export."
```

- [ ] **Step 5: Update marketing copy in `AuthBrandPanel.tsx` and `ContentDrawer.tsx`**

In `src/components/auth/AuthBrandPanel.tsx`, line 25:

```typescript
    description: "Kanban board, list, calendar",
```

In `src/components/views/ContentPlannerView/ContentDrawer.tsx`, line 274:

```tsx
                    <span className="hidden sm:inline text-[11px]">Kanban Board</span>
```

- [ ] **Step 6: Verify build check**

Run: `npm run build:check`  
Expected: 0 TypeScript errors.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/components/layout/CommandPalette.tsx src/components/modals/MoreAppsMenu.tsx src/components/modals/HelpDocsModal.tsx src/components/layout/ExportCenter.tsx src/components/auth/AuthBrandPanel.tsx src/components/views/ContentPlannerView/ContentDrawer.tsx
git commit -m "style(ui): standardize Kanban Board name across command palette, modals, and copy"
```

---

### Task 4: Verification Gates & Handoff

**Files:**
- Modify: `docs/SESSION_STATE.md`

- [ ] **Step 1: Run drift check**

Run: `npm run drift:check`  
Expected: `✅ No drift detected. All invariants pass.` (all specs paired, coordinator LOC $\le 250$).

- [ ] **Step 2: Run build check**

Run: `npm run build:check`  
Expected: 0 TypeScript errors.

- [ ] **Step 3: Run full test suite**

Run: `npm test`  
Expected: All tests pass, 0 failures.

- [ ] **Step 4: Update `docs/SESSION_STATE.md`**

Record the completion of the Kanban Board naming standardization and passing verification gates.

- [ ] **Step 5: Commit Task 4**

```bash
git add docs/SESSION_STATE.md
git commit -m "docs(projects): update session state for kanban board naming standardization"
```
