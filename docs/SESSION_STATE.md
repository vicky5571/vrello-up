# SESSION_STATE.md — vrello-up

> **Update this file BEFORE ending every session.** Next session reads this first.

---

## Current Status

**Date:** 2026-10-31
**Active Branch:** `vicky`
**Active Feature:** Remove Projects Gantt View — **IMPLEMENTED & VERIFIED**
**Spec:** `docs/superpowers/specs/2026-10-31-remove-gantt-design.md`
**Plan:** `docs/superpowers/plans/2026-10-31-remove-gantt.md`
**ADR:** `docs/remove-gantt/adr.md`
**Previous Feature:** Auth UI Redesign (`866b997`) —
`docs/superpowers/specs/2026-10-30-auth-ui-redesign-design.md`

---

## What Was Completed This Session

1. **Phase 1 — Deleted 4 core Gantt files (-790 LOC):**
   - `src/components/views/ProjectsView/ProjectsGanttView.tsx`
   - `src/components/views/ProjectsView/useProjectsGantt.ts`
   - `src/components/views/ProjectsView/GanttBar.tsx`
   - `src/components/views/ProjectsView/GanttUnscheduledShelf.tsx`

2. **Phase 2 — Type System, Routing & Store Fallback:**
   - Removed `"gantt"` from `ViewMode` union in `src/types/index.ts`.
   - Removed `"gantt"` from `VALID_VIEW_MODES` in `src/lib/router/urlState.ts`.
   - Updated `normalizeViewMode` in `src/lib/store/slices/createUiSlice.ts` to normalize `"gantt"` to `"list"`.
   - Updated `onRehydrateStorage` in `src/lib/store/useWorkspaceStore.ts` to redirect persisted `activeView === "gantt"` or `lastTaskView === "gantt"` to `"list"`.

3. **Phase 3 — ActiveViewStage Cleanup:**
   - Removed dynamic import of `ProjectsGanttView` and `case "gantt"` in `src/components/views/ActiveViewStage.tsx`.

4. **Phase 4 — Navigation Entry Points & Hotkeys:**
   - `src/components/layout/navConfig.ts`: Removed Gantt entry from `PROJECTS_NAV_ITEMS` and unused `Clock` import.
   - `src/components/layout/Sidebar.tsx`: Updated mode-switch guard arrays from `["board", "list", "calendar", "gantt"]` to `["board", "list", "calendar"]`.
   - `src/lib/hooks/useWorkspaceHotkeys.ts`: Unbound shortcut key `"4"` (previously mapped to `"gantt"`).
   - `src/components/layout/CommandPalette.tsx`: Removed `"gantt"` from views array and unused `GanttChart` import.
   - `src/components/modals/MoreAppsMenu.tsx`: Removed Gantt button from Quick Views grid and unused `Milestone` import.

5. **Phase 5 — Modal Help & Upgrade Copy:**
   - `src/components/modals/HelpDocsModal.tsx`: Updated shortcuts text from `"1 - 5"` to `"1 - 3"`, removed Gantt guide item and unused `Layers` import.
   - `src/components/modals/UpgradeModal.tsx`: Removed Gantt item from features list and updated marketing subtitle copy.

6. **Preserved Domain Views:**
   - Domain timeline views `EventsView/EventsTimelineView.tsx` and `ContentPlannerView/ContentGanttView.tsx` remain untouched and functional.

7. **Hydration Error Fix (`src/components/views/ProjectsView/ProjectsListTable.tsx`):**
   - Replaced invalid wrapper `<tr className="contents">` with `<Fragment key={`group-wrapper-${key}`}>`.
   - Resolves React DOM validation and hydration error `In HTML, <tr> cannot be a child of <tr>`.

8. **Restored Rounded Sidebar Styling & Removed Header (`src/components/layout/Sidebar.tsx`):**
   - Restored floating card style with `rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-lg`.
   - Removed top `Vrello 2.0` header, logo, and badge.
   - Sits mode switcher cleanly at the top of the sidebar card.
   - Restored clean collapse state when `isSidebarOpen` is false.

9. **Projects List & Calendar View Visual Bugs Fix:**
   - Fixed height clipping: switched from `h-[calc(100vh-3.5rem)]` to `h-full min-h-0 overflow-hidden` across List, Calendar, and Board views.
   - Fixed dynamic `colSpan`: replaced hardcoded `colSpan={9}` with calculated `colSpan={totalColumns}` across group headers, quick add, and empty rows.
   - Fixed column width mismatch: aligned Status column between header and body row to `w-36`.
   - Fixed table crushing: added `min-w-[840px]` to `<table>` and solidified sticky header background.
   - Fixed calendar 6-week months: replaced `grid-rows-5` with dynamic `repeat(${numWeeks}, minmax(0, 1fr))` preventing 6th row cutoff.
   - Unified calendar card container with `rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xs`.
   - Fixed contrast of inactive month days and chip truncation `min-w-0`.
   - Added click-outside listener to "Columns" toggle menu in `ProjectsListHeader.tsx`.

10. **Kanban Board Drag & Drop Performance Optimization (`ProjectsBoardView`, `useProjectsBoard`, `ProjectsWorkItemCard`, `ProjectsBoardColumn`):**
   - Indexed items into `useMemo(() => new Map(...))` for $O(1)$ lookups during drag & drop events.
   - Memoized `ProjectsWorkItemCard` and `ProjectsBoardColumn` with `React.memo` preventing 50+ card re-render cascades on drag frames.
   - Added equality guard in `handleDragOver` so `setDropIndicator` only updates when column, key, or position actually changes, eliminating continuous 60-120fps re-render storms.
   - Fixed duplicate sortable registration in `@dnd-kit` by passing `disabled: isOverlay` to `useSortable`.
   - Removed CSS `transition` during active drag to eliminate pointer latency/lag.
   - Added optimistic state updates in `moveToColumn` with background API sync and auto-rollback on error for instant (0ms) card drops.

---

## Verification Gates (this session)

- `npm run drift:check` → ✅ No drift detected (19 specs paired, single-tenant invariant OK, coordinator files LOC OK, SSOT OK)
- `npm run build:check` → ✅ 0 TypeScript errors
- `npm test` → ✅ 569 passed, 0 failed (99 suites)

---

## Blocked / Risks

- None. Deep links to `?view=gantt` and persisted stores with `lastTaskView: "gantt"` safely fall back to `"list"`.

---

## Next Step for Following Session

1. Run verification commands (`npm run drift:check`, `npm run build:check`, `npm test`) on session start.
2. Coordinate deployment or staging push (`git push origin vicky`).
