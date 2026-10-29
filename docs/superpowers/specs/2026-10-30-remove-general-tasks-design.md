# Spec: Remove General Tasks — Repurpose Projects View for Marcom Hub

**Date:** 2026-10-30  
**Status:** Draft  
**Related ADR:** `docs/remove-general-tasks/adr.md`

---

## 1. Goal

Remove the general-purpose task system from the application. Repurpose the existing Board/List/Gantt/Calendar views (currently "Projects mode") to render **ContentPostItem** entities from the Marcom Hub Content Planner. The result is a single-mode application entirely focused on Marcom operations.

---

## 2. Current State (What Exists)

### Two-Mode Architecture
```
AppMode = "tasks" | "marcom"

Tasks mode:
  activeView: home | list | board | calendar | gantt | channel
  Data: SpaceItem → FolderItem → ListItem → TaskItem (Prisma)
  Store: createTaskSlice, createSpaceSlice, createDataSlice
  Components: src/components/tasks/, src/components/views/{BoardView,ListView,GanttView,CalendarView,ChannelView}/

Marcom mode:
  activeView: pipeline | content-planner | events | placements | mous | branches | outlets | documents | reports | analytics
  Data: ContentPost, FieldEvent, Placement, Mou, Branch, Outlet, ... (Prisma)
  Store: marcomDataStore (separate Zustand store)
  Components: src/components/views/{ContentPlannerView,EventsView,PlacementsView,...}/
```

### Bridge (to be deleted)
- `Task.relatedMarcomId` + `Task.relatedMarcomType` — FK + discriminator
- `syncFieldEventOnTaskStatusChange` — Task status change → PATCH FieldEvent
- `syncTaskOnPlacementStatusChange` / `syncPlacementOnTaskStatusChange` — bidirectional placement ↔ task sync
- `buildEventTaskPayload` / `buildPlacementTaskPayload` — creates a Task from a marcom entity
- "Track as Task" / "View on Board" buttons in Marcom views

---

## 3. Target State (What We Want)

### Single-Mode Architecture
```
AppMode: removed (no switcher, no "tasks" concept)

Unified navigation (always Marcom Hub):
  Work Items:  content-planner | events | placements | mous
  Master Data: branches | outlets | documents | reports | analytics
  Pipeline:    pipeline

Content Planner sub-views (repurposed task views):
  board       → Kanban by PostStatus
  list        → Sortable table/list by PostStatus/date
  calendar    → Month calendar by publishDate
  gantt       → Timeline by publishDate range
```

### What Survives (Adapted)
| Old Component | New Purpose | Key Changes |
|---|---|---|
| `BoardView` | `ContentBoardView` — Kanban for ContentPost | Columns = PostStatus values; cards = ContentPost cards |
| `ListView` | `ContentListView` — table/list for ContentPost | Rows = ContentPost rows; columns = platform, status, date, PIC |
| `CalendarView` | `ContentCalendarView` — calendar for ContentPost | Events positioned by `publishDate` |
| `GanttView` | `ContentGanttView` — timeline for ContentPost | Bars keyed to `publishDate` (single-day, no endDate) |

### What Is Deleted
| Category | Items |
|---|---|
| Prisma models | `SpaceItem`, `FolderItem`, `ListItem`, `TaskItem`, `TaskCommentItem` |
| API routes | `src/app/api/tasks/` (entire directory) |
| Store slices | `createTaskSlice`, `createSpaceSlice`, `createAutomationSlice` |
| Store state | `tasks`, `spaces`, `tags`, `selectedTaskId`, `selectedTaskIds`, `trash`, `automations`, `channelMessages`, `lastTaskView` |
| Components | `src/components/tasks/` (entire directory) |
| Views | `src/components/views/ChannelView/` |
| Task view files | `BoardView.tsx`, `BoardColumn.tsx`, `BoardCard.tsx`, `ListView.tsx`, `ListGroup.tsx`, `ListTaskRow.tsx`, `GanttView.tsx`, `CalendarView.tsx` — replaced by content equivalents |
| Lib files | `src/lib/tasks/eventTaskSync.ts`, `placementTaskSync.ts`, `targetSpaceList.ts`, `taskSync.ts`, `taskStatusValidator.ts`, `taskQuery.ts`, `taskColumns.ts`, `taskSort.ts`, `filterTasks.ts`, `dateUtils.ts`, `deleteUndo.ts`, `inlineEditing.ts`, `openTasksCount.ts` |
| Layout | `AppModeSegmentedControl.tsx` (mode switcher removed), `ViewSwitcher.tsx` (repurposed for content sub-views only), `FilterBar.tsx` (task filter bar deleted) |
| Type definitions | `Task`, `Subtask`, `Space`, `Folder`, `List`, `Status`, `Tag`, `TaskComment`, `ActivityLog`, `TaskAttachment`, `Priority`, `RelatedMarcomType` from `src/types/index.ts` |
| Automations | `src/lib/automations/scheduler.ts`, `createAutomationSlice.ts` |

---

## 4. Content Board View Spec (Repurposed Board)

### Column Definition
Columns are fixed `PostStatus` values in workflow order:
```
DRAFT → IN_REVIEW → REVISION → APPROVED → SCHEDULED → PUBLISHED
```
(ARCHIVED hidden by default, togglable)

### Card Layout
Each card shows:
- Platform icon + platform label badge (top-left)
- Format badge (top-right) — Reel / Carousel / Image / Story / Article / Thread
- Post title (bold, clickable → opens ContentDrawer)
- Branch name (small, muted)
- Publish date (calendar icon)
- PIC name (avatar initials or photo)
- Checklist progress pill (e.g. "3/5 ✓") if subtasks exist
- Media thumbnail if `mediaUrl` is set

### Drag Interaction
- Drag a card between columns → fires `PATCH /api/marcom/content/{id} { status: newStatus }`
- Validates transition via `canTransitionContentStatus(from, to)` — existing function in `contentWorkflow.ts`
- On invalid transition: snap back + toast.error with allowed transitions

### No Space/List Concept
Cards are not grouped by Space or List. The only grouping dimension is `PostStatus`.

---

## 5. Content List View Spec (Repurposed List)

A sortable, filterable table equivalent to the existing `MarcomTableShell`-based `ContentPlannerView` table — essentially what already exists. The current table view in ContentPlannerView IS the List view.

**No new work required** — this view already exists as the "table" sub-view of ContentPlannerView.

---

## 6. Content Calendar View Spec (Repurposed Calendar)

- Month grid (same layout as existing `CalendarView`)
- Posts positioned by `publishDate`
- Post chip shows: platform icon + truncated title + status color dot
- Click chip → opens ContentDrawer
- Click empty day → opens CreatePostModal with `publishDate` pre-filled
- No drag-to-reschedule in v1 (too complex, not needed)

---

## 7. Content Gantt/Timeline View Spec (Repurposed Gantt)

- Horizontal date axis (week / month zoom)
- Each row = one ContentPost
- Bar positioned at `publishDate` (single-day bar, no end date for content)
- Bar color = PostStatus color
- Grouped by `platform` (Instagram / TikTok / YouTube / etc.) as row groups
- Click bar → opens ContentDrawer

---

## 8. Navigation Changes

### Sidebar (Before → After)
```
Before:
  [Projects]    [Marcom Hub]   ← mode switcher (DELETED)
  
  In tasks mode:
    Spaces
      ├── Field Ops
      │     └── Field Events List
      └── Content
            └── Content Planner List

  In marcom mode:
    Work Items:  Pipeline | Content Planner | Events | Placements | MOUs
    Master Data: Branches | Outlets | Documents | Reports | Analytics

After:
  (No mode switcher)
  
  Work Items:  Content Planner | Events | Placements | MOUs
  Master Data: Pipeline | Branches | Outlets | Documents | Reports | Analytics
```

### Content Planner Sub-View Switcher
Inside `ContentPlannerView`, a horizontal tab strip (like the old `ViewSwitcher`) with:
```
[Board] [List] [Calendar] [Timeline]
```
This is the ONLY place the Board/List/Calendar/Gantt affordances survive.

### TopNav / GlobalRail
- `AppModeSegmentedControl` removed from Sidebar header
- GlobalRail: remove mode mini-toggles; keep Home, Calendar (→ content calendar), AI, Users, More
- `FilterBar` (task-specific global filter): deleted
- `ViewSwitcher` (top nav task view tabs): deleted or repurposed as content sub-view tabs inside ContentPlannerView

---

## 9. Store Architecture Changes

### Removed Slices
- `createTaskSlice` — all task CRUD, marcom sync hooks, trash
- `createSpaceSlice` — spaces/folders/lists/statuses hierarchy
- `createAutomationSlice` — automation rules/runs/channel messages

### Removed State in `createDataSlice`
- `tasks: Task[]` — removed
- `spaces: Space[]` — removed
- `fetchServerTasks()` — removed
- `reconcileTasks()` — removed

### Removed State in `createUiSlice`
- `appMode` — removed
- `lastTaskView` — removed
- `setAppMode()` — removed
- `isCreateTaskModalOpen` — removed
- `isAddViewModalOpen` — removed
- `isAutomationsModalOpen` — removed
- `isAgentsModalOpen` — removed
- `MARCOM_VIEW_SET` constant — simplified (all views are now marcom)
- `setActiveView()` — simplified, no more mode auto-derivation

### Surviving Store State
```typescript
// createDataSlice — keeps:
users: User[]
fetchServerData(): Promise<void>  // only fetches users now

// createUiSlice — keeps:
activeView: ViewMode         // content-planner | board | list | calendar | gantt | events | ...
marcomFilters: Record<string, string>
viewPreferences: ViewPreferences
isCreatePostModalOpen: boolean
setCreatePostModalOpen(open: boolean): void
setMarcomFilter(view, value): void
setActiveView(view): void     // simplified, no mode switching
```

---

## 10. Type System Changes

### Types Deleted from `src/types/index.ts`
```typescript
// Deleted:
Task, Subtask, Space, Folder, List, Status, Tag, TaskComment,
ActivityLog, TaskAttachment, Priority, RelatedMarcomType,
AppMode (or simplified to just string literal of marcom views)
```

### Types Modified
```typescript
// ViewMode — remove task-only views, keep marcom + content sub-views:
type ViewMode =
  | "content-planner" | "board" | "list" | "calendar" | "gantt"
  | "events" | "placements" | "mous" | "pipeline"
  | "branches" | "outlets" | "documents" | "reports" | "analytics";

// FieldEventItem — no change (checklist/progress already added)
// ContentPostItem — no change  
// MarcomPlacement — no change
```

---

## 11. API Changes

### Deleted API Routes
- `DELETE src/app/api/tasks/` (entire directory — 3 files)

### Modified API Routes
- None required for phase 1 (the repurposed views use existing `/api/marcom/content/` endpoints)

### Unchanged API Routes
- All `/api/marcom/` routes survive intact

---

## 12. Database Migration

Single destructive migration `drop_task_models`:
```sql
DROP TABLE IF EXISTS "TaskCommentItem";
DROP TABLE IF EXISTS "TaskItem";
DROP TABLE IF EXISTS "ListItem";
DROP TABLE IF EXISTS "FolderItem";
DROP TABLE IF EXISTS "SpaceItem";
```

Run after all TypeScript consumers are removed and confirmed clean.

---

## 13. What Does NOT Change

- All Marcom Hub views: ContentPlannerView, EventsView, PlacementsView, MousView, BranchesView, OutletsView, PipelineView, DocumentsView, ReportsView, AnalyticsView
- All marcom API routes (`/api/marcom/*`)
- `marcomDataStore` Zustand store
- All marcom types (ContentPostItem, FieldEventItem, MarcomPlacement, Mou, Branch, Outlet, etc.)
- `EventChecklistSection` and the native checklist on FieldEvent
- Auth, settings, notifications, command palette, AI drawer, export center
- All existing tests that do not reference TaskItem, task store, or task API

---

## 14. Out of Scope

- Rich-text editing (TiptapEditor) — deleted with TaskDrawer; ContentDrawer uses plain textarea for captions
- Automation rules — deleted entirely, no replacement in v1
- Task comments / activity log — deleted with TaskItem; ContentDrawer already has its own notes field
- Real-time multi-user sync for tasks (`/api/realtime/` broadcastTaskUpsert) — can be kept for future marcom use or removed
