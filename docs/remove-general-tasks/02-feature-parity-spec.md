# Spec: Projects View Feature Parity for MarcomWorkItem

**Date:** 2026-10-30
**Related ADR:** `02-feature-parity-adr.md`
**Related Plan:** `02-feature-parity-plan.md`

---

## 1. Overview

The current Projects views (Board, List, Calendar, Gantt) lost the following
feature categories compared to the old task-based views:

| Category | Lost Features |
|---|---|
| Board drag | Within-column reorder, drop-line indicator, keyboard drag, screen-reader announcements |
| Board cards | Media thumbnail, checklist progress pill, overdue date highlight, "move to" context menu, per-card select checkbox, density sizing |
| Board columns | Quick-add inline form, per-column select-all |
| Board bulk | Floating bulk-action bar (status change, delete) |
| List inline editing | Click-to-edit status, PIC, date per row |
| List table | Column visibility toggle, sort indicators, Group By, collapsible groups, per-row checkbox, select-all toolbar |
| Calendar | Status-colored chips, click empty day to create, overflow "+N more", hover tooltips |
| Gantt | Drag-to-reschedule bars, edge resize, progress drag, unscheduled shelf, collapsible sidebar |
| Global | Projects FilterBar (search/type/status/branch/PIC/date) |

All features are restored adapted to `MarcomWorkItem` — no Task type reintroduced.

---

## 2. Board View Spec

### 2a. Within-Column Reorder

Each column wraps its cards in `<SortableContext items={ids} strategy={verticalListSortingStrategy}>`.
Dropping a card on another card in the **same column** reorders locally.
Local order is persisted in `viewPreferences.projectsBoardOrder: Record<ProjectsColumn, string[]>`.
No API call needed — order is UI-only (marcom entities have no orderIndex).

### 2b. Drop-Line Indicator

Port `DropLineIndicator` from old `BoardColumn.tsx` verbatim (no task deps):
```tsx
function DropLineIndicator({ position }: { position: "before" | "after" | "center" }) {
  // blue dot + full-width blue line
}
```
`dropIndicator` state shape: `{ column: ProjectsColumn; itemKey: string | null; position: "before" | "after" | "bottom" } | null`

### 2c. Keyboard Drag

Add `KeyboardSensor` with `sortableKeyboardCoordinates` to `ProjectsBoardView` sensors array.
Add `aria-live="polite"` announcement div: announces "Picked up X", "X moved to column Y", "X dropped."

### 2d. Move-to-Column Context Menu on Card

`ProjectsWorkItemCard` gets a `⋯` button (top-right, visible on hover + always on mobile).
Click → inline dropdown listing valid columns for this `_type`:
- `content`: In Progress / Ready / Done / Archived
- `event`: Upcoming / In Progress / Done / Cancelled
- `placement`: To Do / In Progress / Done / Blocked

On select → same `handleDrop(item, targetColumn)` as drag.

### 2e. Quick-Create in Column

Column header `+` button → inline form at top of column:
- Shows entity type selector (Content / Event / Placement) if column is ambiguous
- Columns "Upcoming" → defaults Event; "To Do" → defaults Placement; others → show picker
- Input: title/name only
- Submit → `POST /api/marcom/{type}` with `{ title/name, status: mappedStatus }`
- Cancel → dismiss

### 2f. Per-Card Checkbox + Column Select-All

Each card has a checkbox (hidden by default, visible on hover or when any card selected).
Column header has a select-all checkbox when `tasks.length > 0`.
Selected cards tracked in local `selectedKeys: Set<string>` where key = `${_type}:${id}`.

### 2g. Bulk Action Bar

`ProjectsBulkActionBar` — floats at bottom center when `selectedKeys.size > 0`:
- **Count badge**: "N selected"
- **Status dropdown**: lists unified `ProjectsColumn` values → on change, bulk-patches each selected item to its mapped status (skip if `mapColumnToStatus` returns null for that type)
- **Delete button**: soft-delete per type via `DELETE /api/marcom/{type}/{id}`, with Sonner undo toast (5 s)
- **Clear ×**: clears selection

### 2h. Media Thumbnail on Content Cards

If `item._type === "content" && item.mediaUrl`:
- Show image or video thumbnail (aspect-video, max-h-28, rounded-md)
- Video shows play icon overlay

### 2i. Checklist Progress Pill on Cards

- Content: `completedSubtasks / totalSubtasks` (from `item.subtasks`)
- Event: `completedChecklist / totalChecklist` (from `item.checklist`)
- Shown only when total > 0

### 2j. Overdue Date Highlight

`getWorkItemDate(item)` compared to today. If date is past AND column is not Done/Published/Completed/Cancelled/Archived → render date chip in red.

### 2k. Density Sizing on Cards

Read `viewPreferences.density` ("compact" | "default" | "relaxed"):
- compact → `p-2`, title `text-[11px]`
- default → `p-3`, title `text-xs`
- relaxed → `p-4`, title `text-sm`

---

## 3. List View Spec

### 3a. Column Definitions

| Column | Content | Event | Placement |
|---|---|---|---|
| ☐ | select checkbox | select checkbox | select checkbox |
| Type | "Content" badge | "Event" badge | "Placement" badge |
| Name | title (editable) | name (editable) | material @ outlet (read-only) |
| Status | PostStatus pill (editable) | EventStatus pill (editable) | PlacementStatus pill (editable) |
| Date | publishDate (editable) | startDate (editable) | date (editable) |
| Branch | branchName | branchName | outlet.branch |
| PIC | picName (editable) | picName (editable) | picName (editable) |
| Checklist | subtask count pill | checklist count pill | — |
| Actions | ⋯ open drawer | ⋯ open modal | ⋯ open drawer |

Visible columns controlled by `visibleFields` in `viewPreferences`.

### 3b. Sortable Column Headers

Each column header is a button. Click cycles: none → asc → desc → none.
Active sort shown with `ArrowUp`/`ArrowDown` icon + indigo color.
`×` button clears sort. State in `viewPreferences.taskSortField` / `taskSortDirection`.

Sort fields: `name`, `status`, `date`, `branch`, `pic`, `type`.

### 3c. Group By

Toolbar group-by picker: **Type** (default) | **Status** | **Branch** | **PIC** | None.

Group headers: colored badge + label + count. Collapsible (chevron toggle).
Each group footer has `+ New [Content/Event/Placement]` inline add row.

### 3d. Inline Editing per Row

- **Status cell**: click → dropdown of valid statuses for that `_type` → PATCH on select
- **Date cell**: click → `<input type="date">` → PATCH on blur/Enter
- **PIC cell**: click → searchable user picker from `users` list → PATCH on select
- **Name cell**: double-click → `<input>` inline → PATCH on blur/Enter

### 3e. Per-Row Checkbox + Bulk Action Bar

Same `ProjectsBulkActionBar` as Board. Select checkbox on each row, select-all in column header.

### 3f. Column Visibility Menu

"Columns" button → dropdown checkboxes for: Branch, PIC, Date, Checklist. Persisted in `viewPreferences.visibleFields`.

### 3g. Overdue Row Highlight

Row text-color dimmed + date cell red if date is past and status is not terminal.

---

## 4. Calendar View Spec

### 4a. Status-Colored Chips

Each chip background = entity's own status color at 15% opacity; border = status color at 30%; text = status color.

Status color map:
```
Content: DRAFT=#64748B, IN_REVIEW=#F59E0B, REVISION=#EF4444, APPROVED=#10B981, SCHEDULED=#3B82F6, PUBLISHED=#7B68EE
Event:   UPCOMING=#3B82F6, ON_PROGRESS=#F59E0B, COMPLETED=#10B981, CANCELLED=#EF4444
Placement: NOT_STARTED=#64748B, ON_PROGRESS=#F59E0B, DONE=#10B981, ISSUE=#EF4444
```

### 4b. Overflow Handling

Per day cell: show max 3 chips. If more, show `+N more` badge.
Click `+N more` → popover listing all items for that day.

### 4c. Click Empty Day to Create

Click any empty day cell area → small popover with three buttons:
`+ New Content Post`, `+ New Field Event`, `+ New Placement`
→ opens relevant create modal/drawer with date pre-filled.

Double-click also triggers the same popover.

### 4d. Chip Tooltip

`title` attribute on each chip = full entity name + status.

### 4e. Multi-Day Event Spanning

FieldEvent with `startDate` ≠ `endDate` → render chip on every day in the range.
First day shows full title. Continuation days show `↳ {name}` truncated.

---

## 5. Gantt View Spec

### 5a. Three Row Groups

```
Group 1 — Field Events & Activations
  Row per FieldEvent that has startDate or date
  Bar: startDate → endDate  (multi-day)
  Drag: move (shift both dates), left resize (startDate), right resize (endDate)

Group 2 — Social & Digital Content
  Row per ContentPost that has publishDate
  Bar: single-day marker at publishDate
  Drag: move only (shift publishDate by N days)

Group 3 — Media Placements
  Row per Placement that has date
  Bar: single-day marker at date
  Drag: move only (shift date by N days)
```

### 5b. Drag Interactions

**FieldEvent bar — Move**: `pointerdown` on bar body → `type: "move"` → on pointerup PATCH `{ startDate, endDate }` to `/api/marcom/events/{id}`

**FieldEvent bar — Resize start**: `pointerdown` on left 10px handle → `type: "resize-start"` → on pointerup PATCH `{ startDate }`

**FieldEvent bar — Resize end**: `pointerdown` on right 10px handle → `type: "resize-end"` → on pointerup PATCH `{ endDate }`

**ContentPost / Placement bar — Move**: `pointerdown` on bar → `type: "move"` → on pointerup PATCH `{ publishDate }` or `{ date }`

**Progress drag**: drag inner circle left/right → updates `event.progress` (0–100) on pointerup via PATCH. For ContentPost uses subtask ratio (read-only, no drag).

No dependency drag (intentionally dropped per ADR-P20).

### 5c. Collapsible Left Sidebar

Width 280px. "Hide Tasks" / "Show Tasks" toggle button. Shows item name + type badge per row.

### 5d. Unscheduled Shelf

Bottom panel lists items with no date. Click item → date picker popover → on confirm PATCH the date field → item moves onto timeline.

### 5e. Zoom: Day / Week / Month

Column widths:
- day: 48px/col, 35 days shown
- week: 36px/col, 56 days shown
- month: 24px/col, 84 days shown

### 5f. Screen-Reader Announcements

`aria-live="polite"` div: "Dragging {name}", "{name} rescheduled to {date}", "Drag cancelled."

---

## 6. Projects FilterBar Spec

New component: `src/components/layout/ProjectsFilterBar.tsx`

Rendered in `TopNav` when `appMode === "tasks"` (same slot old FilterBar used).

### Filter Controls

| Control | Type | Behavior |
|---|---|---|
| Search | text input (debounced 200ms) | filters name/title across all three types |
| Type | pill group: All / Content / Event / Placement | hides cards/rows not matching |
| Status | multi-select dropdown | lists unified ProjectsColumn values |
| Branch | single-select dropdown | populated from unique branchName values in loaded data |
| PIC | multi-select dropdown | populated from unique picName values |
| Date Range | from/to date inputs | filters by work item's primary date field |
| Clear All | button | resets all filters |

### State Location

`ProjectsFilterState` stored in `viewPreferences.projectsFilters` (persisted in `viewPreferences`):
```typescript
interface ProjectsFilterState {
  search: string;
  types: MarcomWorkItemType[];          // [] = all
  columns: ProjectsColumn[];            // [] = all
  branches: string[];
  pics: string[];
  dateFrom: string | null;
  dateTo: string | null;
}
```

### Filter Application

A single `applyProjectsFilters(items, filters)` pure function in `src/lib/marcom/projectsFilters.ts`. Used by Board, List, Calendar, Gantt equally.

---

## 7. Intentionally Not Restored

| Feature | Reason |
|---|---|
| Real-time presence avatars on cards | Marcom entities have no presence/WebSocket tracking |
| Dependency lines (SVG arrows) on Gantt | Marcom entities have no blocking relationships |
| Task trash / undo-delete system | Use marcom-native archive (status = ARCHIVED / CANCELLED) |
| Priority field (urgent/high/normal/low) | Not a concept on ContentPost, FieldEvent, or Placement |
| Tag badges on cards | Marcom entities use platform/format/eventType categorisation instead |
| Custom status creation (+ New status button in List) | Statuses are fixed enums per entity type |
| Space/List hierarchy scoping | Replaced by Type filter |
