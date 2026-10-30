# Spec: Projects Work Item Detail Drawers (Option 2 — Native Modal / Drawer Delegation)

**Date:** 2026-10-30  
**Status:** Proposed  
**Related Specs:** `docs/superpowers/specs/2026-10-30-remove-general-tasks-design.md`, `docs/superpowers/specs/2026-10-31-remove-gantt-design.md`  

---

## 1. Executive Summary

In previous versions of Vrello, clicking any card on the Kanban board (or row in table view, or event in calendar view) opened a detail drawer. When General Tasks were removed and the Projects view was repurposed to display unified `MarcomWorkItem` records (`ContentPostItem`, `FieldEventItem`, `MarcomPlacement`), the underlying card and row components retained click handlers (`onSelectItem`), but no drawer or modal host was mounted in the Projects view.

This design restores full work item inspection and editing capability by delegating to each domain entity's existing, native drawer or modal:
- **Content Posts (`_type: "content"`)** $\rightarrow$ `ContentDrawer`
- **Field Events (`_type: "event"`)** $\rightarrow$ `EventFormModal`
- **Placements (`_type: "placement"`)** $\rightarrow$ `PlacementDetailDrawer` (with `PlacementFormModal` for editing)

All three Projects sub-views (**Board View**, **List View**, and **Calendar View**) will automatically open the appropriate drawer or modal when a work item is clicked, with updates and deletions seamlessly reflected in the Zustand cache and on screen.

---

## 2. UX Flow & Interaction Contracts

### 2.1 Trigger Points
1. **Kanban Board (`ProjectsBoardView`):**
   - Clicking a `ProjectsWorkItemCard` anywhere outside control buttons (checkbox, status move menu) triggers selection.
   - Drag-and-drop operations with travel distance $\ge 5$px do not trigger selection.
2. **List Table (`ProjectsListView`):**
   - Clicking a row title or the row actions button (`MoreHorizontal`) triggers selection.
   - Inline double-clicks on title, date, or PIC trigger inline editing rather than opening the drawer.
3. **Calendar (`ProjectsCalendarView`):**
   - Clicking any activity chip in `CalendarDayCell` or inside the `+N more` overflow popover triggers selection.
   - Clicking empty day space triggers the quick creation popover.

### 2.2 Entity Delegation Behavior
- **Content Post:**
  - Opens `ContentDrawer` as a slide-over panel from the right.
  - User can view/edit title, platform, format, publication date, caption, revision notes, and interactive subtasks checklist.
  - Submitting edits calls `PATCH /api/marcom/content/[id]` and updates `useWorkspaceStore` cache via `updateCachedPost`.
  - Deleting calls `DELETE /api/marcom/content/[id]` and removes from cache via `removeCachedPost`.
- **Field Event:**
  - Opens `EventFormModal` as an accessible dialog overlay.
  - User can inspect/edit activation name, type, branch, venue location, date range, PIC, status, budget, attendance targets, and notes.
  - Saving updates `useWorkspaceStore` cache via `updateCachedEvent`.
- **Placement:**
  - Opens `PlacementDetailDrawer` as a slide-over panel from the right.
  - User can inspect brand badge, installation status, outlet details, GPS coordinates with map deep-link and copy button, materials, dimensions, and installed photo gallery.
  - Clicking the edit button (pencil) opens `PlacementFormModal` to modify placement attributes.
  - Saving in `PlacementFormModal` calls `PATCH /api/marcom/placements/[id]` and updates cache via `updateCachedPlacement`.

---

## 3. Architecture & Component Decomposition

To keep coordinator files strictly $\le 250$ LOC and prevent code duplication across the three Projects views, we introduce a dedicated host component:

```
src/components/views/ProjectsView/
├── ProjectsDetailDrawerHost.tsx  ← [NEW] Unified host for domain drawers/modals (~150 LOC)
├── ProjectsBoardView.tsx         ← Uses ProjectsDetailDrawerHost when onSelectItem is omitted
├── ProjectsListView.tsx          ← Uses ProjectsDetailDrawerHost when onSelectItem is omitted
└── ProjectsCalendarView.tsx      ← Uses ProjectsDetailDrawerHost when onSelectItem is omitted
```

### 3.1 Host Responsibility (`ProjectsDetailDrawerHost.tsx`)
1. **Dynamic Imports:** Lazily loads `ContentDrawer`, `EventFormModal`, `PlacementDetailDrawer`, and `PlacementFormModal` via `next/dynamic` to preserve initial page load performance.
2. **Entity Dispatch:** Inspects `selectedItem._type` and mounts the corresponding drawer or modal.
3. **Data Plumbing:**
   - Obtains `branches` and `members` from `useWorkspaceStore` for `EventFormModal`.
   - Obtains `outlets`, `materials`, and `mous` from `useMarcomDataStore` for `PlacementFormModal`.
   - Obtains `can("CREATE_PLACEMENT")` from `useMarcomPermissions` for `PlacementDetailDrawer.canManage`.
4. **Cache Synchronization:**
   - Bridges save/delete callbacks with Zustand actions (`updateCachedPost`, `removeCachedPost`, `updateCachedEvent`, `updateCachedPlacement`).

---

## 4. Invariants & Non-Goals

### 4.1 Invariants Enforced
- **Coordinator LOC Limit:** `ProjectsBoardView.tsx` ($\le 180$ LOC), `ProjectsListView.tsx` ($\le 100$ LOC), `ProjectsCalendarView.tsx` ($\le 145$ LOC), `ProjectsDetailDrawerHost.tsx` ($\le 200$ LOC).
- **SSOT:** All domain entity shapes are imported from `src/types/index.ts`. No duplicate interfaces.
- **Verification Gates:** Full test suite (`npm test`), drift check (`npm run drift:check`), and TypeScript strict check (`npm run build:check`) must pass with 0 errors.

### 4.2 Non-Goals
- Reintroducing old general task models or the legacy 1500-LOC `TaskDrawer.tsx`.
- Modifying the internal implementations of `ContentDrawer.tsx`, `EventFormModal.tsx`, or `PlacementDetailDrawer.tsx` beyond what is needed to consume standard callbacks.

---

## 5. Verification Checklist

- [ ] Clicking a content post card on the Kanban board opens `ContentDrawer`.
- [ ] Modifying a content post's title or status in `ContentDrawer` updates the card on the board.
- [ ] Clicking a field event card on the Kanban board opens `EventFormModal`.
- [ ] Clicking a placement card on the Kanban board opens `PlacementDetailDrawer`.
- [ ] Clicking the edit button in `PlacementDetailDrawer` opens `PlacementFormModal`.
- [ ] The exact same detail opening behavior functions in `ProjectsListView` and `ProjectsCalendarView`.
- [ ] Drag-and-drop on the Kanban board still moves cards between columns without inadvertently triggering drawer open.
- [ ] `npm run drift:check` passes with zero violations.
- [ ] `npm run build:check` passes with zero TypeScript errors.
- [ ] `npm test` passes with 0 failures.

