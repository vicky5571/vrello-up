# ADR: Remove General Tasks — Repurpose Projects Board for Marcom Work Items

**Date:** 2026-10-30  
**Status:** Proposed  
**Deciders:** Product / Engineering

---

## Context

The app has two modes — **Projects** (Board/List/Gantt/Calendar for general tasks) and **Marcom Hub** (ContentPlanner/FieldEvents/Placements/MOUs/etc.). They are bridged via `Task.relatedMarcomId` so marcom entities can be mirrored as Tasks on the Kanban board.

**Business decision:** General task management is no longer needed. However, the Projects view (Board/Kanban, List, Gantt, Calendar) is a valuable UI surface that must survive — repurposed to show **Marcom Hub work items** (ContentPost + FieldEvent + Placement) instead of general tasks.

The two-tab switcher ("Projects / Marcom Hub") stays. Only the data backing the Projects tab changes.

---

## Decisions

### ADR-1: Keep the Projects mode tab — repurpose it for Marcom work items

The `AppMode = "tasks" | "marcom"` binary survives but `"tasks"` is renamed to `"projects"` semantically. The Projects Board/Kanban/List/Gantt/Calendar views are rebuilt to display `ContentPostItem`, `FieldEventItem`, and `MarcomPlacement` as unified work item cards, grouped by their respective statuses.

**Rationale:** Users already understand the Projects tab as a task-tracking surface. Keeping the tab preserves mental model while eliminating the general task system underneath.

### ADR-2: Projects Board shows all three marcom work item types together

The Projects Board displays ContentPost + FieldEvent + Placement as cards in a single Kanban. Column grouping is by a **unified status dimension** mapped from each entity's own status:

| Marcom Entity | Status Values | Maps to Unified Column |
|---|---|---|
| ContentPost | DRAFT, IN_REVIEW, REVISION | → **In Progress** |
| ContentPost | APPROVED, SCHEDULED | → **Ready** |
| ContentPost | PUBLISHED | → **Done** |
| FieldEvent | UPCOMING | → **Upcoming** |
| FieldEvent | ON_PROGRESS | → **In Progress** |
| FieldEvent | COMPLETED | → **Done** |
| FieldEvent | CANCELLED | → **Cancelled** |
| Placement | NOT_STARTED | → **To Do** |
| Placement | ON_PROGRESS | → **In Progress** |
| Placement | DONE | → **Done** |
| Placement | ISSUE | → **Blocked** |

Cards are visually differentiated by a type badge (Content / Event / Placement) and type-specific color.

**Rationale:** A unified board gives the marcom team a single operational view across all active work.

### ADR-3: Drag-to-change-status on the Projects Board updates the marcom entity directly

Dragging a card between columns fires a direct PATCH to the entity's own API endpoint — no Task intermediary:
- ContentPost card drag → `PATCH /api/marcom/content/{id} { status }`
- FieldEvent card drag → `PATCH /api/marcom/events/{id} { status }`
- Placement card drag → `PATCH /api/marcom/placements/{id} { status }`

Status transitions are validated per entity type using existing workflow functions.

**Rationale:** Eliminates the sync bridge entirely. Each entity owns its own status.

### ADR-4: Delete general Task data model entirely

Drop `SpaceItem`, `FolderItem`, `ListItem`, `TaskItem`, `TaskCommentItem` from Prisma via a destructive migration. All general task data is permanently deleted.

**Rationale:** No use case survives for the general task model.

### ADR-5: Delete all bridge/sync code

Remove `syncFieldEventOnTaskStatusChange`, `syncTaskOnPlacementStatusChange`, `syncPlacementOnTaskStatusChange`, `buildEventTaskPayload`, `buildPlacementTaskPayload`, and the `relatedMarcomId`/`relatedMarcomType` fields. Delete the entire `src/lib/tasks/` directory after all consumers are migrated.

### ADR-6: Delete task-specific store slices

Remove `createTaskSlice`, `createSpaceSlice`, `createAutomationSlice`. The Projects Board reads from `marcomDataStore` (already used by all marcom views), not from the workspace store task state.

### ADR-7: Projects List/Calendar/Gantt also show marcom work items

- **List view:** Sortable table of all three entity types with type-specific columns
- **Calendar view:** ContentPost positioned by `publishDate`; FieldEvent positioned by `startDate`; Placement positioned by `date`
- **Gantt view:** FieldEvents as bars (startDate → endDate); ContentPost as single-day markers; Placement as single-day markers

### ADR-8: Task TypeScript types removed last

`Task`, `Subtask`, `Space`, `Folder`, `List`, `Status`, `Tag`, `TaskComment`, `ActivityLog`, `Priority`, `RelatedMarcomType` removed from `src/types/index.ts` after all consumers are confirmed eliminated.

---

## Consequences

**Positive:**
- Projects mode survives with a familiar UI surface, now backed by real marcom data
- No sync bridge → no sync failures
- Codebase shrinks significantly (~4,000+ lines deleted)
- Single source of truth: each marcom entity owns its own status

**Negative:**
- Projects Board requires new adapter layer to unify three different entity types into cards
- Card drag needs per-type API dispatch logic
- General task data is permanently deleted (irreversible)

**Risks:**
- Unified status mapping across three entity types is an opinion — edge cases may arise
- Gantt view requires careful handling of missing dates (Placement has no endDate, ContentPost has no startDate)
