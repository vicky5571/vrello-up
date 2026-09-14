# Dual-Context Workspace Mode Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Option B (Dual-Context Workspace Mode Switcher) to clearly separate "Projects & Tasks" (ClickUp-style PM) from "Marketing & Operations Hub" (field operations/ERP portal), eliminating workflow confusion in the sidebar, header, and views.

**Architecture:** Add `appMode: "tasks" | "marcom"` to Zustand store with automatic view synchronisation and memory of last visited views. Add prominent mode switcher toggle at the top of `GlobalRail`. Dynamically switch `Sidebar` between the Spaces tree (tasks mode) and a clean Marketing Hub panel (marcom mode). Streamline `TopNav` into a lean single-tier header for Marcom mode, and strip the nested marketing dropdown from `ViewSwitcher`.

**Tech Stack:** Next.js 15.2.0 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide React icons, Zustand 5, Node native test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-14-dual-context-mode-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-14-dual-context-mode-design.md)

## Global Constraints

- Preserve all existing 105 unit tests in `npm test`.
- Do not dump hundreds of lines into `useWorkspaceStore.ts` (follow Strangler Pattern: use helper functions / clean state properties).
- In Marcom sidebar, display two clear groups: WORK ITEMS and MASTER DATA with zero subtitles/micro-labels.
- In Marcom mode, TopNav must be a single lean tier (~44px) without Tier 2, Tier 3, or FilterBar.
- All interactive elements must maintain responsive design and dark mode support.

---

### Task 1: Add `AppMode` Domain Type and Store Slice with Unit Tests

**Files:**
- Modify: `src/types/index.ts:159-176`
- Modify: `src/lib/store/useWorkspaceStore.ts:444-525, 1150-1185`
- Test: `src/lib/store/appMode.test.ts`

**Interfaces:**
- Consumes: `ViewMode` from `@/types`
- Produces: `AppMode` type, `appMode`, `lastTaskView`, `lastMarcomView` state properties, `setAppMode` action, updated `setActiveView` and `navigateToMarcom` in `useWorkspaceStore`.

- [ ] **Step 1: Write the failing unit tests for `appMode`**

Create `src/lib/store/appMode.test.ts`:

```typescript
import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("appMode defaults to tasks or marcom based on activeView", () => {
  api().setAppMode("tasks");
  assert.equal(api().appMode, "tasks");
});

test("setAppMode switches mode and updates activeView to last domain view", () => {
  // Set to tasks and pick board
  api().setAppMode("tasks");
  api().setActiveView("board");
  assert.equal(api().appMode, "tasks");
  assert.equal(api().activeView, "board");

  // Switch to marcom
  api().setAppMode("marcom");
  assert.equal(api().appMode, "marcom");
  // Default or last marcom view
  assert.ok(["events", "placements", "mous", "branches", "outlets", "documents", "reports", "analytics"].includes(api().activeView));

  // Change marcom view to branches
  api().setActiveView("branches");
  assert.equal(api().activeView, "branches");

  // Switch back to tasks -> restores board
  api().setAppMode("tasks");
  assert.equal(api().appMode, "tasks");
  assert.equal(api().activeView, "board");

  // Switch back to marcom -> restores branches
  api().setAppMode("marcom");
  assert.equal(api().appMode, "marcom");
  assert.equal(api().activeView, "branches");
});

test("setActiveView auto-syncs appMode when selecting views from either domain", () => {
  api().setActiveView("calendar");
  assert.equal(api().appMode, "tasks");

  api().setActiveView("outlets");
  assert.equal(api().appMode, "marcom");

  api().setActiveView("list");
  assert.equal(api().appMode, "tasks");
});

test("navigateToMarcom switches appMode to marcom", () => {
  api().setAppMode("tasks");
  api().navigateToMarcom("mous", "Search Term");
  assert.equal(api().appMode, "marcom");
  assert.equal(api().activeView, "mous");
  assert.equal(api().marcomFilters["mous"], "Search Term");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/store/appMode.test.ts`
Expected: FAIL with missing `appMode` or `setAppMode` on `useWorkspaceStore`.

- [ ] **Step 3: Add `AppMode` to `src/types/index.ts`**

In `src/types/index.ts`, define:
```typescript
export type AppMode = "tasks" | "marcom";
```

- [ ] **Step 4: Update `useWorkspaceStore.ts` with `appMode` slice**

In `src/lib/store/useWorkspaceStore.ts`:
1. Import `AppMode` from `@/types`.
2. Define a helper constant for marcom view modes:
```typescript
const MARCOM_VIEW_SET = new Set<ViewMode>([
  "events",
  "content",
  "placements",
  "mous",
  "branches",
  "outlets",
  "documents",
  "reports",
  "analytics",
]);
```
3. Add to `WorkspaceState`:
```typescript
  appMode: AppMode;
  lastTaskView: ViewMode;
  lastMarcomView: ViewMode;
  setAppMode: (mode: AppMode) => void;
```
4. In store initialization:
```typescript
  appMode: "tasks",
  lastTaskView: "list",
  lastMarcomView: "events",
  setAppMode: (mode) =>
    set((state) => {
      if (state.appMode === mode) return {};
      const targetView = mode === "tasks" ? state.lastTaskView : state.lastMarcomView;
      return {
        appMode: mode,
        activeView: targetView,
      };
    }),
  setActiveView: (view) =>
    set((state) => {
      const isMarcom = MARCOM_VIEW_SET.has(view);
      const newMode: AppMode = isMarcom ? "marcom" : "tasks";
      return {
        activeView: view,
        appMode: newMode,
        lastTaskView: !isMarcom ? view : state.lastTaskView,
        lastMarcomView: isMarcom ? view : state.lastMarcomView,
      };
    }),
  navigateToMarcom: (view, search) =>
    set((state) => ({
      appMode: "marcom",
      activeView: view,
      lastMarcomView: view,
      marcomFilters:
        search !== undefined
          ? { ...state.marcomFilters, [view]: search }
          : state.marcomFilters,
    })),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/store/appMode.test.ts`
Expected: PASS (4 tests passing).

Run full suite: `npm test`
Expected: PASS (109 tests passing).

- [ ] **Step 6: Commit Task 1**

```bash
git add src/types/index.ts src/lib/store/useWorkspaceStore.ts src/lib/store/appMode.test.ts
git commit -m "feat(store): add appMode state slice and auto-sync with unit tests"
```

---

### Task 2: Implement Mode Switcher in `GlobalRail.tsx`

**Files:**
- Modify: `src/components/layout/GlobalRail.tsx:1-120`

**Interfaces:**
- Consumes: `appMode`, `setAppMode` from `useWorkspaceStore`.
- Produces: Dual-mode switcher controls at the top of `GlobalRail`.

- [ ] **Step 1: Inspect `GlobalRail.tsx` top section**

Review lines 75-95 of `src/components/layout/GlobalRail.tsx`.
Currently, the top section has the sidebar expand/collapse chevron button followed by `NAV_ITEMS`.

- [ ] **Step 2: Add mode toggle buttons at the top of `GlobalRail.tsx`**

1. Import `Kanban` (or `CheckSquare`) and `Megaphone` from `lucide-react`.
2. Extract `appMode` and `setAppMode` from `useWorkspaceStore()`.
3. Add a dedicated Top Mode Switcher section above the sidebar collapse button:
```tsx
        {/* Top Section: Mode Switcher & Global Navigation */}
        <div className="flex flex-col items-center w-full gap-1">
          {/* Workspace Mode Switcher */}
          <div className="flex flex-col items-center gap-1 p-1 mb-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            {/* Projects & Tasks Mode Toggle */}
            <button
              type="button"
              onClick={() => setAppMode("tasks")}
              title="Projects & Tasks"
              className={cn(
                "w-9 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer group relative",
                appMode === "tasks"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10",
              )}
            >
              <Kanban className="w-4 h-4 transition-transform group-hover:scale-105" />
            </button>

            {/* Marketing & Ops Mode Toggle */}
            <button
              type="button"
              onClick={() => setAppMode("marcom")}
              title="Marketing & Ops Hub"
              className={cn(
                "w-9 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer group relative",
                appMode === "marcom"
                  ? "bg-pink-600 text-white shadow-sm shadow-pink-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10",
              )}
            >
              <Megaphone className="w-4 h-4 transition-transform group-hover:scale-105" />
            </button>
          </div>

          <div className="w-6 h-px bg-white/10 my-0.5" />

          {/* Sidebar Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="w-9 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors mb-2 cursor-pointer"
          >
            {isSidebarOpen ? (
              <ChevronsLeft className="w-4 h-4" />
            ) : (
              <ChevronsRight className="w-4 h-4" />
            )}
          </button>
```

- [ ] **Step 3: Verify TypeScript compilation & existing unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/components/layout/GlobalRail.tsx
git commit -m "feat(ui): add dual-context mode switcher to GlobalRail"
```

---

### Task 3: Streamline `ViewSwitcher.tsx` to Task-Only Views

**Files:**
- Modify: `src/components/layout/ViewSwitcher.tsx:1-248`

**Interfaces:**
- Consumes: Task view items (`channel`, `list`, `board`, `calendar`, `gantt`, `table`). Exports `WORK_ITEM_VIEWS` and `MASTER_DATA_VIEWS` for `Sidebar.tsx`.
- Produces: Clean Task ViewSwitcher without the nested Marketing dropdown tab.

- [ ] **Step 1: Inspect `ViewSwitcher.tsx`**

Check lines 100-240 of `src/components/layout/ViewSwitcher.tsx`.
Notice the Marketing dropdown button (lines 129-227) is rendered alongside task view tabs.

- [ ] **Step 2: Clean `ViewSwitcher.tsx`**

1. Keep exports: `WORK_ITEM_VIEWS`, `MASTER_DATA_VIEWS`, `MARKETING_VIEWS` (used by other components).
2. Remove `isMarketingOpen` and `marketingDropdownRef` state.
3. Remove lines 128-227 (the marketing dropdown button and its popover menu).
4. `ViewSwitcher` will now strictly render task tabs (`VIEWS: channel, list, board, calendar, gantt, table`) and the `+ View` button.

- [ ] **Step 3: Run test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/layout/ViewSwitcher.tsx
git commit -m "refactor(ui): streamline ViewSwitcher to pure task view tabs"
```

---

### Task 4: Dynamic `Sidebar.tsx` (Spaces Tree vs Marketing Hub)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:50-80, 140-730`

**Interfaces:**
- Consumes: `appMode` from `useWorkspaceStore`, `WORK_ITEM_VIEWS` and `MASTER_DATA_VIEWS` from `ViewSwitcher`.
- Produces: Dynamic sidebar that displays either Spaces & Lists (in tasks mode) or dedicated Marketing Hub panel (in marcom mode).

- [ ] **Step 1: Inspect `Sidebar.tsx` structure**

Check where `appMode` can conditionally render:
- Top Header: Shows workspace name / switcher in Tasks mode; shows "Marketing Hub" header with badge in Marcom mode.
- Body Section:
  - If `appMode === "tasks"`: Shows Spaces accordion list (Product Space, folders, lists). Remove the bottom `{/* Marketing & Ops Section */}` (lines 646-735).
  - If `appMode === "marcom"`: Shows two direct groups:
    - **WORK ITEMS**: `Campaigns & Content`, `Placements`, `MOUs`.
    - **MASTER DATA**: `Branches`, `Outlets`, `Documents`, `Reports`, `Analytics`.
    - *Zero subtitles/micro-labels per user instruction*.

- [ ] **Step 2: Update `Sidebar.tsx`**

1. Pull `appMode` from `useWorkspaceStore`.
2. In the sidebar header:
   - When `appMode === "marcom"`:
     ```tsx
     <div className="flex items-center justify-between p-3 border-b border-slate-200/80 dark:border-slate-800/80">
       <div className="flex items-center gap-2">
         <div className="w-6 h-6 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-xs">
           <Megaphone className="w-3.5 h-3.5" />
         </div>
         <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
           Marketing Hub
         </div>
       </div>
       <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800">
         Ops Portal
       </span>
     </div>
     ```
   - When `appMode === "tasks"`: Keep current Workspace switcher dropdown header.
3. In the sidebar scrollable body:
   - If `appMode === "tasks"`:
     - Render the existing Spaces list.
     - **Remove** lines 646-735 (the old appended Marketing & Ops section).
   - If `appMode === "marcom"`:
     - Render the dedicated Marcom panel:
     ```tsx
     <div className="p-2 space-y-4">
       {/* WORK ITEMS Group */}
       <div>
         <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
           Work Items
         </div>
         <div className="space-y-0.5">
           {WORK_ITEM_VIEWS.map((mv) => {
             const isItemActive =
               activeView === mv.id ||
               (mv.id === "events" && activeView === "content");
             const Icon = mv.icon;
             return (
               <button
                 key={mv.id}
                 type="button"
                 onClick={() => setActiveView(mv.id)}
                 className={cn(
                   "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                   isItemActive
                     ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                     : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                 )}
               >
                 <Icon className={cn("w-4 h-4 shrink-0", mv.iconColor)} />
                 <span className="truncate">{mv.label}</span>
               </button>
             );
           })}
         </div>
       </div>

       {/* MASTER DATA Group */}
       <div>
         <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
           Master Data
         </div>
         <div className="space-y-0.5">
           {MASTER_DATA_VIEWS.map((mv) => {
             const isItemActive = activeView === mv.id;
             const Icon = mv.icon;
             return (
               <button
                 key={mv.id}
                 type="button"
                 onClick={() => setActiveView(mv.id)}
                 className={cn(
                   "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                   isItemActive
                     ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                     : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                 )}
               >
                 <Icon className={cn("w-4 h-4 shrink-0", mv.iconColor)} />
                 <span className="truncate">{mv.label}</span>
               </button>
             );
           })}
         </div>
       </div>
     </div>
     ```

- [ ] **Step 3: Run test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit Task 4**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(ui): implement dynamic sidebar for Tasks and Marketing Hub modes"
```

---

### Task 5: Dynamic Lean `TopNav.tsx` for Marketing Mode

**Files:**
- Modify: `src/components/layout/TopNav.tsx:60-100, 280-565`

**Interfaces:**
- Consumes: `appMode`, `activeView` from `useWorkspaceStore`.
- Produces: Lean single-tier header (~44px) when `appMode === "marcom"`; full 3-tier header when `appMode === "tasks"`.

- [ ] **Step 1: Inspect `TopNav.tsx` rendering**

Check lines 280-565 in `TopNav.tsx`.
Currently, `TopNav` always renders:
- Tier 1: Main Header (Workspace selector, search bar, call, notifications, user avatar)
- Tier 2: Space/List Breadcrumbs + `ViewSwitcher`
- Tier 3: Quick Action Controls (Agents, Automate, Brain², Share)

- [ ] **Step 2: Implement lean TopNav for Marcom mode**

1. Pull `appMode` and `activeView` from `useWorkspaceStore`.
2. Map `activeView` to human-readable label in Marcom mode (e.g. `Campaigns & Content`, `Placements`, `MOUs`, `Branches`, `Outlets`, `Documents`, `Reports`, `Analytics`).
3. If `appMode === "marcom"`:
   - Render a single-tier header (~44px):
     ```tsx
     <header className="h-11 px-4 flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
       {/* Breadcrumbs */}
       <div className="flex items-center gap-2 text-xs">
         <span className="font-semibold text-pink-600 dark:text-pink-400">Marketing Hub</span>
         <span className="text-slate-400">/</span>
         <span className="font-medium text-slate-800 dark:text-slate-200">{activeMarcomLabel}</span>
       </div>

       {/* Center: Search trigger */}
       <button
         type="button"
         onClick={openCommandPalette}
         className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
       >
         <Search className="w-3.5 h-3.5" />
         <span>Search marketing & ops...</span>
         <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">⌘K</kbd>
       </button>

       {/* Right: Actions */}
       <div className="flex items-center gap-2">
         <ThemeToggle />
         <NotificationCenter />
         <UserAvatar user={me} size="sm" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} />
       </div>
     </header>
     ```
   - Do NOT render Tier 2 or Tier 3 when `appMode === "marcom"`.
4. If `appMode === "tasks"`:
   - Keep existing Tier 1, Tier 2, and Tier 3 rendering.

- [ ] **Step 3: Run test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit Task 5**

```bash
git add src/components/layout/TopNav.tsx
git commit -m "feat(ui): add lean single-tier TopNav for Marketing Hub mode"
```

---

### Task 6: Gating `FilterBar` & Page Integration in `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx:140-200`

**Interfaces:**
- Consumes: `appMode` from `useWorkspaceStore`.
- Produces: Seamless page view switching and clean filter bar suppression in Marcom mode.

- [ ] **Step 1: Check `FilterBar` rendering in `src/app/page.tsx`**

In `src/app/page.tsx`, check lines 140-195:
```tsx
const showFilterBar =
  !NO_FILTER_BAR_VIEWS.has(activeView) && isFilterBarOpen;
```

- [ ] **Step 2: Add `appMode` condition to `FilterBar`**

Update the condition in `src/app/page.tsx`:
1. Pull `appMode` from `useWorkspaceStore()`.
2. Ensure `FilterBar` is never rendered when `appMode === "marcom"`:
```tsx
const showFilterBar =
  appMode === "tasks" &&
  !NO_FILTER_BAR_VIEWS.has(activeView) &&
  isFilterBarOpen;
```

- [ ] **Step 3: Run test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit Task 6**

```bash
git add src/app/page.tsx
git commit -m "feat(page): gate FilterBar strictly to tasks mode"
```

---

### Task 7: Full Verification & Integration Testing

**Files:**
- Test: All 25 test suites (`npm test`)

- [ ] **Step 1: Run complete unit test suite**

Run: `npm test`
Expected: 100% pass (109/109 tests).

- [ ] **Step 2: Verify TypeScript and build checks**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Manual flow check on running local dev server**

Verify:
- Local dev server at `http://localhost:3000` renders without console or hydration errors.
- Clicking the `Kanban` icon at the top of the Global Rail shows Tasks view, Spaces list, 3-tier header, and ViewSwitcher.
- Clicking the `Megaphone` icon shows Marketing Hub view, Marketing sidebar (Work Items & Master Data), and lean single-tier header.
- Pressing `⌘K` command palette allows navigating seamlessly between Tasks and Marcom entities.

- [ ] **Step 4: Final commit and summary**

```bash
git status
```
Ensure working tree is clean.
