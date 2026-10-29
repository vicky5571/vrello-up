# Plan: Projects View Feature Parity

**Date:** 2026-10-30
**Related ADR:** `02-feature-parity-adr.md`
**Related Spec:** `02-feature-parity-spec.md`

---

## Phases Overview

| # | Phase | Touches | Risk |
|---|-------|---------|------|
| 1 | ProjectsFilterBar + projectsFilters utility | New files only | Low |
| 2 | Board — within-column reorder + drop-line indicator | ProjectsBoardView, ProjectsBoardColumn | Medium |
| 3 | Board — keyboard drag + screen-reader announcements | ProjectsBoardView | Low |
| 4 | Board — card enhancements (media, checklist, overdue, density, context menu) | ProjectsWorkItemCard | Low |
| 5 | Board — quick-create in column + per-card checkbox + bulk action bar | ProjectsBoardColumn, new ProjectsBulkActionBar | Medium |
| 6 | List — column visibility, sort indicators, group-by, collapsible groups | ProjectsListView | Medium |
| 7 | List — inline editing per row + per-row checkbox + bulk bar | ProjectsListView | Medium |
| 8 | Calendar — status-colored chips, overflow, click-to-create, multi-day events | ProjectsCalendarView | Medium |
| 9 | Gantt — drag-reschedule + edge resize + progress drag | ProjectsGanttView | High |
| 10 | Gantt — unscheduled shelf + collapsible sidebar | ProjectsGanttView | Low |
| 11 | Wire FilterBar into TopNav + connect all views | TopNav, all Projects views | Low |
| 12 | Wire viewPreferences.density + visibleFields to Board and List | ProjectsBoardView, ProjectsListView | Low |
| 13 | Tests — new unit tests for projectsFilters + integration smoke tests | test/ | Low |

**Rule:** Run `npm test` after every phase. Never skip a phase.
**Commit convention:** `feat(projects): phase N — <description>`

---

## Phase 1 — ProjectsFilterBar + projectsFilters Utility

### New files
- `src/lib/marcom/projectsFilters.ts` — pure filter function
- `src/components/layout/ProjectsFilterBar.tsx` — UI component
- `src/lib/marcom/projectsFilters.test.ts` — unit tests

### `projectsFilters.ts` contents
```typescript
export interface ProjectsFilterState {
  search: string;
  types: MarcomWorkItemType[];
  columns: ProjectsColumn[];
  branches: string[];
  pics: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const DEFAULT_PROJECTS_FILTERS: ProjectsFilterState = {
  search: "", types: [], columns: [],
  branches: [], pics: [], dateFrom: null, dateTo: null,
};

export function applyProjectsFilters(
  items: MarcomWorkItem[],
  filters: ProjectsFilterState,
): MarcomWorkItem[]
```

### `ProjectsFilterBar.tsx` controls
Search input (debounce 200ms) | Type pills (All/Content/Event/Placement) |
Status dropdown (multi) | Branch dropdown (single) | PIC dropdown (multi) |
Date-from + Date-to inputs | Clear All button

### Wiring
- Add `projectsFilters: ProjectsFilterState` + `setProjectsFilters(partial): void` to `createUiSlice.ts`
- Add `projectsFilters` to `partialize` list in `useWorkspaceStore` (persisted)

### Verification
```bash
npm test  # projectsFilters.test.ts passes
grep -n "projectsFilters" src/lib/store/slices/createUiSlice.ts  # confirms wired
```

---

## Phase 2 — Board: Within-Column Reorder + Drop-Line Indicator

### Files to edit
- `src/components/views/ProjectsView/ProjectsBoardColumn.tsx`
- `src/components/views/ProjectsView/ProjectsBoardView.tsx`

### Changes to `ProjectsBoardColumn`
1. Wrap card list in `<SortableContext items={itemKeys} strategy={verticalListSortingStrategy}>`
   where `itemKeys = items.map(i => \`\${i._type}:\${i.id}\`)`
2. Import `DropLineIndicator` (copy verbatim from old `BoardColumn.tsx`):
   ```tsx
   function DropLineIndicator({ position }: { position: "before"|"after"|"center" }) { ... }
   ```
3. Accept `dropIndicator: { itemKey: string|null; position: "before"|"after"|"bottom" } | null` prop
4. Render `<DropLineIndicator>` before/after the targeted card

### Changes to `ProjectsBoardView`
1. Add `handleDragOver(event: DragOverEvent)` — sets `dropIndicator` state
2. `dropIndicator` shape: `{ column: ProjectsColumn; itemKey: string|null; position: "before"|"after"|"bottom" } | null`
3. In `handleDragEnd`: if same column → call `reorderColumn(column, newOrder)` which updates local `boardOrder` in `viewPreferences`
4. Add `boardOrder: Record<string, string[]>` to `viewPreferences` (or local state if not persisting)
5. Pass `dropIndicator` to each `ProjectsBoardColumn`

### Verification
- Drag card within same column → reorders locally
- Blue drop-line appears between cards during drag
- No cross-column reorder regressed
- `npm test` passes

---

## Phase 3 — Board: Keyboard Drag + Screen-Reader Announcements

### Files to edit
- `src/components/views/ProjectsView/ProjectsBoardView.tsx`

### Changes
1. Import `KeyboardSensor`, `sortableKeyboardCoordinates` from `@dnd-kit`
2. Add to sensors array:
   ```typescript
   useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
   ```
3. Add `announcement` state (`string`)
4. Set announcements in drag handlers:
   - `handleDragStart` → `"Picked up {title}."`
   - `handleDragOver` → `"{title} over {column} column."`  (deduplicated with `lastAnnouncedColumn` ref)
   - `handleDragEnd` → `"{title} dropped into {column}."` or `"Drag cancelled."`
5. Render `<div aria-live="polite" role="status" className="sr-only">{announcement}</div>`

### Verification
- Tab to a card, press Space → picks up
- Arrow keys move between columns
- Screen reader announces column names
- `npm test` passes

---

## Phase 4 — Board: Card Enhancements

### Files to edit
- `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx`

### Changes (all in one file)

**Media thumbnail** (content cards only):
```tsx
{item._type === "content" && item.mediaUrl && (
  <div className="mb-2.5 overflow-hidden rounded-md aspect-video max-h-28 relative bg-slate-100">
    {item.mediaUrl.endsWith(".mp4") ? (
      <><video src={item.mediaUrl} preload="metadata" className="w-full h-full object-cover pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-3 h-3 fill-white" />
        </div></>
    ) : (
      <img src={item.mediaUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
    )}
  </div>
)}
```

**Checklist progress pill**:
```tsx
const checklistTotal = item._type === "content" ? item.subtasks?.length ?? 0
  : item._type === "event" ? item.checklist?.length ?? 0 : 0;
const checklistDone = item._type === "content"
  ? (item.subtasks?.filter(s => s.completed).length ?? 0)
  : item._type === "event"
  ? (item.checklist?.filter(c => c.completed).length ?? 0) : 0;
// render: <CheckSquare /> {checklistDone}/{checklistTotal}  when checklistTotal > 0
```

**Overdue date**:
```tsx
const isOverdue = date && new Date(date) < new Date() && !["Done","Published","Completed","Cancelled","Archived"].includes(column);
// render date chip with text-red-500 when isOverdue
```

**"Move to column" ⋯ context menu**:
```tsx
const [showMoveMenu, setShowMoveMenu] = useState(false);
const validColumns = COLUMN_OPTIONS_BY_TYPE[item._type]; // per-type allowed columns
// ⋯ button → dropdown of validColumns → calls onMoveToColumn(item, col)
```
Add prop `onMoveToColumn?: (item: MarcomWorkItem, col: ProjectsColumn) => void`

**Density sizing** — accept `density?: "compact"|"default"|"relaxed"` prop:
```typescript
const padClass = density === "compact" ? "p-2" : density === "relaxed" ? "p-4" : "p-3";
const titleClass = density === "compact" ? "text-[11px]" : density === "relaxed" ? "text-sm" : "text-xs";
```

**Per-card checkbox**:
```tsx
// accept: selected?: boolean; onToggleSelect?: (key: string) => void
// key = `${item._type}:${item.id}`
<button role="checkbox" aria-checked={selected} onClick={e => { e.stopPropagation(); onToggleSelect?.(key); }}
  className={cn("w-5 h-5 rounded border ...", selected ? "bg-indigo-500 border-indigo-500" : "border-slate-300 opacity-0 group-hover:opacity-100")}
>
  {selected && <Check className="w-3 h-3 text-white" />}
</button>
```

### Verification
- Content card with mediaUrl shows thumbnail
- Event card with checklist shows "2/5 ✓" pill
- Past-dated non-done item shows red date
- ⋯ menu opens with valid columns for each type
- Checkbox visible on hover, checked state correct
- `npm test` passes

---

## Phase 5 — Board: Quick-Create in Column + Bulk Action Bar

### New files
- `src/components/views/ProjectsView/ProjectsBulkActionBar.tsx`

### Changes to `ProjectsBoardColumn`
Add `onQuickCreate?: (type: MarcomWorkItemType, column: ProjectsColumn, title: string) => void` prop.
`+` button in column header → `isAddingItem` state → inline form:
- If column maps unambiguously to one type (Upcoming→event, To Do→placement) → no type picker shown
- Otherwise show three mini-icon buttons to pick type first, then title input
- Submit → call `onQuickCreate(type, column, title)` → parent does `POST /api/marcom/{type}`

### `ProjectsBulkActionBar.tsx`
Props: `selectedKeys: Set<string>; allItems: MarcomWorkItem[]; onClearSelection: () => void; onBulkDelete: (keys: Set<string>) => void; onBulkStatus: (keys: Set<string>, column: ProjectsColumn) => void`

Render when `selectedKeys.size > 0`:
```
[ N selected ] [ | ] [ Status: <dropdown of ProjectsColumn> ] [ Delete 🗑 ] [ × Clear ]
```
Delete: calls `DELETE /api/marcom/{type}/{id}` per item, then toast.success with undo.
Status: calls `handleDrop(item, targetColumn)` per item.

### Changes to `ProjectsBoardView`
- Add `selectedKeys: Set<string>` state
- Pass `selected`, `onToggleSelect` to each card
- Pass `onToggleSelectAll` to each column header
- Render `<ProjectsBulkActionBar>` at bottom

### Verification
- Click `+` in "Upcoming" column → no type picker, event title input only
- Click `+` in "In Progress" column → type picker appears
- Submit → item appears in correct column after refetch
- Select 2 cards → bulk bar appears → change status → both update
- Delete selected → items removed + undo toast
- `npm test` passes

---

## Phase 6 — List: Column Visibility, Sort Indicators, Group-By, Collapsible Groups

### Files to edit
- `src/components/views/ProjectsView/ProjectsListView.tsx`

### Sort header changes
Each sortable `<th>` becomes a button:
```tsx
<button onClick={() => handleSort("name")}>
  Name
  {sortField === "name" && (sortDir === "asc" ? <ArrowUp/> : <ArrowDown/>)}
  {sortField !== "name" && <ArrowUpDown className="opacity-0 group-hover:opacity-40"/>}
</button>
```
Active sort: show `×` clear button in toolbar.
Sort state: `viewPreferences.taskSortField` / `taskSortDirection` (reuse existing).

### Column visibility menu
"Columns" button → dropdown:
```
☑ Branch  ☑ PIC  ☑ Date  ☑ Checklist  ☐ Actions
```
Each toggle updates `viewPreferences.visibleFields`.

### Group-by toolbar
Segmented control: **Type** | **Status** | **Branch** | **PIC** | **None**

Group-by state in `viewPreferences` as `projectsGroupBy`.

### Collapsible groups
Each group row: `<button onClick={() => toggle(groupKey)}>▼ {label} ({count})</button>`
Collapsed state local (`Set<string>` of collapsed group keys).

### Verification
- Click "Name" header → asc arrow appears → click again → desc → click again → cleared
- "Columns" menu hides/shows Branch column correctly
- Group by "Branch" → rows grouped by branchName with count badges
- Clicking group header collapses/expands rows
- `npm test` passes

---

## Phase 7 — List: Inline Editing + Per-Row Checkbox + Bulk Bar

### Files to edit
- `src/components/views/ProjectsView/ProjectsListView.tsx`

### Inline editing

**Status cell**: `onClick` on status pill → absolute positioned dropdown listing valid statuses for `_type`:
- Content: PostStatus values
- Event: EventStatus values
- Placement: PlacementStatus values
On select → `PATCH /api/marcom/{type}/{id} { status }` → `updateCachedPost/Event/Placement`.

**Date cell**: `onClick` → replaces cell with `<input type="date" defaultValue={date}>`. On blur/Enter → PATCH.

**PIC cell**: `onClick` → popover of `users` list checkboxes (single-select). On pick → PATCH `{ picName: user.name }`.

**Name cell**: `onDoubleClick` → `<input>` with current name. On blur/Enter → PATCH `{ title }` or `{ name }`.

### Per-row checkbox + Bulk bar
Same `selectedKeys` state + `ProjectsBulkActionBar` as Board (reuse component).
Checkbox in first cell of each row. Select-all in header row.

### Verification
- Click status pill → dropdown appears → select → status updates in place
- Double-click name → edits inline → blur → saves
- Select 3 rows → bulk bar appears → delete → rows disappear
- `npm test` passes

---

## Phase 8 — Calendar: Status Colors, Overflow, Click-to-Create, Multi-Day Events

### Files to edit
- `src/components/views/ProjectsView/ProjectsCalendarView.tsx`

### Status color map
```typescript
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#64748B", IN_REVIEW: "#F59E0B", REVISION: "#EF4444",
  APPROVED: "#10B981", SCHEDULED: "#3B82F6", PUBLISHED: "#7B68EE",
  UPCOMING: "#3B82F6", ON_PROGRESS: "#F59E0B", COMPLETED: "#10B981", CANCELLED: "#EF4444",
  NOT_STARTED: "#64748B", DONE: "#10B981", ISSUE: "#EF4444",
};
```
Each chip:
```tsx
style={{ backgroundColor: `${color}18`, borderColor: `${color}40`, color }}
```

### Overflow cap
Per day cell: build `dayItems` array. Show first 3 chips. If more:
```tsx
{extra > 0 && (
  <button onClick={() => setOverflowDay(dayStr)} className="text-[10px] text-slate-500 ...">
    +{extra} more
  </button>
)}
```
`overflowDay` state → `<OverflowPopover>` listing all items for that day.

### Click-to-create
```tsx
onClick={() => setCreateDay(dayStr)}
// setCreateDay → shows <CreateDayPicker date={createDay} onClose={() => setCreateDay(null)} />
```
`CreateDayPicker`: three buttons `+ Content Post` / `+ Field Event` / `+ Placement` → opens relevant modal with date pre-filled.

### Multi-day FieldEvent spanning
When building `itemsByDate`, for FieldEvent with endDate:
```typescript
eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).forEach(d => {
  const key = format(d, "yyyy-MM-dd");
  itemsByDate.get(key)?.push({ ...event, _type: "event", _isSpanContinuation: d > start });
});
```
Continuation chips show `↳` prefix.

### Verification
- Content post chip shows purple-ish color (PUBLISHED=#7B68EE)
- Day with 5 items shows 3 chips + "+2 more" button
- Click "+2 more" → popover with all 5 items
- Click empty day → type picker popover
- Field event spanning 3 days shows on all 3 days
- `npm test` passes

---

## Phase 9 — Gantt: Drag-Reschedule + Edge Resize + Progress Drag

### Files to edit
- `src/components/views/ProjectsView/ProjectsGanttView.tsx`

### DragState type
```typescript
interface GanttDragState {
  type: "move" | "resize-start" | "resize-end" | "progress";
  itemKey: string;         // `${_type}:${id}`
  startX: number;
  initialStartDate: Date;
  initialEndDate: Date;
  initialProgress: number;
  barLeft: number;
  barWidth: number;
  deltaDays: number;
  liveProgress: number;
}
```

### Drag handlers (port from old GanttView.tsx, replace Task refs)

`startDrag(e, item, type, barLeft, barWidth)` — `setDragState({...})`

Global `useEffect` on `dragState`:
- `pointermove` → compute deltaDays or liveProgress, call `setDragState(prev => ({...prev, deltaDays}))`
- `pointerup`:
  - `move` → PATCH date fields per `_type`:
    - event: `{ startDate, endDate }`
    - content: `{ publishDate }`
    - placement: `{ date }`
  - `resize-start` / `resize-end` → event only: PATCH `{ startDate }` or `{ endDate }`
  - `progress` → PATCH `{ progress }` (event only — ContentPost progress is derived)

### Bar layout function
```typescript
function getBarLayout(item: MarcomWorkItem): { left: number; width: number; progress: number }
```
- FieldEvent: left = diff(startDate, viewStart), width = diff(endDate, startDate) + 1
- ContentPost: left = diff(publishDate, viewStart), width = 1
- Placement: left = diff(date, viewStart), width = 1
- Apply deltaDays live from dragState

### Bar handles rendering
- Left 10px `div` → `cursor-ew-resize` → `startDrag(resize-start)` — FieldEvent only
- Right 10px `div` → `cursor-ew-resize` → `startDrag(resize-end)` — FieldEvent only
- Inner progress circle — FieldEvent only
- Body → `cursor-grab` → `startDrag(move)` — all types

### Verification
- Drag FieldEvent bar → dates update after pointerup
- Drag left edge → startDate changes, endDate unchanged
- Drag right edge → endDate changes, startDate unchanged
- Drag progress circle → live progress updates, PATCH on release
- Drag ContentPost marker → publishDate shifts
- `npm test` passes

---

## Phase 10 — Gantt: Unscheduled Shelf + Collapsible Sidebar

### Files to edit
- `src/components/views/ProjectsView/ProjectsGanttView.tsx`

### Collapsible sidebar
Add `isSidebarCollapsed` state.
"Hide Tasks" / "Show Tasks" toggle button in Gantt toolbar.
Left sidebar div: `{!isSidebarCollapsed && <div className="w-72 ...">...</div>}`

### Unscheduled shelf
Separate `unscheduledItems` = items with no date field set.
Bottom panel (always visible):
```tsx
{unscheduledItems.length > 0 && (
  <div className="p-3 border-t ...">
    <span>Unscheduled ({unscheduledItems.length}):</span>
    {unscheduledItems.slice(0,5).map(item => (
      <button onClick={() => setSchedulingItem(item)}>+ {getWorkItemTitle(item)}</button>
    ))}
  </div>
)}
```
`schedulingItem` state → `<DatePickerPopover>` → on confirm → PATCH date field → item joins timeline.

### Verification
- "Hide Tasks" hides the left sidebar
- Items without dates appear in shelf
- Click shelf item → date picker → confirm → item appears on timeline
- `npm test` passes

---

## Phase 11 — Wire FilterBar into TopNav + Connect Views

### Files to edit
- `src/components/layout/TopNav.tsx`
- `src/components/views/ProjectsView/ProjectsBoardView.tsx`
- `src/components/views/ProjectsView/ProjectsListView.tsx`
- `src/components/views/ProjectsView/ProjectsCalendarView.tsx`
- `src/components/views/ProjectsView/ProjectsGanttView.tsx`

### TopNav changes
```tsx
const appMode = useWorkspaceStore(s => s.appMode);
// ...
{appMode === "tasks" && <ProjectsFilterBar />}
```
Remove old `isFilterBarOpen` logic if still present.

### Each Projects view
Import `useWorkspaceStore` → read `projectsFilters`.
Apply `applyProjectsFilters(allItems, projectsFilters)` before rendering.

### Verification
- Type "campus" in search → only items with "campus" in name shown across Board/List
- Select "Event" type filter → only event cards shown
- Select a branch → only that branch's items shown
- "Clear All" → all items back
- `npm test` passes

---

## Phase 12 — Wire viewPreferences to Board Density + List Columns

### Files to edit
- `src/components/views/ProjectsView/ProjectsBoardView.tsx`
- `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx`
- `src/components/views/ProjectsView/ProjectsListView.tsx`

### Board density
In `ProjectsBoardView`:
```tsx
const viewPreferences = useWorkspaceStore(s => s.viewPreferences);
// pass density={viewPreferences.density} to each ProjectsWorkItemCard
```

### List column visibility
In `ProjectsListView`:
```tsx
const { visibleFields } = viewPreferences;
// conditionally render Branch/PIC/Date/Checklist columns based on visibleFields
```

### Verification
- Switch density in settings → board cards change padding immediately
- Hide "Branch" from Columns menu → Branch column disappears from List
- `npm test` passes

---

## Phase 13 — Tests

### New test files
- `src/lib/marcom/projectsFilters.test.ts` — unit tests for `applyProjectsFilters`

### Test cases for `projectsFilters.test.ts`
```
✓ returns all items when filters are default (empty)
✓ search filters by name/title (case-insensitive)
✓ type filter hides non-matching _type items
✓ column filter shows only items in selected columns
✓ branch filter by branchName
✓ PIC filter by picName
✓ dateFrom excludes items before range
✓ dateTo excludes items after range
✓ combined filters are AND-ed together
✓ empty result when no items match
```

### Verification
```bash
npm test
# All 13 tests must pass with 0 failures
```

---

## Quick File Reference

### New files created
- `src/lib/marcom/projectsFilters.ts`
- `src/lib/marcom/projectsFilters.test.ts`
- `src/components/layout/ProjectsFilterBar.tsx`
- `src/components/views/ProjectsView/ProjectsBulkActionBar.tsx`

### Files edited
- `src/components/views/ProjectsView/ProjectsBoardView.tsx` (phases 2, 3, 5)
- `src/components/views/ProjectsView/ProjectsBoardColumn.tsx` (phases 2, 5)
- `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx` (phase 4)
- `src/components/views/ProjectsView/ProjectsListView.tsx` (phases 6, 7, 12)
- `src/components/views/ProjectsView/ProjectsCalendarView.tsx` (phase 8)
- `src/components/views/ProjectsView/ProjectsGanttView.tsx` (phases 9, 10)
- `src/components/layout/TopNav.tsx` (phase 11)
- `src/lib/store/slices/createUiSlice.ts` (phase 1 — add projectsFilters state)
