# Implementation Plan: Remove General Tasks — Repurpose Projects Board for Marcom Work Items

**Date:** 2026-10-30
**Related:** adr.md, spec.md

---

## Phases Overview

| # | Phase | What | Risk |
|---|-------|------|------|
| 1 | Add MarcomWorkItem types + utility functions | Low |
| 2 | Build ProjectsBoardView (ContentPost+Event+Placement Kanban) | High |
| 3 | Build ProjectsListView (unified table) | Medium |
| 4 | Build ProjectsCalendarView (three entities by date) | Medium |
| 5 | Build ProjectsGanttView (timeline with three groups) | Medium |
| 6 | Wire new views into page.tsx + update mode switcher | Medium |
| 7 | Remove bridge code from all marcom views | Medium |
| 8 | Remove AppMode task store reads + unify sidebar | Medium |
| 9 | Delete task store slices | High |
| 10 | Delete task UI components + task view files | Low |
| 11 | Delete task API routes | Low |
| 12 | Delete src/lib/tasks/ directory | Low |
| 13 | Drop Prisma task models (migration) | High |
| 14 | Remove Task types from src/types/index.ts | Medium |
| 15 | Fix tests | Medium |

**Rule:** Run `npm test` after each phase. Never delete a file until grep confirms zero consumers.

---

## Phase 1 — Add MarcomWorkItem Types + Utility Functions

**Files to create:**
- `src/lib/marcom/workItems.ts` — unified type + column mapping utilities

**Files to edit:**
- `src/types/index.ts` — add `MarcomWorkItemType`, `MarcomWorkItem`, `ProjectsColumn`

### src/lib/marcom/workItems.ts contents:
```typescript
import type { ContentPostItem, FieldEventItem, MarcomPlacement } from "@/types";

export type MarcomWorkItemType = "content" | "event" | "placement";

export type MarcomWorkItem =
  | (ContentPostItem  & { _type: "content" })
  | (FieldEventItem   & { _type: "event" })
  | (MarcomPlacement  & { _type: "placement" });

export type ProjectsColumn =
  | "Upcoming" | "To Do" | "In Progress" | "Ready"
  | "Done" | "Blocked" | "Cancelled" | "Archived";

export const PROJECTS_COLUMN_ORDER: ProjectsColumn[] = [
  "Upcoming", "To Do", "In Progress", "Ready",
  "Done", "Blocked", "Cancelled", "Archived",
];

export function getWorkItemColumn(item: MarcomWorkItem): ProjectsColumn {
  switch (item._type) {
    case "content":
      if (["DRAFT","IN_REVIEW","REVISION"].includes(item.status)) return "In Progress";
      if (["APPROVED","SCHEDULED"].includes(item.status)) return "Ready";
      if (item.status === "PUBLISHED") return "Done";
      return "Archived";
    case "event":
      if (item.status === "UPCOMING") return "Upcoming";
      if (item.status === "ON_PROGRESS") return "In Progress";
      if (item.status === "COMPLETED") return "Done";
      return "Cancelled";
    case "placement":
      if (item.status === "NOT_STARTED") return "To Do";
      if (item.status === "ON_PROGRESS") return "In Progress";
      if (item.status === "DONE") return "Done";
      return "Blocked";
  }
}

export function getWorkItemTitle(item: MarcomWorkItem): string {
  if (item._type === "content") return item.title;
  if (item._type === "event") return item.name;
  return `${item.material?.name ?? "Placement"} @ ${item.outlet?.name ?? ""}`;
}

export function getWorkItemDate(item: MarcomWorkItem): string | null | undefined {
  if (item._type === "content") return item.publishDate;
  if (item._type === "event") return item.startDate ?? item.date;
  return item.date;
}

export function getWorkItemPic(item: MarcomWorkItem): string | undefined {
  return item.picName ?? undefined;
}
```

### Verification
- `grep -n "MarcomWorkItem" src/lib/marcom/workItems.ts` — all exports present
- No imports from lib/tasks

---

## Phase 2 — Build ProjectsBoardView

**File to create:** `src/components/views/ProjectsView/ProjectsBoardView.tsx`

**Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable` (already in project for BoardView)

### Component structure:
```
ProjectsBoardView
  props: { posts, events, placements, onUpdatePost, onUpdateEvent, onUpdatePlacement }
  
  - Build workItems: MarcomWorkItem[] from all three arrays
  - Group by getWorkItemColumn() → Map<ProjectsColumn, MarcomWorkItem[]>
  - Render PROJECTS_COLUMN_ORDER columns (skip empty unless pinned)
  - Each column: ProjectsBoardColumn
      - Header: column name + count badge
      - Cards: ProjectsWorkItemCard per item
  
ProjectsBoardColumn
  props: { column, items, onDrop }
  - DndKit droppable zone
  - Renders ProjectsWorkItemCard list

ProjectsWorkItemCard
  props: { item }
  - Type badge: "Content"(pink) / "Event"(blue) / "Placement"(emerald)
  - Title (getWorkItemTitle)
  - Sub-line: platform+format / eventType+branch / brand+dimensions
  - Date chip (getWorkItemDate)
  - PIC name
  - Click → opens relevant drawer (via callback prop onSelectItem)
```

### Drag handler:
```typescript
async function handleDrop(item: MarcomWorkItem, targetColumn: ProjectsColumn) {
  // map column → entity-specific status
  // PATCH to correct API endpoint
  // update marcomDataStore cache
}
```

### Verification
- Board renders cards for all three entity types
- Drag updates status via correct API endpoint
- Type filter (All/Content/Events/Placements) hides/shows cards
- npm test passes

---

## Phase 3 — Build ProjectsListView

**File to create:** `src/components/views/ProjectsView/ProjectsListView.tsx`

### Columns (using existing MarcomTableShell):
- Type badge | Title/Name | Status | Date | Branch | PIC | Actions

### Data:
```typescript
const rows: MarcomWorkItem[] = [
  ...posts.map(p => ({ ...p, _type: "content" as const })),
  ...events.map(e => ({ ...e, _type: "event" as const })),
  ...placements.map(p => ({ ...p, _type: "placement" as const })),
];
```

### Sortable by: Type, Status, Date, Branch
### Click row → opens relevant drawer/modal per _type

### Verification
- All three entity types appear as rows
- Sort works
- Click opens correct drawer per type

---

## Phase 4 — Build ProjectsCalendarView

**File to create:** `src/components/views/ProjectsView/ProjectsCalendarView.tsx`

Copy structure from existing `CalendarView.tsx`, replace Task with MarcomWorkItem:

- ContentPost → positioned at `publishDate`
- FieldEvent → spans `startDate` to `endDate` (multi-day highlight)
- Placement → positioned at `date`

Chip style:
- Pink border = content
- Blue border = event  
- Emerald border = placement
- Click chip → opens relevant drawer

### Verification
- Items appear on correct dates
- Multi-day events span correctly
- Empty days clickable (no crash)

---

## Phase 5 — Build ProjectsGanttView

**File to create:** `src/components/views/ProjectsView/ProjectsGanttView.tsx`

Copy structure from existing `GanttView.tsx`, replace Task with MarcomWorkItem:

Three row groups:
1. **Field Events** — bars from `startDate` to `endDate`, color = EventStatus
2. **Content Posts** — single-day markers at `publishDate`, color = PostStatus
3. **Placements** — single-day markers at `date`, color = PlacementStatus

Missing dates: skip item silently (don't crash).

### Verification
- All three groups render
- Items without dates don't crash
- Zoom (week/month) works

---

## Phase 6 — Wire New Views into page.tsx + Update Mode Switcher

**Files to edit:**
- `src/app/page.tsx`
- `src/components/layout/AppModeSegmentedControl.tsx`
- `src/components/layout/ViewSwitcher.tsx`
- `src/lib/store/slices/createUiSlice.ts`

### page.tsx changes:
- Add dynamic imports for `ProjectsBoardView`, `ProjectsListView`, `ProjectsCalendarView`, `ProjectsGanttView`
- Replace old `<BoardView>`, `<ListView>`, `<CalendarView>`, `<GanttView>` with new Projects versions
- Keep all marcom view renders unchanged
- Old task views still imported temporarily (delete in Phase 10)

### createUiSlice.ts changes:
- Rename `lastTaskView` → `lastProjectsView`
- In `setAppMode("tasks")` → change to `setAppMode("projects")`
- `MARCOM_VIEW_SET` — `board|list|calendar|gantt` remain as Projects views (excluded from marcom set)

### AppModeSegmentedControl.tsx:
- Change label from "Projects" to "Projects" (no change needed)
- Internal `"tasks"` string → `"projects"` (if used as AppMode value)

### ViewSwitcher.tsx:
- In tasks/projects mode: show `board | list | calendar | gantt` tabs only
- Remove `channel` tab (ChannelView being deleted)
- Remove `home` tab (HomeView being deleted)

### Verification
- Clicking "Projects" tab → shows ProjectsBoardView with marcom cards
- Clicking "Marcom Hub" tab → shows last marcom view unchanged
- View tabs (Board/List/Calendar/Gantt) switch between new Projects views
- npm test passes

---

## Phase 7 — Remove Bridge Code from All Marcom Views

**Goal:** Delete all "Track as Task" / "View on Board" buttons and task-sync calls. Marcom views become self-contained.

### New file to create first:
- `src/lib/marcom/eventChecklist.ts` — move pure analytics functions here:
  `getEventChecklistTemplate`, `findMemberForPic`, `formatEventDateRange`,
  `detectEventConflicts`, `calculateFieldEventsKPI`, `calculateTimelineBarMetrics`

### Files to edit (remove task refs):

**EventsView:**
- `EventFormModal.tsx` — remove props: `rawSpaces`, `tasks`, `createTask`, `updateTask`; remove space/list destination section; remove task creation in handleSave; persist checklist via PATCH
- `EventsView.tsx` — remove navigateToTask, task store reads (tasks, spaces, createTask, etc.)
- `EventCardsView.tsx` — remove tasks/rawSpaces/onNavigateToTask props; replace linkedTask checklist with event.checklist; remove "Board" button
- `EventTableView.tsx` — same as cards; remove destination column
- `EventsTimelineView.tsx` — redirect imports to eventChecklist.ts
- `EventsCalendarView.tsx` — redirect imports to eventChecklist.ts

**PlacementsView:**
- `usePlacementMutations.ts` — remove handleTrackAsTask, syncTaskOnPlacementStatusChange, buildPlacementTaskPayload
- `PlacementBulkActionBar.tsx` — remove sync call
- `PlacementsView.tsx` — remove onTrackAsTask prop
- `PlacementsMapTab.tsx` — remove prop passthrough
- `PlacementsMapView.tsx` — remove prop + "Track Task" button
- `PlacementDetailDrawer.tsx` — remove "Track as Production Task" button

**ContentPlannerView:**
- `ContentPlannerView.tsx` — remove createTask, navigateToTask, getOrCreateLinkedTask, destination section, Board buttons, Priority type import

### Verification:
```bash
grep -rn "from.*lib/tasks" src/components/views/ --include="*.tsx" --include="*.ts"
# Must return zero results
```

---

## Phase 8 — Remove AppMode Task Reads + Unify Sidebar

**Files to edit:**
- `src/components/layout/Sidebar.tsx` — remove `appMode === "tasks"` branch (spaces/lists tree); always render marcom nav tree in that branch OR show Projects-specific sidebar (Board/List/Calendar/Gantt shortcuts)
- `src/components/layout/GlobalRail.tsx` — remove task-specific nav items
- `src/lib/hooks/useWorkspaceHotkeys.ts` — remove task hotkeys, isFilterBarSupported import
- `src/components/layout/CommandPalette.tsx` — remove task-creation command entries
- `src/components/layout/TopNav.tsx` — remove task-only action buttons
- `src/app/page.tsx` — remove `<FilterBar />` render, `isFilterBarSupported` import

### Verification:
- `grep -rn "appMode.*tasks\|tasks.*appMode" src/` returns nothing
- Sidebar shows marcom nav for both modes (Projects sidebar = view switcher only)
- npm test passes

---

## Phase 9 — Delete Task Store Slices

**Files to DELETE:**
- `src/lib/store/slices/createTaskSlice.ts`
- `src/lib/store/slices/createSpaceSlice.ts`
- `src/lib/store/slices/createAutomationSlice.ts`
- `src/lib/store/slices/syncHelpers.ts`
- `src/lib/store/taskOperations.ts`

**Files to edit:**
- `src/lib/store/slices/createDataSlice.ts` — remove tasks[], spaces[], fetchServerTasks(), reconcileTasks()
- `src/lib/store/slices/types.ts` — remove TaskSlice, SpaceSlice, AutomationSlice from WorkspaceStore type
- `src/lib/store/useWorkspaceStore.ts` — remove deleted slice creators from store composition

**Pre-delete check:**
```bash
grep -rn "createTask\|updateTask\|deleteTask\|moveTaskStatus\|tasks\b\|spaces\b\|activeSpaceId\|activeListId\|selectedTaskId" \
  src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules\|lib/store/slices/createTaskSlice"
# Must return zero results
```

### Verification:
- Store compiles without task slice types
- npm test passes

---

## Phase 10 — Delete Task UI Components + View Files

**Directories to delete entirely:**
- `src/components/tasks/`
- `src/components/views/BoardView/`
- `src/components/views/ListView/`
- `src/components/views/GanttView/`
- `src/components/views/CalendarView/`
- `src/components/views/ChannelView/`
- `src/components/views/HomeView/`

**Individual files to delete:**
- `src/components/layout/FilterBar.tsx`
- `src/components/modals/AutomationBuilderDrawer.tsx`
- `src/components/modals/AutomationsModal.tsx`
- `src/components/modals/AgentsModal.tsx`
- `src/components/modals/AddViewModal.tsx`
- `src/components/modals/CallModal.tsx`
- `src/components/layout/TopNavActionModals.tsx` (if task-only)

**Pre-delete check per directory:**
```bash
grep -rn "from.*components/tasks/" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
grep -rn "from.*views/BoardView/" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
# etc — must return zero for each
```

### Verification:
- `ls src/components/tasks/` → directory not found
- npm test passes

---

## Phase 11 — Delete Task API Routes

**Files to delete:**
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`
- `src/app/api/tasks/[id]/comments/route.ts`

**Check before deleting:**
```bash
grep -rn "fetch.*api/tasks\|/api/tasks" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
# Must return zero
```

**Also check:** `src/app/api/realtime/` — if it only broadcasts task events, delete it too.

### Verification:
- `ls src/app/api/tasks/` → directory not found
- npm test passes

---

## Phase 12 — Delete src/lib/tasks/ Directory

**Pre-delete check:**
```bash
grep -rn "from.*lib/tasks" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
# Must return zero results
```

**Then delete:**
```bash
rm -rf src/lib/tasks/
```

### Verification:
- `ls src/lib/tasks/` → directory not found
- npm test passes

---

## Phase 13 — Drop Prisma Task Models (Migration)

**Files to edit:**
- `prisma/schema.prisma` — remove SpaceItem, FolderItem, ListItem, TaskItem, TaskCommentItem model blocks

**Pre-edit check:**
```bash
grep -rn "prisma\.taskItem\|prisma\.spaceItem\|prisma\.listItem\|prisma\.folderItem\|prisma\.taskCommentItem" \
  src/ --include="*.ts" | grep -v "node_modules"
# Must return zero
```

**Then run:**
```bash
npx prisma migrate dev --name drop_task_models
npx prisma generate
```

**Warning:** Irreversible in production. Run on dev DB first.

### Verification:
- `npx prisma migrate status` → migration applied
- No TaskItem/SpaceItem tables in DB

---

## Phase 14 — Remove Task Types from src/types/index.ts

**Types to delete:**
`Task`, `Subtask`, `Space` (task space), `Folder`, `List`, `Status` (task status),
`Tag`, `TaskComment`, `ActivityLog`, `TaskAttachment`, `Priority`, `RelatedMarcomType`

**Types to add:** `MarcomWorkItemType`, `MarcomWorkItem`, `ProjectsColumn` (move from workItems.ts or re-export)

**Types to modify:**
- `ViewMode` — remove `"home"`, `"channel"`; keep `"board"`, `"list"`, `"calendar"`, `"gantt"` (now Projects views)
- `AppMode` — change `"tasks"` → `"projects"` (or remove AppMode entirely)

**Pre-edit check:**
```bash
grep -rn "Task\b\|Subtask\b\|Priority\b\|Space\b\|RelatedMarcomType\b" \
  src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules\|src/types/index.ts"
# Must return zero (or only safe marcom-context uses)
```

### Verification:
```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
# 0 errors
```

---

## Phase 15 — Fix Tests

**Find affected tests:**
```bash
grep -rn "TaskItem\|SpaceItem\|createTask\|tasks\b\|spaces\b\|filterTasks\|sortTasks\|eventTaskSync\|placementTaskSync" \
  test/ --include="*.ts" | grep -v "node_modules"
```

**Expected changes:**
- Delete: TaskItem Prisma integration tests
- Delete: filterTasks, taskSort, taskColumns, eventTaskSync, placementTaskSync unit tests
- Delete: createTaskSlice, createSpaceSlice store tests
- Update: any store tests reading tasks/spaces state
- Keep + verify: marcom store tests, contentWorkflow tests, eventChecklist tests

### Final verification:
```bash
npm test
# All remaining tests pass, 0 failures
```

---

## Commit Message Convention
```
refactor(remove-tasks): phase 1 — add MarcomWorkItem types
refactor(remove-tasks): phase 2 — build ProjectsBoardView
...
refactor(remove-tasks): phase 13 — drop task Prisma models
refactor(remove-tasks): phase 14 — remove Task types
refactor(remove-tasks): phase 15 — fix tests, all green
```
