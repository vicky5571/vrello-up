# Spec — Unified Projects Work Item Creation via Original Marcom Hub Forms

**Date:** 2026-11-01  
**Status:** DRAFT  
**Scope:** Projects View creation architecture (`ProjectsCreateModalHost.tsx`, `ProjectsCalendarView.tsx`, `ProjectsBoardView.tsx`, `ProjectsListView.tsx`, `ProjectsBoardColumn.tsx`, `ProjectsListHeader.tsx`, `createModalHelpers.ts`)  
**Refs:** Issue 2 — Runtime Bug & Dummy Data in Projects Quick Create; User Decision on Marcom Hub Form Consistency

---

## 1. Executive Summary

Previously, creating work items from the Projects views (Kanban Board, List, and Calendar) relied on "quick create" functions (`useProjectsCalendar.handleCreateType`, `useProjectsBoard.handleQuickCreate`, `useProjectsList.handleQuickAddInGroup`). These functions attempted blind, minimal HTTP POST requests bypassing the official Marcom Hub creation workflows. This caused severe deficiencies:
1. **Runtime HTTP 400 Errors:** Media placement creation sent an invalid status `"PLANNED"` (rejected by the API route which only allows `"NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE"`).
2. **Data Corruption & Dummy Placeholders:** Placements were created with arbitrary initial outlets (`outlets[0]`) and materials (`materials[0]`), without photos, dimensions, or geofence verification. Events were created with generic names, missing budgets, checklists, or equipment. Content posts bypassed formats, captions, and platform-specific assets.
3. **Inconsistent User Experience:** Users creating an item in Projects experienced an incomplete shortcut, while creating in Marcom Hub provided rich, validated multi-step wizards.

This specification establishes **`ProjectsCreateModalHost.tsx`**, mirroring the proven architecture of `ProjectsDetailDrawerHost.tsx`. Whenever a user initiates creation from Calendar (`+ Add` on date), Board (`+` on column), or List (`+ New Work Item` / `+ Add in group`), the system launches the **exact original, official Marcom Hub creation modal** for that work item type (`ContentPostModal`, `EventFormModal`, or `PlacementFormModal`), pre-populated with context (such as the target date or initial workflow status).

---

## 2. UX Flow & Interaction

```
[Trigger Point]
├── Calendar: Click "+ Add" on date cell ──> CalendarCreatePopover ─(pick type)─┐
├── Board: Click "+" on Column Header ────> ColumnTypePickerMenu ─(pick type)──┼──> setCreateRequest({ type, date?, status? })
└── List: Click "+ New Work Item" Button ──> ListTypePickerMenu ──(pick type)──┘                 │
                                                                                                 ▼
                                                                                   [ProjectsCreateModalHost.tsx]
                                                                                                 │
                                                        ┌────────────────────────────────────────┼────────────────────────────────────────┐
                                                        │                                        │                                        │
                                                        ▼                                        ▼                                        ▼
                                            type === "content"                       type === "event"                         type === "placement"
                                                        │                                        │                                        │
                                                        ▼                                        ▼                                        ▼
                                              [ContentPostModal]                         [EventFormModal]                         [PlacementFormModal]
                                              - Pre-fills publishDate                    - Pre-fills defaultDate                  - Pre-fills date & status
                                              - Platform & format picker                 - Budget, attendees & location           - 4-step POSM wizard:
                                              - Caption & Drive picker                   - Equipment & checklist                     1. Outlet selection
                                                        │                                        │                                   2. Material & theme
                                                        │                                        │                                   3. Photo & notes
                                                        │                                        │                                   4. Geofence verification
                                                        ▼                                        ▼                                        │
                                              (POST /api/marcom/content)               (POST /api/marcom/events)                          ▼
                                                        │                                        │                             (POST /api/marcom/placements)
                                                        └────────────────────────────────────────┼────────────────────────────────────────┘
                                                                                                 ▼
                                                                                  Zustand Cache Invalidation & Refresh
                                                                                  - fetchPosts() / fetchEvents() / fetchPlacements()
                                                                                  - toast.success("{type} created successfully")
                                                                                  - Close Host & Reset Request
```

1. **Calendar Date Cell Creation:**
   - Double-clicking or clicking `+ Add` on a calendar date cell (e.g. `2026-11-15`) opens the type popover.
   - User picks "+ New Content Post" -> Opens `ContentPostModal` with `publishDate = "2026-11-15"`.
   - User picks "+ New Field Event" -> Opens `EventFormModal` with `event = null` and `defaultDate = "2026-11-15"`.
   - User picks "+ New Placement" -> Opens `PlacementFormModal` with initial state `{ date: "2026-11-15", status: "NOT_STARTED" }`.
2. **Kanban Board Column Creation:**
   - Clicking `+` on a column header (e.g. `To Do`, `In Progress`, `In Review`) displays a lightweight popover: `Content Post`, `Field Event`, `Media Placement`.
   - The selected type opens with the column-mapped status (e.g., creating a placement in `In Progress` initializes `status = "ON_PROGRESS"`).
3. **List View Creation:**
   - A standardized `+ New Work Item` button in `ProjectsListHeader` triggers the type selector.
   - Clicking `+ Add in this group` when grouped by type directly launches the corresponding original modal.
4. **Resilience & Validation:**
   - Zero raw HTTP mutations occur with unvalidated dummy strings.
   - All role-based authorization checks (`can("CREATE_EVENT")`, `can("CREATE_PLACEMENT")`) are respected before rendering actions.

---

## 3. Data Contracts & SSOT

Pure helper module: `src/components/views/ProjectsView/createModalHelpers.ts`

```typescript
import type { MarcomWorkItemType, ProjectsColumn, PostStatus, EventStatus, PlacementStatus } from "@/types";

export interface CreateWorkItemRequest {
  type: MarcomWorkItemType;
  date?: string; // YYYY-MM-DD or ISO string
  status?: string; // column-mapped initial status
  branchId?: string;
  outletId?: string;
}

export interface InitialFormState<T> {
  isValid: boolean;
  data: T;
}

export function resolveInitialStatus(type: MarcomWorkItemType, column?: ProjectsColumn): string | undefined;

export function sanitizeDateInput(dateStr?: string | null): string;
```

---

## 4. Component Interface (`ProjectsCreateModalHost.tsx`)

```typescript
export interface ProjectsCreateModalHostProps {
  createRequest: CreateWorkItemRequest | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function ProjectsCreateModalHost(props: ProjectsCreateModalHostProps): React.JSX.Element | null;
```

* Dynamically imports `ContentPostModal`, `EventFormModal`, and `PlacementFormModal` via `next/dynamic` (`ssr: false`).
* Automatically retrieves branches, outlets, materials, MOUs, and member lists from `useMarcomDataStore` and `useWorkspaceStore`.
* Manages `isSaving` state and invokes corresponding store refetchers upon completion (`fetchPosts()`, `fetchEvents()`, `fetchPlacements()`).

---

## 5. Acceptance Criteria & Verification Checklist

- [ ] **ProjectsCreateModalHost Component:**
  - Lazily loads all 3 original Marcom modals with zero SSR hydration mismatch.
  - Passes pre-filled date and status without mutation.
  - Submits valid payloads adhering strictly to domain schemas.
- [ ] **Calendar Integration:**
  - Double click or `+ Add` on date cell opens the original add form with date pre-selected.
  - Saving immediately reflects the new card on that calendar date.
- [ ] **Board Integration:**
  - Clicking `+` on column opens the original add form with status aligned to column.
  - Obsolete inline dummy submit form removed from `ProjectsBoardColumn.tsx` (reducing LOC).
- [ ] **List Integration:**
  - `ProjectsListHeader` or table action launches original modal.
- [ ] **Codebase Health & Invariants:**
  - `ProjectsCreateModalHost.tsx` LOC strictly $\le 250$ lines.
  - `ProjectsBoardColumn.tsx` LOC strictly $\le 250$ lines.
  - `npm run drift:check` passes (0 drift).
  - `npm run build:check` passes (0 TypeScript errors).
  - `npm test` passes (all unit and smoke tests passing).

---

## 6. Non-Goals

- Creating a new custom multi-entity form from scratch (we explicitly reuse existing Marcom Hub forms).
- Modifying the underlying database schema or API endpoint contracts.

