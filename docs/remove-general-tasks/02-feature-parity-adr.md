# ADR: Projects View Feature Parity — Restore Lost Features for MarcomWorkItem

**Date:** 2026-10-30
**Status:** Proposed
**Context:** After removing general tasks and repurposing the Projects view for
MarcomWorkItem (ContentPost + FieldEvent + Placement), a diff against the old
task-based views reveals significant UX regressions. This ADR decides which
features to restore, which to adapt, and which to intentionally drop.

---

## Feature Gap Inventory

### Board View

| Old Feature | New State | Decision |
|---|---|---|
| Keyboard drag (KeyboardSensor + sortableKeyboardCoordinates) | Missing | RESTORE — accessibility requirement |
| Custom collision detection (pointerWithin + closestCenter fallback) | Simplified to closestCenter only | RESTORE — prevents jitter on edge cases |
| Animated drop line indicator (blue dot + line) between cards | Missing | RESTORE — critical drag UX cue |
| Within-column card reordering (SortableContext per column) | Missing — only cross-column drag | RESTORE |
| "Move to status" context menu on each card (⋯ button) | Missing | RESTORE — non-drag alternative (WCAG 2.2) |
| Quick-add card inline in column (+ button → inline input) | Missing | RESTORE as "Quick-create" → opens mini form scoped to entity type |
| Per-column select-all checkbox | Missing | RESTORE |
| Bulk action bar (status, assignee, priority, due date, delete) | Missing | RESTORE adapted: bulk status change per entity type |
| Media thumbnail on card (video/image preview) | Missing | RESTORE for content cards (ContentPost.mediaUrl) |
| Assignee avatar group on card | Present (PIC name only) | UPGRADE — show full UserAvatar group for all types |
| Subtask / checklist progress count on card | Missing | RESTORE for content (subtasks) and events (checklist) |
| Overdue date highlight (red date) | Missing | RESTORE — check against today for all date fields |
| Real-time presence avatars on card | Dropped — no TaskItem basis | ACCEPT DROP — marcom entities have no presence tracking |
| Drag overlay ghost with tilt + ring | Present | OK |
| Screen-reader aria-live announcements during drag | Missing | RESTORE — accessibility |

### List View

| Old Feature | New State | Decision |
|---|---|---|
| Inline status change dropdown per row | Missing — status shown read-only | RESTORE — click status → dropdown |
| Inline assignee toggle per row | Missing | RESTORE — click PIC → user picker |
| Inline priority picker per row | N/A (no Priority on marcom) | ADAPT — replace with entity-specific field (PostStatus detail / EventType / PlacementBrand) |
| Inline due-date edit per row | Missing | RESTORE — click date → date input |
| Column visibility toggle (Columns menu) | Missing | RESTORE |
| Sortable column headers with asc/desc + active indicator | Partial (sortable but no indicator) | RESTORE |
| Group By: status / priority / assignee | Missing | RESTORE adapted: group by Type / Status / Branch / PIC |
| Collapsible group rows with count badge | Missing | RESTORE |
| Per-row select checkbox | Missing | RESTORE |
| Select-all toolbar with bulk actions | Missing | RESTORE |
| Inline "Add item" row at bottom of each group | Missing | RESTORE adapted: "New Content / Event / Placement" per group |
| Comments count column | Present in old, missing in new | RESTORE for content (comments from ContentPost) |
| Overdue row highlight | Missing | RESTORE |

### Calendar View

| Old Feature | New State | Decision |
|---|---|---|
| Click empty day → quick-create task modal | Missing | RESTORE adapted: click empty day → type picker (Content / Event / Placement) |
| Double-click day → create task | Missing | RESTORE as double-click → type picker |
| "Today" pill badge on current day | Present | OK |
| Items-per-day count badge | Present | OK |
| Status-colored chips (backgroundColor from status.color) | Missing — type-colored border only | RESTORE — chips colored by entity's own status color |
| Marketing toggle overlay (Events + MOUs from marcomDataStore) | Present in old calendar | ACCEPT DROP — all items are now marcom; no separate overlay needed |
| Hover chip shows full title tooltip | Missing | RESTORE |
| Chips overflow handled (max N shown + "+X more") | Missing | RESTORE |

### Gantt View

| Old Feature | New State | Decision |
|---|---|---|
| Drag bar to reschedule (move startDate + endDate) | Missing — click only | RESTORE for FieldEvent (has startDate + endDate) |
| Drag left edge to resize start date | Missing | RESTORE for FieldEvent |
| Drag right edge to resize end date | Missing | RESTORE for FieldEvent |
| Drag inner circle to adjust progress % | Missing | RESTORE — use event.progress or content subtask progress |
| Dependency lines (curved SVG arrows between bars) | Missing | ACCEPT DROP — marcom entities have no dependency concept |
| Dependency connector drag (draw links) | Missing | ACCEPT DROP |
| Keyboard accessibility zoom controls | Partial | RESTORE |
| Unscheduled items shelf (bottom panel) | Missing | RESTORE — items without dates listed for scheduling |
| Collapsible left task-list sidebar | Missing | RESTORE |
| Zoom levels: day / week / month | Present | OK |
| Today vertical marker line | Present | OK |
| Weekend column shading | Present | OK |
| Quick-add to timeline input | Missing | RESTORE adapted: "Add to timeline" opens type picker |
| Priority badge on sidebar rows | N/A (no Priority) | ADAPT — show type badge instead |
| Screen-reader announcements | Missing | RESTORE |

### Global Features

| Old Feature | New State | Decision |
|---|---|---|
| Global FilterBar (search, priority, status, tag, assignee, show-closed) | Deleted | RESTORE adapted: global filter bar for Projects views with type / status / branch / PIC / date-range filters |
| View preferences persistence (density, visible columns, sort) | Partial (store state exists, not wired to new views) | RESTORE |
| Density setting (compact / default / relaxed) on Board cards | Missing | RESTORE |

---

## Decisions

### ADR-P1: Restore Drag-to-Reorder Within Columns on Board
Use `SortableContext` per column (same as old BoardColumn). On drop, reorder is local-only — marcom entities have no `orderIndex` field. Persist local order in `viewPreferences.projectsBoardOrder` (Map<column, id[]>).

### ADR-P2: Restore Animated Drop-Line Indicator
Port `DropLineIndicator` component from old `BoardColumn.tsx` verbatim. It has no task dependencies.

### ADR-P3: Restore Keyboard Drag (KeyboardSensor)
Add `KeyboardSensor` + `sortableKeyboardCoordinates` to ProjectsBoardView. Zero task dependencies.

### ADR-P4: Restore "Move to Column" Context Menu on Cards
Add `⋯` button to `ProjectsWorkItemCard` that opens an inline dropdown of valid target columns for this card's entity type. On select, fires same PATCH as drag. WCAG 2.2 compliant alternative to drag.

### ADR-P5: Restore Quick-Create in Board Column
`+` button in column header → small inline form. Entity type is inferred from column:
- "In Progress / Ready / Done / Archived" columns → show type picker (Content / Event / Placement)
- "Upcoming" column → defaults to FieldEvent
- "To Do" column → defaults to Placement

### ADR-P6: Restore Bulk Action Bar
Multi-select checkboxes on cards + floating `BulkActionBar`. Actions: **Bulk status change** (per type — invalid cross-type column moves silently skipped) + **Bulk delete** (soft-delete to marcom trash, recoverable). No bulk priority/assignee (marcom entities have PIC, not multi-assignee).

### ADR-P7: Restore Media Thumbnail on Content Cards
`ContentPost.mediaUrl` → show `<img>` or `<video>` thumbnail on content-type cards only.

### ADR-P8: Restore Checklist Progress on Cards
Content cards: `(completedSubtasks / totalSubtasks)` pill. Event cards: `(completedChecklist / totalChecklist)` pill.

### ADR-P9: Restore Overdue Date Highlights
Any work item whose date field is in the past and status is not Done/Published/Completed → render date in red.

### ADR-P10: Restore List View Inline Editing
Click status pill → dropdown. Click date → `<input type="date">`. Click PIC name → user picker from `users` list. All inline edits fire `PATCH` to relevant API.

### ADR-P11: Restore List View Column Visibility + Sort Indicators
Port `Columns` visibility toggle menu and active sort indicator (arrow up/down + clear × button) from old ListView.

### ADR-P12: Restore Group-By on List View
Group by: Type (default) / Status (unified column label) / Branch / PIC. Groups are collapsible. Each group header has count badge and "Add item" button.

### ADR-P13: Restore Calendar Chip Status Coloring
Replace type-border-only chips with status-colored chips (background from each entity's status color palette).

### ADR-P14: Restore Calendar Click-to-Create
Click empty day → mini type picker popover → opens relevant create modal pre-filled with the clicked date.

### ADR-P15: Restore Gantt Drag-Resize for FieldEvent
FieldEvent has `startDate` + `endDate` → full drag-reschedule, left/right edge resize, progress drag using event.progress. ContentPost and Placement have single dates → drag to change that date only (no resize handles).

### ADR-P16: Restore Gantt Unscheduled Shelf
Items without dates appear in a bottom shelf. Click an item → date picker → schedules it.

### ADR-P17: Restore Projects FilterBar
New `ProjectsFilterBar` component replaces old `FilterBar`. Filters: search (title/name), entity type (All/Content/Event/Placement), status (unified column), branch, PIC, date range. Rendered in TopNav when appMode === "tasks".

### ADR-P18: Restore View Density + View Preferences Wiring
Wire existing `viewPreferences.density` to ProjectsBoardView card sizing. Wire `viewPreferences.visibleFields` to ProjectsListView column visibility.

### ADR-P19: Drop Real-Time Presence Avatars
Task-based `presenceByTaskId` had a realtime WebSocket. MarcomWorkItem has no presence concept. Intentional drop.

### ADR-P20: Drop Task Dependency Lines on Gantt
Marcom entities have no blocking/dependency relationships. Dependency SVG layer not restored.
