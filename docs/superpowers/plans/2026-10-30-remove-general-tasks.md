# Implementation Plan: Remove General Tasks — Repurpose Projects View for Marcom Hub

**Date:** 2026-10-30  
**Related:** `adr.md`, `spec.md`

---

## Phases Overview

| # | Phase | Risk | Est. Files Changed |
|---|-------|------|--------------------|
| 1 | Repurpose Board/List/Calendar/Gantt for ContentPost | High | ~8 new files |
| 2 | Remove bridge code from marcom views | Medium | ~10 files |
| 3 | Remove AppMode switcher + unify navigation | Medium | ~6 files |
| 4 | Delete task store slices | High | ~6 files |
| 5 | Delete task UI components + views | Low | ~15 deletions |
| 6 | Delete task API routes | Low | ~3 deletions |
| 7 | Delete lib/tasks directory | Low | ~13 deletions |
| 8 | Drop Prisma task models (migration) | High | schema + migration |
| 9 | Remove Task types from src/types/index.ts | Medium | 1 file |
| 10 | Fix all tests | Medium | ~10 test files |


---

## Phase 1 — Repurpose Board/List/Calendar/Gantt for ContentPost

**Goal:** Create `ContentBoardView`, `ContentListView`, `ContentCalendarView`, `ContentGanttView` inside `ContentPlannerView/` that render `ContentPostItem` instead of `Task`. The old task-based files are NOT deleted yet — they run in parallel until Phase 5.

### 1a. ContentBoardView
Create `src/components/views/ContentPlannerView/ContentBoardView.tsx`:
- Columns = fixed `PostStatus` order: `DRAFT → IN_REVIEW → REVISION → APPROVED → SCHEDULED → PUBLISHED`
- Cards show: platform icon, format badge, title, branch, publishDate, PIC, checklist progress
- Drag card between columns → `PATCH /api/marcom/content/{id} { status }`
- Validate via `canTransitionContentStatus(from, to)` from `contentWorkflow.ts`
- Use `@dnd-kit/core` (already in project for BoardView)

### 1b. ContentCalendarView  
Create `src/components/views/ContentPlannerView/ContentCalendarView.tsx`:
- Month grid, posts positioned by `publishDate`
- Chip: platform icon + truncated title + status color dot
- Click chip → `setSelectedDrawerPost(post)`
- Click empty day → `openCreateModal(date)`
- Can copy layout from existing `CalendarView.tsx` replacing Task with ContentPostItem

### 1c. ContentGanttView
Create `src/components/views/ContentPlannerView/ContentGanttView.tsx`:
- Horizontal week/month axis
- Row per post, bar at `publishDate` (single-day)
- Grouped by `platform` as section headers
- Bar color = PostStatus color
- Click bar → `setSelectedDrawerPost(post)`
- Can copy layout from existing `GanttView.tsx` replacing Task with ContentPostItem

### 1d. Wire sub-views into ContentPlannerView
- Add `contentView` state: `"list" | "board" | "calendar" | "gantt"`
- Add horizontal sub-view tab strip (Board / List / Calendar / Timeline icons)
- Render the correct sub-view based on `contentView`
- `"list"` renders existing table (no new work)

### Verification
- All four sub-views render without crashing
- Board drag updates post status via API
- Calendar and Gantt position posts correctly by date
- No imports from `lib/tasks/*`


---

## Phase 2 — Remove Bridge Code from Marcom Views

**Goal:** Delete all "Track as Task" / "View on Board" buttons and task-sync calls from marcom views. Marcom views become fully self-contained.

### Files to edit:
- `src/components/views/EventsView/EventFormModal.tsx` — remove `rawSpaces`, `tasks`, `createTask`, `updateTask` props; remove space/list destination section; remove task creation in `handleSave`; persist checklist via PATCH
- `src/components/views/EventsView/EventsView.tsx` — remove `navigateToTask`, task store reads
- `src/components/views/EventsView/EventCardsView.tsx` — remove `tasks`, `rawSpaces`, `onNavigateToTask` props; replace `linkedTask` checklist with `event.checklist`
- `src/components/views/EventsView/EventTableView.tsx` — same as cards
- `src/components/views/EventsView/EventsTimelineView.tsx` — redirect imports to `eventChecklist.ts`
- `src/components/views/EventsView/EventsCalendarView.tsx` — redirect imports
- `src/components/views/PlacementsView/usePlacementMutations.ts` — remove `handleTrackAsTask`, `syncTaskOnPlacementStatusChange`
- `src/components/views/PlacementsView/PlacementBulkActionBar.tsx` — remove sync call
- `src/components/views/PlacementsView/PlacementsView.tsx` — remove `onTrackAsTask` prop
- `src/components/views/PlacementsView/PlacementsMapTab.tsx` — remove prop passthrough
- `src/components/views/PlacementsView/PlacementsMapView.tsx` — remove prop + "Track Task" button
- `src/components/views/PlacementsView/PlacementDetailDrawer.tsx` — remove prop + "Track as Production Task" button
- `src/components/views/ContentPlannerView/ContentPlannerView.tsx` — remove `createTask`, `navigateToTask`, destination section, Board buttons, `Priority` type import

### New file needed:
- `src/lib/marcom/eventChecklist.ts` — move `detectEventConflicts`, `calculateFieldEventsKPI`, `formatEventDateRange`, `calculateTimelineBarMetrics`, `findMemberForPic`, `getEventChecklistTemplate` here (pure functions, no task dependency)

### Verification
- `grep -rn "from.*lib/tasks" src/components/views/` returns nothing
- No "Track as Task" or "View on Board" UI elements remain in marcom views
- All marcom view tests pass


---

## Phase 3 — Remove AppMode Switcher + Unify Navigation

**Goal:** Remove the two-mode concept. App always shows Marcom Hub navigation.

### Files to edit:

**`src/components/layout/AppModeSegmentedControl.tsx`** — DELETE entire file

**`src/components/layout/Sidebar.tsx`**
- Remove `appMode === "tasks"` branch (spaces/lists tree)
- Remove `AppModeSegmentedControl` from header
- Always render the marcom navigation tree
- Remove `openCreateTaskModal`, `openAddSpaceModal` calls

**`src/components/layout/GlobalRail.tsx`**
- Remove mode mini-toggle buttons (Kanban / Megaphone icons)
- Remove `layoutId="globalRailActivePill"` animation
- Keep: sidebar collapse toggle, Home, AI, Users, More

**`src/components/layout/ViewSwitcher.tsx`**
- DELETE entirely (task view tabs gone) OR repurpose as content sub-view tabs
- If repurposed: only export `CONTENT_VIEWS = ["board","list","calendar","gantt"]`
- Move content sub-view switching inside `ContentPlannerView` instead (preferred)

**`src/components/layout/FilterBar.tsx`** — DELETE entire file (task-specific filter)

**`src/components/layout/TopNav.tsx`**
- Remove `<ViewSwitcher />` render
- Remove `<FilterBar />` render
- Remove task-mode-only action buttons (Create Task shortcut, etc.)

**`src/lib/store/slices/createUiSlice.ts`**
- Remove `appMode`, `setAppMode`, `lastTaskView`
- Remove `isCreateTaskModalOpen`, `setCreateTaskModalOpen`
- Remove `isAddViewModalOpen`, `setAddViewModalOpen`
- Remove `isAutomationsModalOpen`, `isAgentsModalOpen` and their setters
- Remove `MARCOM_VIEW_SET` (all views are valid now)
- Simplify `setActiveView()` — remove mode auto-derivation logic
- Remove `setNavigatedFromMarcom` (no marcom→task navigation anymore)

**`src/app/page.tsx`**
- Remove all task-mode view renders: `<HomeView>`, `<ListView>`, `<BoardView>`, `<CalendarView>`, `<GanttView>`, `<ChannelView>`
- Remove `<TaskDrawer>`, `<CreateTaskModal>`, `<TrashModal>`, `<BulkActionBar>` (task-specific)
- Remove `isFilterBarSupported` import
- Keep all marcom view renders

### Verification
- No `appMode` reads anywhere outside `createUiSlice`
- Sidebar always shows marcom nav
- No mode switcher visible in UI
- Navigation to all marcom views works


---

## Phase 4 — Delete Task Store Slices

**Goal:** Remove `createTaskSlice`, `createSpaceSlice`, `createAutomationSlice` and all their state from the Zustand store.

### Files to edit:

**`src/lib/store/slices/createTaskSlice.ts`** — DELETE

**`src/lib/store/slices/createSpaceSlice.ts`** — DELETE

**`src/lib/store/slices/createAutomationSlice.ts`** — DELETE

**`src/lib/store/slices/syncHelpers.ts`** — DELETE (only wraps task API calls)

**`src/lib/store/slices/createDataSlice.ts`**
- Remove `tasks: Task[]`, `spaces: Space[]` state
- Remove `fetchServerTasks()`, `reconcileTasks()`, `importBackup()` (if task-dependent)
- Keep `users: User[]`, `fetchServerData()`

**`src/lib/store/taskOperations.ts`** — DELETE

**`src/lib/store/useWorkspaceStore.ts`**
- Remove `TaskSlice`, `SpaceSlice`, `AutomationSlice` from type composition
- Remove slice creators from store factory
- Keep `DataSlice`, `UiSlice`

**`src/lib/store/slices/types.ts`**
- Remove `TaskSlice`, `SpaceSlice`, `AutomationSlice` from `WorkspaceStore` type

### Verification
- `grep -rn "useWorkspaceStore.*tasks\|useWorkspaceStore.*spaces\|useWorkspaceStore.*createTask" src/` returns nothing
- `grep -rn "from.*createTaskSlice\|from.*createSpaceSlice" src/` returns nothing
- All remaining components compile without task store reads

---

## Phase 5 — Delete Task UI Components + Views

**Goal:** Delete all task-specific UI components and the original task view files.

### Directories to delete entirely:
- `src/components/tasks/` (7 files: TaskDrawer, CreateTaskModal, SubtaskManager, TaskActivityFeed, TiptapEditor, BulkActionBar, TrashModal)
- `src/components/views/BoardView/` (3 files)
- `src/components/views/ListView/` (3 files)
- `src/components/views/GanttView/` (1 file)
- `src/components/views/CalendarView/` (1 file)
- `src/components/views/ChannelView/` (if exists)
- `src/components/views/HomeView/` (if task-only)

### Files to delete individually:
- `src/components/layout/AppModeSegmentedControl.tsx` (already listed Phase 3)
- `src/components/layout/FilterBar.tsx` (already listed Phase 3)
- `src/components/layout/ViewSwitcher.tsx` (already listed Phase 3)
- `src/components/modals/AutomationBuilderDrawer.tsx`
- `src/components/modals/AutomationsModal.tsx`
- `src/components/modals/AgentsModal.tsx`
- `src/components/modals/AddViewModal.tsx`
- `src/components/modals/CallModal.tsx`
- `src/components/modals/TopNavActionModals.tsx` (if task-only)

### Verification
- `ls src/components/tasks/` — no such directory
- `ls src/components/views/BoardView/` — no such directory
- No dynamic imports of deleted components remain in `page.tsx`

---

## Phase 6 — Delete Task API Routes

**Goal:** Remove `/api/tasks/` entirely.

### Files to delete:
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`
- `src/app/api/tasks/[id]/comments/route.ts`

### Check before deleting:
- Confirm no marcom API routes call `/api/tasks/` internally
- Confirm realtime broadcast (`broadcastTaskUpsert`) not used by surviving code
- If `src/app/api/realtime/` is task-only, delete it too

### Verification
- `curl /api/tasks` returns 404
- No `fetch("/api/tasks")` anywhere in `src/`

---

## Phase 7 — Delete lib/tasks Directory

**Goal:** Delete all files in `src/lib/tasks/`.

### Files to delete (confirm zero consumers first):
- `eventTaskSync.ts`
- `placementTaskSync.ts`
- `targetSpaceList.ts`
- `taskSync.ts`
- `taskStatusValidator.ts`
- `taskQuery.ts`
- `taskColumns.ts`
- `taskSort.ts`
- `filterTasks.ts`
- `dateUtils.ts`
- `deleteUndo.ts`
- `inlineEditing.ts`
- `openTasksCount.ts`

### Pre-delete check:
```bash
grep -rn "from.*lib/tasks" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
# Must return 0 results before deleting
```

### Verification
- `ls src/lib/tasks/` — no such directory
- Full grep confirms zero references

---

## Phase 8 — Drop Prisma Task Models (Migration)

**Goal:** Remove `SpaceItem`, `FolderItem`, `ListItem`, `TaskItem`, `TaskCommentItem` from schema and DB.

### Steps:
1. Remove all 5 model blocks from `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name drop_task_models`
3. Migration generates: `DROP TABLE IF EXISTS "TaskCommentItem"; DROP TABLE IF EXISTS "TaskItem"; DROP TABLE IF EXISTS "ListItem"; DROP TABLE IF EXISTS "FolderItem"; DROP TABLE IF EXISTS "SpaceItem";`
4. Run `npx prisma generate` to update client

### Pre-migration check:
- Confirm no `prisma.taskItem`, `prisma.spaceItem`, etc. calls remain in any API route
- Run `grep -rn "prisma\.taskItem\|prisma\.spaceItem\|prisma\.listItem\|prisma\.folderItem\|prisma\.taskCommentItem" src/` — must return 0

### Warning:
This is **irreversible** in production. Run on dev DB first, verify, then apply to prod.

### Verification:
- `npx prisma studio` — no Task/Space/List/Folder tables visible
- `npx prisma migrate status` — migration shows as applied

---

## Phase 9 — Remove Task Types from src/types/index.ts

**Goal:** Delete all task-domain type definitions.

### Types to remove:
```typescript
// Delete these type/interface definitions:
Task
Subtask
Space (the task Space, not marcom)
Folder
List
Status
Tag
TaskComment
ActivityLog
TaskAttachment
Priority
RelatedMarcomType
AppMode  (or simplify to just ViewMode)
```

### Types to modify:
```typescript
// ViewMode — remove task view values:
// Before: "home"|"list"|"board"|"calendar"|"gantt"|"channel"|"pipeline"|...
// After:  "content-planner"|"board"|"list"|"calendar"|"gantt"|"events"|...
// (board/list/calendar/gantt stay but now refer to content sub-views)

// AppMode — remove entirely OR keep as single value "marcom"
```

### Pre-removal check:
```bash
grep -rn "Task\b\|Subtask\b\|Priority\b\|Space\b\|RelatedMarcomType" src/ \
  --include="*.ts" --include="*.tsx" | grep -v "node_modules\|\.test\."
# Must return 0 results (or only marcom-safe uses)
```

### Verification:
- `npx tsc --noEmit --skipLibCheck` — 0 errors

---

## Phase 10 — Fix Tests

**Goal:** Update or delete all tests that reference task models, task store, or task API.

### Test files likely needing changes:
```bash
grep -rn "TaskItem\|SpaceItem\|createTask\|tasks\b\|spaces\b\|taskSlice\|filterTasks\|sortTasks" \
  test/ --include="*.ts" | grep -v "node_modules"
```

### Expected changes:
- Delete integration tests for TaskItem Prisma model (`test/db/taskItem.test.ts` or similar)
- Delete unit tests for `filterTasks`, `taskSort`, `taskColumns`, `eventTaskSync`, `placementTaskSync`
- Delete unit tests for `createTaskSlice`, `createSpaceSlice`
- Update store tests that read `tasks` or `spaces` from store state
- Keep and verify: marcom store tests, contentWorkflow tests, eventChecklist tests, placement tests

### Verification:
```bash
npm test
# All passing tests remain passing
# No test references deleted symbols
```

---

## Execution Order + Safety Rules

1. **Always complete Phase N before starting Phase N+1**
2. **Run `npm test` after each phase** — must not regress
3. **Phase 1 first** — content views must work before task views are deleted
4. **Phase 8 (DB migration) last of the destructive phases** — after all code is clean
5. **Phase 9 (type removal) after Phase 8** — TypeScript will catch any missed consumers
6. **Never delete a file until `grep` confirms zero consumers**
7. **Commit after each phase** with message `refactor(remove-tasks): phase N — <description>`

---

## Quick Reference: Files Deleted vs Created

### New Files Created (Phase 1)
- `src/components/views/ContentPlannerView/ContentBoardView.tsx`
- `src/components/views/ContentPlannerView/ContentCalendarView.tsx`
- `src/components/views/ContentPlannerView/ContentGanttView.tsx`
- `src/lib/marcom/eventChecklist.ts` (Phase 2 — pure analytics functions)

### Files Deleted (Phases 3–9)
**Layout:** `AppModeSegmentedControl.tsx`, `FilterBar.tsx`, `ViewSwitcher.tsx`  
**Modals:** `AutomationBuilderDrawer.tsx`, `AutomationsModal.tsx`, `AgentsModal.tsx`, `AddViewModal.tsx`, `CallModal.tsx`, `TopNavActionModals.tsx`  
**Tasks components:** entire `src/components/tasks/` directory  
**Task views:** `BoardView/`, `ListView/`, `GanttView/`, `CalendarView/`, `ChannelView/`  
**API:** entire `src/app/api/tasks/` directory  
**Lib:** entire `src/lib/tasks/` directory  
**Store slices:** `createTaskSlice.ts`, `createSpaceSlice.ts`, `createAutomationSlice.ts`, `syncHelpers.ts`, `taskOperations.ts`
