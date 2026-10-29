# Handover: Remove General Tasks — Repurpose Projects Board for Marcom Work Items

**Date:** 2026-10-30
**Baseline commit:** `a70ec5b`
**Current test state:** 511 pass / 3 fail

---

## 1. Goal

Delete the general task system entirely. Repurpose the Projects mode (Board/Kanban, List, Gantt, Calendar) to show ContentPost + FieldEvent + Placement as unified marcom work item cards. Keep the "Projects / Marcom Hub" two-tab mode switcher — only the data source changes.

Full design details: `docs/remove-general-tasks/adr.md`, `spec.md`, `plan.md`

---

## 2. Current Working Tree State (117 uncommitted changes)

There are 117 uncommitted file changes in the working tree. These represent **partial Phase 7–13 work** done outside this session. They are NOT yet committed.

### What has already been done (uncommitted)

**New files added (keep these):**
- `src/components/views/ContentPlannerView/ContentBoardView.tsx` — Kanban for ContentPost only (Phase 2 partial — needs extending to all 3 entity types per spec)
- `src/components/views/ContentPlannerView/ContentBoardCard.tsx`
- `src/components/views/ContentPlannerView/ContentBoardColumn.tsx`
- `src/components/views/ContentPlannerView/ContentCalendarView.tsx`
- `src/components/views/ContentPlannerView/ContentGanttView.tsx`
- `src/components/views/ActiveViewStage.tsx` — replaces page.tsx view rendering; only shows marcom views (missing Projects board views)
- `src/components/layout/navConfig.ts` — empty file (0 bytes, placeholder)
- `src/lib/marcom/eventChecklist.ts` — pure analytics functions moved from eventTaskSync.ts
- `src/lib/marcom/eventChecklist.test.ts`
- `prisma/migrations/20261029134026_drop_task_models/migration.sql` — ready to apply

**Files deleted (staged deletions — do NOT restore):**
- All `src/lib/tasks/` files (13 files deleted)
- All `src/components/tasks/` files (TaskDrawer, CreateTaskModal, SubtaskManager, etc.)
- All `src/components/views/BoardView/`, `ListView/`, `GanttView/`, `CalendarView/`, `ChannelView/`, `HomeView/`
- All `src/lib/store/slices/createTaskSlice.ts`, `createSpaceSlice.ts`, `createAutomationSlice.ts`, `createTrashSlice.ts`, `syncHelpers.ts`
- All `src/lib/store/taskOperations.ts`, `spacesOperations.ts`, `automationOperations.ts`, `commentOperations.ts`, etc.
- All `src/components/layout/AppModeSegmentedControl.tsx`, `FilterBar.tsx`, `ViewSwitcher.tsx`, `TopNavActionModals.tsx`
- All `src/components/modals/AutomationBuilderDrawer.tsx`, `AutomationsModal.tsx`, `AgentsModal.tsx`, `AddViewModal.tsx`, `CallModal.tsx`
- All `src/components/spaces/` directory
- `src/lib/marcom/marcomIds.ts` and `marcomIds.test.ts`
- `src/lib/server/realtimeHub.ts` and test
- `src/app/api/tasks/` (all 3 route files)
- `src/app/api/realtime/` (both route files)
- `src/lib/automations/scheduler.ts`, `slaRules.ts`, `slaRules.test.ts`
- Many `src/lib/store/*.test.ts` files (tests for deleted code)


---

## 3. The 3 Failing Tests — Root Cause

All 3 failing tests import `useWorkspaceStore`, which imports from two deleted files:

**Chain:**
```
useWorkspaceStore.ts
  → imports { DEFAULT_STATUSES, INITIAL_SPACES, INITIAL_TASKS } from "@/lib/constants/seeds"
  → seeds.ts imports Task, Space, Status, Tag, ChannelMessage from "@/types"
  → seeds.ts imports MARCOM_SPACE_ID, PRODUCT_SPACE_ID, CONTENT_PLANNER_LIST_ID,
               FIELD_OPS_LIST_ID, DESIGN_SYSTEM_LIST_ID from "@/lib/marcom/marcomIds"
  → marcomIds.ts is DELETED in the uncommitted changes
  → CRASH: ERR_MODULE_NOT_FOUND
```

Additionally, `useWorkspaceStore.ts` still imports deleted slices:
```
import { createSpaceSlice }     from "./slices/createSpaceSlice";      // DELETED
import { createTaskSlice }      from "./slices/createTaskSlice";       // DELETED
import { createTrashSlice }     from "./slices/createTrashSlice";      // DELETED
import { createAutomationSlice } from "./slices/createAutomationSlice"; // DELETED
import { syncUpdateTask }       from "./syncHelpers";                   // (via createDataSlice)
```

**Failing tests:**
1. `src/lib/store/marcomNavigation.test.ts` — imports useWorkspaceStore → seeds crash
2. `src/lib/store/marcomViews.test.ts` — same
3. `src/lib/store/persistQuota.test.ts` — imports useWorkspaceStore → seeds crash

---

## 4. Files That Still Need Fixing

These files still reference deleted code and must be updated:

### A. `src/lib/store/useWorkspaceStore.ts` (HIGH PRIORITY — blocks all 3 tests)
Still imports:
- `Task, Space, ViewMode` from `@/types` (Task/Space types deleted)
- `DEFAULT_STATUSES, INITIAL_SPACES, INITIAL_TASKS` from `@/lib/constants/seeds` (seeds imports deleted marcomIds)
- `PRODUCT_SPACE_ID, DESIGN_SYSTEM_LIST_ID` from `@/lib/marcom/marcomIds` (DELETED)
- `TRASH_LIMIT, TRASH_RETENTION_MS` from `@/lib/store/trashOperations` (DELETED)
- `wouldCreateCycle` from `@/lib/store/dependencyOperations` (DELETED)
- `getSpaceListIds` from `@/lib/store/spacesOperations` (DELETED)
- `findSpaceForListId, reconcileSpaces` from `@/lib/store/spaceSync` (DELETED)
- `createSpaceSlice, createTaskSlice, createTrashSlice, createAutomationSlice` (all DELETED)

**Fix:** Gut useWorkspaceStore.ts down to only DataSlice + UiSlice. Remove all task/space/trash/automation slice composition.

### B. `src/lib/constants/seeds.ts`
Imports `Task, Space, Status, Tag, ChannelMessage` from `@/types` and 5 constants from deleted `marcomIds.ts`.
Exports `INITIAL_TASKS`, `INITIAL_SPACES`, `DEFAULT_STATUSES`, `SEED_USERS`.

**Fix:** After useWorkspaceStore is gutted, seeds.ts can be deleted entirely OR stripped to just `SEED_USERS`.

### C. `src/components/views/EventsView/EventsView.tsx`
Still imports `FIELD_OPS_LIST_ID` from deleted `marcomIds.ts`.

**Fix:** Remove that import. The list ID is no longer needed once bridge code is removed.

### D. `src/components/views/EventsView/EventFormModal.tsx`
Still imports `FIELD_OPS_LIST_ID` from deleted `marcomIds.ts`.

**Fix:** Remove that import.

### E. `src/components/views/PlacementsView/usePlacementMutations.ts`
Still imports `FIELD_OPS_LIST_ID` from deleted `marcomIds.ts`.

**Fix:** Remove that import.

### F. `src/components/views/ContentPlannerView/ContentPlannerView.tsx`
Still imports `CONTENT_PLANNER_LIST_ID` from deleted `marcomIds.ts`.

**Fix:** Remove that import.

### G. `src/components/layout/Sidebar.tsx`
Still imports multiple IDs from deleted `marcomIds.ts`.

**Fix:** Remove those imports; the space IDs are no longer needed.

### H. `src/lib/store/slices/createDataSlice.ts`
Still imports `syncUpdateTask` from deleted `syncHelpers.ts`.

**Fix:** Remove that import and any usage.

### I. `src/lib/store/slices/createUiSlice.ts`
Still has `appMode: "tasks"`, `isCreateTaskModalOpen`, `isTrashOpen`, `lastTaskView`, `setAppMode` referencing `"tasks"`. These work but reference the old concept. Update `"tasks"` → `"projects"` when cleaning up types.


---

## 5. What the New Files Do (Uncommitted)

### `src/components/views/ActiveViewStage.tsx`
Replaces the inline view rendering in `page.tsx`. Renders all marcom views with AnimatePresence. Currently **only renders marcom views** — missing Projects Board/List/Calendar/Gantt. These need to be added once ProjectsBoardView etc. are built.

### `src/components/views/ContentPlannerView/ContentBoardView.tsx`
Kanban board for **ContentPost only** (not the unified 3-entity board from spec). Columns = PostStatus: `DRAFT → IN_REVIEW → REVISION → APPROVED → SCHEDULED → PUBLISHED`. Uses `@dnd-kit/core`. Drag fires `PATCH /api/marcom/content/{id}`. Validates via `canTransitionContentStatus`.

**Note:** Per the spec, the Projects Board should show ContentPost + FieldEvent + Placement together. This file only handles ContentPost — it may be used as-is inside ContentPlannerView as a content-only sub-view, while a separate `ProjectsBoardView` handles the unified 3-entity board.

### `src/lib/marcom/eventChecklist.ts`
Pure analytics/utility functions extracted from deleted `eventTaskSync.ts`:
- `DEFAULT_EVENT_CHECKLISTS` — checklist templates by event type
- `getEventChecklistTemplate(eventType)` — returns template
- `formatEventDateRange(startDate, endDate)` — human-readable date range
- `detectEventConflicts(events, current)` — finds overlapping events
- `calculateFieldEventsKPI(events)` — KPI metrics
- `calculateTimelineBarMetrics(event, containerWidth, startDate, endDate)` — Gantt bar math
- `findMemberForPic(members, picName)` — matches PIC to user

### `prisma/migrations/20261029134026_drop_task_models/migration.sql`
Ready to apply. Drops: `TaskCommentItem`, `TaskItem`, `ListItem`, `FolderItem`, `SpaceItem`. Has not been applied to DB yet.

### `src/components/layout/navConfig.ts`
Empty file (0 bytes). Placeholder — needs content or deletion.

---

## 6. What Still Needs to Be Built (from the spec/plan)

### Immediate priority (unblocks tests):
1. **Gut `useWorkspaceStore.ts`** — remove all deleted slice imports, task/space state, seeds dependency
2. **Fix or delete `src/lib/constants/seeds.ts`** — remove marcomIds import, remove task/space types
3. **Remove marcomIds imports** from EventsView, EventFormModal, usePlacementMutations, ContentPlannerView, Sidebar
4. **Fix `createDataSlice.ts`** — remove syncHelpers import

### After tests pass:
5. **Build `ProjectsBoardView`** — unified 3-entity Kanban (plan Phase 2) — distinct from ContentBoardView
6. **Build `ProjectsListView`** — unified 3-entity sortable table (plan Phase 3)
7. **Build `ProjectsCalendarView`** — 3-entity month calendar (plan Phase 4)
8. **Build `ProjectsGanttView`** — 3-entity timeline (plan Phase 5)
9. **Wire views into `ActiveViewStage.tsx`** — add board/list/calendar/gantt cases
10. **Update `navConfig.ts`** — write actual nav config content
11. **Remove bridge code** from EventsView, PlacementsView, ContentPlannerView (plan Phase 7)
12. **Update Sidebar** — remove spaces tree, add Projects view switcher
13. **Apply Prisma migration** — `npx prisma migrate dev` (plan Phase 13)
14. **Clean up types** in `src/types/index.ts` — remove Task, Space, Priority etc. (plan Phase 14)
15. **Fix remaining tests** (plan Phase 15)

---

## 7. Key Files Reference

| File | Status | Notes |
|------|--------|-------|
| `src/lib/store/useWorkspaceStore.ts` | BROKEN | Must be gutted first |
| `src/lib/constants/seeds.ts` | BROKEN | Imports deleted marcomIds |
| `src/lib/store/slices/createDataSlice.ts` | BROKEN | Imports deleted syncHelpers |
| `src/lib/store/slices/createUiSlice.ts` | Works | Needs "tasks"→"projects" rename later |
| `src/components/views/ActiveViewStage.tsx` | Partial | Missing Projects views |
| `src/components/views/ContentPlannerView/ContentBoardView.tsx` | Works (content only) | Needs companion ProjectsBoardView for 3 entities |
| `src/lib/marcom/eventChecklist.ts` | Works | Pure functions, no broken imports |
| `prisma/migrations/20261029134026_drop_task_models/` | Ready | Not yet applied to DB |
| `src/components/layout/navConfig.ts` | Empty | Needs content or delete |
| `docs/remove-general-tasks/adr.md` | Complete | 8 architectural decisions |
| `docs/remove-general-tasks/spec.md` | Complete | Full design spec |
| `docs/remove-general-tasks/plan.md` | Complete | 15-phase plan |

---

## 8. Exact Steps to Fix the 3 Failing Tests

**Step 1:** Remove all deleted-slice imports from `src/lib/store/useWorkspaceStore.ts`.
Keep only: `createDataSlice`, `createUiSlice`. Remove: `createSpaceSlice`, `createTaskSlice`, `createTrashSlice`, `createAutomationSlice`.

**Step 2:** Remove the `seeds.ts` import from `useWorkspaceStore.ts`. Replace `INITIAL_TASKS`, `INITIAL_SPACES`, `DEFAULT_STATUSES` usage with empty arrays / empty objects.

**Step 3:** Remove `PRODUCT_SPACE_ID`, `DESIGN_SYSTEM_LIST_ID` imports from `useWorkspaceStore.ts` (from deleted marcomIds).

**Step 4:** Remove `trashOperations`, `dependencyOperations`, `spacesOperations`, `spaceSync` imports from `useWorkspaceStore.ts`.

**Step 5:** Fix `src/lib/store/slices/createDataSlice.ts` — remove `syncUpdateTask` import from deleted `syncHelpers.ts`.

**Step 6:** Run `npm test` — the 3 tests should now pass (they only test marcom navigation/views/quota logic, none of which depends on task state).

---

## 9. Do Not Touch

- All `src/components/views/` marcom views (ContentPlannerView, EventsView, PlacementsView, MousView, BranchesView, OutletsView, PipelineView, DocumentsView, ReportsView, AnalyticsView)
- All `src/app/api/marcom/` routes
- `marcomDataStore` (separate Zustand store — untouched throughout)
- Auth, settings, notifications, AI drawer, export center

---

## 10. Commands

```bash
# Check current test state
npm test

# Check what still imports marcomIds
grep -rn "from.*lib/marcom/marcomIds" src/ --include="*.ts" --include="*.tsx"

# Check what still imports deleted slices
grep -rn "createTaskSlice\|createSpaceSlice\|createTrashSlice\|createAutomationSlice\|syncHelpers" src/ --include="*.ts" --include="*.tsx"

# Check what still imports seeds.ts
grep -rn "from.*constants/seeds" src/ --include="*.ts" --include="*.tsx"

# Apply Prisma migration (only after code is clean)
npx prisma migrate dev
npx prisma generate
```

