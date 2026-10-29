# Spec: Remove General Tasks — Repurpose Projects Board for Marcom Work Items

**Date:** 2026-10-30  
**Status:** Draft  
**Related ADR:** `docs/remove-general-tasks/adr.md`

---

## 1. Goal

Delete the general-purpose task system. Repurpose the existing Projects mode (Board/List/Gantt/Calendar views) to display **ContentPostItem + FieldEventItem + MarcomPlacement** as unified marcom work item cards. The "Projects / Marcom Hub" mode switcher remains. Only the data source changes.

---

## 2. Current State

```
AppMode = "tasks" | "marcom"

Projects (tasks) mode:
  views: home | list | board | calendar | gantt | channel
  data:  SpaceItem → ListItem → TaskItem (Prisma)
  store: createTaskSlice, createSpaceSlice
  bridge: Task.relatedMarcomId ↔ ContentPost / FieldEvent / Placement

Marcom Hub mode:
  views: pipeline | content-planner | events | placements | mous |
         branches | outlets | documents | reports | analytics
  data:  ContentPost, FieldEvent, Placement, Mou, ... (Prisma)
  store: marcomDataStore (separate Zustand)
```

---

## 3. Target State

```
AppMode = "projects" | "marcom"   (renamed, same switcher UI)

Projects mode:
  views: board | list | calendar | gantt
  data:  ContentPost + FieldEvent + Placement from marcomDataStore
  store: reads marcomDataStore directly (no TaskSlice)
  bridge: DELETED

Marcom Hub mode:
  views: pipeline | content-planner | events | placements | mous |
         branches | outlets | documents | reports | analytics
  data:  unchanged
  store: unchanged
```

---

## 4. Unified Marcom Work Item Type

A new TypeScript union type for use in Projects views:

```typescript
export type MarcomWorkItemType = "content" | "event" | "placement";

export type MarcomWorkItem =
  | (ContentPostItem & { _type: "content" })
  | (FieldEventItem  & { _type: "event" })
  | (MarcomPlacement & { _type: "placement" });
```

A utility function maps each entity to its unified column label:

```typescript
export function getWorkItemColumn(item: MarcomWorkItem): string {
  switch (item._type) {
    case "content":
      // DRAFT | IN_REVIEW | REVISION → "In Progress"
      // APPROVED | SCHEDULED         → "Ready"
      // PUBLISHED                    → "Done"
      // ARCHIVED                     → "Archived"
    case "event":
      // UPCOMING     → "Upcoming"
      // ON_PROGRESS  → "In Progress"
      // COMPLETED    → "Done"
      // CANCELLED    → "Cancelled"
    case "placement":
      // NOT_STARTED  → "To Do"
      // ON_PROGRESS  → "In Progress"
      // DONE         → "Done"
      // ISSUE        → "Blocked"
  }
}
```

Unified column order for Board view:
```
Upcoming | To Do | In Progress | Ready | Done | Blocked | Cancelled | Archived
```
(Empty columns are hidden by default.)

---

## 5. Projects Board View Spec

### Data Source
```typescript
const { posts, events, placements } = useMarcomDataStore();

const workItems: MarcomWorkItem[] = [
  ...posts.map(p => ({ ...p, _type: "content" as const })),
  ...events.map(e => ({ ...e, _type: "event" as const })),
  ...placements.map(p => ({ ...p, _type: "placement" as const })),
];
```

### Column Layout
Fixed column order (hide empty):
```
[ Upcoming ] [ To Do ] [ In Progress ] [ Ready ] [ Done ] [ Blocked ] [ Cancelled ] [ Archived ]
```

### Card Anatomy
Each card shows:
- **Type badge** top-left: `Content` (pink) / `Event` (blue) / `Placement` (emerald)
- **Title**: `ContentPost.title` / `FieldEvent.name` / `Placement.outlet.name + material.name`
- **Sub-line**: platform+format (content) / eventType+branch (event) / brand+dimensions (placement)
- **Date**: `publishDate` (content) / `startDate` (event) / `date` (placement)
- **PIC**: `picName` or assignee avatar
- **Status pill**: entity's own status label with color
- **Progress**: checklist progress if applicable (event) or subtask count (content)

### Drag Interaction
Dragging a card to a new column dispatches a status update:

```typescript
async function onCardDrop(item: MarcomWorkItem, newColumn: string) {
  const newStatus = mapColumnToStatus(item._type, newColumn);
  if (!newStatus) return; // invalid transition

  switch (item._type) {
    case "content":
      if (!canTransitionContentStatus(item.status, newStatus)) {
        toast.error("Invalid content status transition");
        return;
      }
      await fetch(`/api/marcom/content/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      updateCachedPost({ id: item.id, status: newStatus });
      break;

    case "event":
      await fetch(`/api/marcom/events/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      updateCachedEvent({ ...item, status: newStatus });
      break;

    case "placement":
      await fetch(`/api/marcom/placements/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      updateCachedPlacement({ id: item.id, status: newStatus });
      break;
  }
}
```

### Filters
Toolbar above the board:
- **Type filter**: All / Content / Events / Placements (pill buttons)
- **Search**: filter by title/name
- **Branch filter**: dropdown

---

## 6. Projects List View Spec

Sortable table showing all three entity types. Columns:

| Column | Content | Event | Placement |
|--------|---------|-------|-----------|
| Type | "Content" badge | "Event" badge | "Placement" badge |
| Title/Name | title | name | material.name @ outlet.name |
| Status | PostStatus pill | EventStatus pill | PlacementStatus pill |
| Date | publishDate | startDate | date |
| Branch | branchName | branchName | outlet.branch |
| PIC | picName | picName | picName |
| Actions | Edit / Open drawer | Edit / Open modal | Edit / Open drawer |

Sortable by: Type, Status, Date, Branch.

---

## 7. Projects Calendar View Spec

Month grid. All three types appear on their respective dates:
- ContentPost → `publishDate`
- FieldEvent → `startDate` through `endDate` (spans multiple days)
- Placement → `date`

Each chip has:
- Type color border (pink=content, blue=event, emerald=placement)
- Icon (platform icon / flag / store)
- Truncated name
- Click → opens relevant drawer/modal

---

## 8. Projects Gantt View Spec

Horizontal timeline (week/month zoom). Three row groups:

**Group: Field Events**
- Bar from `startDate` to `endDate`
- Color = EventStatus color
- Click → opens EventFormModal

**Group: Content Posts**
- Single-day marker at `publishDate`
- Color = PostStatus color
- Click → opens ContentDrawer

**Group: Placements**
- Single-day marker at `date`
- Color = PlacementStatus color
- Click → opens PlacementDetailDrawer

---

## 9. Navigation Changes

### What Stays
- Mode switcher: **"Projects" | "Marcom Hub"** (same two tabs, same visual)
- Projects tab icon: Kanban (unchanged)
- Marcom Hub tab icon: Megaphone (unchanged)

### What Changes
- Projects mode no longer has "Spaces" sidebar tree
- Projects mode sidebar shows: view switcher (Board / List / Calendar / Gantt) + type filter shortcuts
- ViewSwitcher in TopNav: shows `board | list | calendar | gantt` only when in Projects mode
- FilterBar: replaced with a simpler type/branch filter bar (no task-specific filters)
- "Create Task" button: replaced with type-aware "New Work Item" button → opens a picker (Content / Event / Placement)
- `HomeView` (task dashboard): deleted; Projects mode defaults to Board view
- `ChannelView`: deleted

### Marcom Hub Mode
Unchanged. All existing views, navigation, and functionality remain exactly as-is.

---

## 10. Store Architecture Changes

### Removed
- `createTaskSlice` (tasks, tags, selectedTaskId, selectedTaskIds, trash actions)
- `createSpaceSlice` (spaces, activeSpaceId, activeListId, folder/list/status CRUD)
- `createAutomationSlice` (automationEnabled, channelMessages, automationRuns, customAutomations)
- `syncHelpers.ts` (wraps deleted task API)
- `taskOperations.ts` (task-specific side effects)
- Store state: `tasks`, `spaces`, `tags`, `trash`, `selectedTaskId`, `selectedTaskIds`

### Modified — `createUiSlice`
```typescript
// Removed:
appMode: "tasks" | "marcom"   →   kept but "tasks" becomes "projects"
lastTaskView                   →   renamed lastProjectsView
isCreateTaskModalOpen          →   removed
isAddViewModalOpen             →   removed
isAutomationsModalOpen         →   removed
isAgentsModalOpen              →   removed
setNavigatedFromMarcom         →   removed (no task navigation target)

// Simplified:
setActiveView()  →  no longer auto-derives appMode (all views valid in their mode)
MARCOM_VIEW_SET  →  stays, excludes "board"|"list"|"calendar"|"gantt" (those are Projects)
```

### Projects Board reads from marcomDataStore
```typescript
// In ProjectsBoardView:
const posts = useMarcomDataStore(s => s.posts);
const events = useMarcomDataStore(s => s.events);
const placements = useMarcomDataStore(s => s.placements);
// No useWorkspaceStore reads for task data
```

---

## 11. Type System Changes

### Types Deleted
```typescript
Task, Subtask, Space (task space), Folder, List, Status (task status),
Tag, TaskComment, ActivityLog, TaskAttachment, Priority,
RelatedMarcomType
```

### Types Added
```typescript
// src/types/index.ts
export type MarcomWorkItemType = "content" | "event" | "placement";

export type MarcomWorkItem =
  | (ContentPostItem  & { _type: "content" })
  | (FieldEventItem   & { _type: "event" })
  | (MarcomPlacement  & { _type: "placement" });

// Unified column labels
export type ProjectsColumn =
  | "Upcoming" | "To Do" | "In Progress" | "Ready"
  | "Done" | "Blocked" | "Cancelled" | "Archived";
```

### Types Modified
```typescript
// ViewMode — board/list/calendar/gantt stay (repurposed for Projects):
type ViewMode =
  | "board" | "list" | "calendar" | "gantt"         // Projects mode views
  | "content-planner" | "events" | "placements"      // Marcom Hub work items
  | "mous" | "pipeline"
  | "branches" | "outlets" | "documents" | "reports" | "analytics";
```

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

Run after all TypeScript consumers are removed.

---

## 13. What Does NOT Change

- All Marcom Hub views and their functionality (ContentPlannerView, EventsView, PlacementsView, MousView, BranchesView, OutletsView, PipelineView, DocumentsView, ReportsView, AnalyticsView)
- All `/api/marcom/*` routes
- `marcomDataStore` Zustand store
- All marcom entity types (ContentPostItem, FieldEventItem, MarcomPlacement, Mou, Branch, Outlet, etc.)
- Auth, settings, notifications, command palette, AI drawer, export center
- The "Projects / Marcom Hub" mode switcher tab UI

---

## 14. Out of Scope (v1)

- Rich-text editing (TiptapEditor) — deleted with task components; content captions remain plain textarea
- Automation rules — deleted, no replacement
- Creating new work items directly from the Projects Board (drag-to-create) — v2
- Cross-entity dependencies or blocking relationships — v2
