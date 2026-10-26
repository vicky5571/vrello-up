# Plan: Remove Multi-Workspace Layer — vrello-up

**Plan ID:** `2026-10-27-remove-workspace-single-tenant`
**Spec:** `docs/superpowers/specs/2026-10-27-remove-workspace-single-tenant-design.md`
**Date:** 2026-10-27
**Est. LOC Change:** ~-1,500 LOC net (removal only)

---

## File Manifest

| Phase | Target | Files | Est. LOC Δ |
|---|---|---|---|
| 0 | Fork repo | git | — |
| 1 | Prisma schema | `schema.prisma` | -60 |
| 2 | Prisma migration | `migrations/` (NEW) | +30 |
| 3 | SSOT types | `src/types/index.ts` | -25 |
| 4 | New constant | `src/lib/constants/workspace.ts` (NEW) | +3 |
| 5 | DELETE workspace-only lib files | 3 files | -640 |
| 6 | Rewrite store types + coordinator | `slices/types.ts`, `useWorkspaceStore.ts` | -40 |
| 7 | Update remaining store slices | `createSpaceSlice.ts`, `createTaskSlice.ts`, `createAutomationSlice.ts` | -50 |
| 8 | Update store operations (8 files) | spaces, task, comment, tag, trash, dep, automation, backup | -80 |
| 9 | Rewrite `workspaceSync.ts` → `spaceSync.ts` | `src/lib/store/spaceSync.ts` | -40 |
| 10 | DELETE workspaceAuth + workspaces API route | 2 files | -630 |
| 11 | Update tasks API routes | 3 route files | -50 |
| 12 | Update marcom API routes | 14 route files | -100 |
| 13 | Rewrite marcomDataStore | `marcomDataStore.ts`, `auth.ts`, `permissions.ts` | -60 |
| 14 | DELETE workspace modals | 3 component files | -435 |
| 15 | Update layout components | 8 files | -120 |
| 16 | Update view components | ~30 view files | -150 |
| 17 | Update router/URL state | 2 files | -20 |
| 18 | Update taskQuery | `taskQuery.ts` | -20 |
| 19 | DELETE workspace test files | 5 test files | -400 |
| 20 | Update remaining test fixtures | ~12 test files | -80 |
| 21 | Update realtimeHub | `realtimeHub.ts`, `useRealtime.ts` | -30 |
| 22 | Full verification | — | — |

---

## Phase 0 — Fork Repo (MANDATORY FIRST)

```bash
# Buat repo kosong vicky5571/vrello-up-workspace di GitHub dulu
git remote add vrello-up-workspace https://github.com/vicky5571/vrello-up-workspace.git
git push vrello-up-workspace vicky:main
git remote remove vrello-up-workspace
```

**Checkpoint:** Buka https://github.com/vicky5571/vrello-up-workspace — repo terisi.

---

## Phase 1 — Prisma Schema

File: `prisma/schema.prisma`

- [ ] Hapus seluruh `model WorkspaceMember { ... }`
- [ ] Hapus seluruh `model WorkspaceItem { ... }` (beserta semua relasi ke sana)
- [ ] Di `SpaceItem`: hapus field `workspaceId String`, `workspace WorkspaceItem @relation(...)`, `@@index([workspaceId])`
- [ ] Di `Placement`: hapus field `workspaceId`, `workspace WorkspaceItem @relation(...)`, `@@index([workspaceId])`
- [ ] Di `Mou`: sama
- [ ] Di `FieldEvent`: sama
- [ ] Di `ContentPost`: sama
- [ ] Di `DocumentItem`: sama
- [ ] Di `MonthlyReport`: sama
- [ ] Hapus `enum MarcomRole` jika hanya dipakai di `WorkspaceMember`

**Checkpoint:** `npx prisma validate` → OK.

---

## Phase 2 — Generate Prisma Migration

```bash
npx prisma migrate dev --name remove_workspace_tenant
npx prisma generate
```

**Checkpoint:** Migration file terbuat di `prisma/migrations/`. `npx prisma studio` → tabel WorkspaceItem/WorkspaceMember tidak ada.

---

## Phase 3 — SSOT Types (`src/types/index.ts`)

- [ ] Hapus `export interface Workspace { ... }`
- [ ] Hapus `export type WorkspaceRole = "admin" | "staff" | "viewer";`
- [ ] Dari `export interface Space { ... }`: hapus field `workspaceId: string`

**Checkpoint:** `grep -n "Workspace\b\|WorkspaceRole" src/types/index.ts` → 0 results.

---

## Phase 4 — New Constant File

Create `src/lib/constants/workspace.ts`:
```ts
/** Single hardcoded workspace ID — system is single-tenant by design. */
export const WS_MAIN_ID = "ws-main" as const;
```

---

## Phase 5 — DELETE Workspace-Only Lib Files

```bash
rm src/lib/store/workspaceCrud.ts
rm src/lib/store/workspaceSwitch.ts
rm src/lib/server/workspaceAuth.ts
```

---

## Phase 6 — Store Types + Coordinator

### `src/lib/store/slices/types.ts`
- [ ] Remove `workspaces: Workspace[]`
- [ ] Remove `activeWorkspaceId: string`
- [ ] Add `spaces: Space[]`
- [ ] Remove `fetchServerTasks(workspaceId?: string)` → rename to `fetchServerData()`
- [ ] Remove `setActiveWorkspace`, `addWorkspace`, `updateWorkspace`, `deleteWorkspace` from `StoreActions`
- [ ] Remove `workspaceSync` actions

### `src/lib/store/useWorkspaceStore.ts`
- [ ] Remove `createWorkspaceSlice` import + composition
- [ ] Add `spaces: INITIAL_SPACES` to initial state (move initial space from old workspace slice)
- [ ] Adjust localStorage persistence: serialize/deserialize `spaces[]` directly

---

## Phase 7 — Update Store Slices

### `src/lib/store/slices/createWorkspaceSlice.ts`
- [ ] **REPLACE** this file with `createDataSlice.ts` — only `fetchServerData()` action (fetches spaces + tasks from `/api/tasks`)

### `src/lib/store/slices/createSpaceSlice.ts`
- [ ] All methods: replace `state.workspaces.find(ws => ws.id === state.activeWorkspaceId)` → direct `state.spaces`
- [ ] `addSpace`: push to `state.spaces` directly
- [ ] `deleteSpace`: filter from `state.spaces`
- [ ] `updateSpace`: map over `state.spaces`

### `src/lib/store/slices/createTaskSlice.ts`
- [ ] Replace workspace nesting traversal with direct `spaces[]` traversal
- [ ] Remove `activeWorkspaceId` references

### `src/lib/store/slices/createAutomationSlice.ts`
- [ ] Same: traverse `spaces[]` directly

---

## Phase 8 — Update Store Operation Modules

For each of these files, replace `workspaces: Workspace[]` param with `spaces: Space[]` and remove workspace nesting logic:

- [ ] `src/lib/store/spacesOperations.ts`
- [ ] `src/lib/store/taskOperations.ts`
- [ ] `src/lib/store/commentOperations.ts`
- [ ] `src/lib/store/tagOperations.ts`
- [ ] `src/lib/store/trashOperations.ts`
- [ ] `src/lib/store/dependencyOperations.ts`
- [ ] `src/lib/store/automationOperations.ts`
- [ ] `src/lib/store/backupOperations.ts` — update import/export JSON shape (remove `workspaces` wrapper)

**Checkpoint:** `grep -n "workspaces\b\|activeWorkspaceId\|Workspace\b" src/lib/store/*.ts` → 0 results.

---

## Phase 9 — Rewrite workspaceSync.ts → spaceSync.ts

- [ ] Rename file to `src/lib/store/spaceSync.ts`
- [ ] Remove `findWorkspaceForListId`, `reconcileWorkspaces`
- [ ] Keep `findSpaceForListId(spaces: Space[], listId)` — simplified signature
- [ ] Remove `shouldSyncToServer` workspace reconciliation logic
- [ ] Update all imports from `workspaceSync` → `spaceSync`

---

## Phase 10 — DELETE Server Auth + Workspaces API

```bash
rm src/app/api/workspaces/route.ts
# workspaceAuth.ts already deleted in Phase 5
```

Update `src/lib/marcom/auth.ts` to remove workspace-scoped auth check.
Update `src/lib/marcom/permissions.ts` to remove workspace permission checks.

---

## Phase 11 — Update Tasks API Routes

### `src/app/api/tasks/route.ts`
- [ ] Remove `workspaceId` query param handling
- [ ] Remove `requireWorkspaceAccess` guard
- [ ] Remove `WorkspaceItem.findMany` + `WorkspaceMember` queries
- [ ] Simplify GET: fetch all spaces + tasks without workspace filter
- [ ] Simplify auto-seed: create single `SpaceItem` with `WS_MAIN_ID`-less (SpaceItem no longer has workspaceId)

### `src/app/api/tasks/[id]/route.ts`
- [ ] Remove `requireWorkspaceAccess(existingTask.list.space.workspaceId, ...)`

### `src/app/api/tasks/[id]/comments/route.ts`
- [ ] Remove `requireWorkspaceAccess` call

**Checkpoint:** `grep -n "requireWorkspaceAccess\|workspaceId" src/app/api/tasks/**/*.ts` → 0 results.

---

## Phase 12 — Update Marcom API Routes (14 files)

For each file, remove:
- `workspaceId` from query params / request body
- `requireWorkspaceAccess` guard
- `workspaceId` from Prisma `where` clause
- `workspaceId` from Prisma `create` / `update` data

Files:
- [ ] `src/app/api/marcom/events/route.ts`
- [ ] `src/app/api/marcom/events/[id]/route.ts`
- [ ] `src/app/api/marcom/content/route.ts`
- [ ] `src/app/api/marcom/content/[id]/route.ts`
- [ ] `src/app/api/marcom/mous/route.ts`
- [ ] `src/app/api/marcom/mous/[id]/route.ts`
- [ ] `src/app/api/marcom/placements/route.ts`
- [ ] `src/app/api/marcom/placements/[id]/route.ts`
- [ ] `src/app/api/marcom/documents/route.ts`
- [ ] `src/app/api/marcom/documents/[id]/route.ts`
- [ ] `src/app/api/marcom/reports/route.ts`
- [ ] `src/app/api/marcom/reports/[id]/route.ts`
- [ ] `src/app/api/marcom/reports/draft/route.ts`
- [ ] `src/app/api/marcom/analytics/route.ts`
- [ ] `src/app/api/marcom/pipeline/route.ts`
- [ ] `src/app/api/marcom/outlets/route.ts` (check for workspace refs)

**Checkpoint:** `grep -rn "requireWorkspaceAccess\|workspaceId" src/app/api/marcom/` → 0 results.

---

## Phase 13 — Rewrite Marcom Data Store

### `src/lib/marcom/marcomDataStore.ts`
- [ ] Remove `workspaceId: string` from all method signatures
- [ ] Change cache keys from `workspaceId` to static constant (single global cache)
- [ ] Update all `fetchPosts(wsId)` → `fetchPosts()`

### `src/lib/marcom/auth.ts`
- [ ] Remove workspace-scoped auth

### `src/lib/marcom/permissions.ts`
- [ ] Remove workspace permission model

---

## Phase 14 — DELETE Workspace UI Components

```bash
rm src/components/workspaces/CreateWorkspaceModal.tsx
rm src/components/workspaces/EditWorkspaceModal.tsx
rm src/components/layout/WorkspaceMenuDropdown.tsx
rmdir src/components/workspaces/  # if empty
```

---

## Phase 15 — Update Layout Components

### `src/components/layout/TopNav.tsx`
- [ ] Remove workspace switcher button + `WorkspaceMenuDropdown` usage
- [ ] Remove `onOpenCreateWorkspace`, `onOpenEditWorkspace` props
- [ ] Show static org name (e.g. "vrello" or configurable env var)

### `src/components/layout/TopNavActionModals.tsx`
- [ ] Remove `showCreateWorkspace`, `showEditWorkspace` state
- [ ] Remove workspace modal renders

### `src/components/layout/GlobalRail.tsx`
- [ ] Remove workspace avatar/initial display
- [ ] Remove workspace switcher logic

### `src/components/layout/Sidebar.tsx`
- [ ] Replace `workspaces.find(ws => ws.id === activeWorkspaceId)?.spaces` → `spaces` from store

### `src/components/layout/CommandPalette.tsx`
- [ ] Remove workspace switching commands

### Other layout components (FilterBar, ExportCenter, NotificationCenter, TopNavBreadcrumbs, AppModeSegmentedControl, ViewSwitcher)
- [ ] Remove `activeWorkspaceId` from props and store selector

---

## Phase 16 — Update View Components (~30 files)

Pattern for all view components:
```tsx
// BEFORE
const activeWorkspaceId = useWorkspaceStore(s => s.activeWorkspaceId);
// pass activeWorkspaceId to marcomDataStore.fetchEvents(activeWorkspaceId)

// AFTER
// marcomDataStore.fetchEvents() — no workspace param
```

Files include all views in:
- `src/components/views/EventsView/`
- `src/components/views/ContentPlannerView/`
- `src/components/views/MousView/`
- `src/components/views/PlacementsView/`
- `src/components/views/DocumentsView/`
- `src/components/views/ReportsView/`
- `src/components/views/AnalyticsView/`
- `src/components/views/BoardView/`
- `src/components/views/ListView/`
- `src/components/views/CalendarView/`
- `src/components/views/GanttView/`
- `src/components/views/HomeView/`
- `src/components/views/PipelineView/`
- `src/components/tasks/` (TaskDrawer, CreateTaskModal, TaskActivityFeed)
- `src/components/auth/AuthSync.tsx`

---

## Phase 17 — Router / URL State

### `src/lib/router/urlState.ts`
- [ ] Remove `wsId` from URL state shape

### `src/lib/router/useUrlStateSync.ts`
- [ ] Remove workspace sync from URL params

---

## Phase 18 — taskQuery.ts

### `src/lib/tasks/taskQuery.ts`
- [ ] Remove `buildTaskTenantWhere` function
- [ ] Rename `fetchTasksForWorkspace` → `fetchAllTasks`; remove workspace filter

---

## Phase 19 — DELETE Workspace Test Files

```bash
rm src/lib/store/workspaceCrud.test.ts
rm src/lib/store/workspaceSwitch.test.ts
rm src/lib/tasks/taskTenantScoping.test.ts
rm src/lib/server/workspaceAuth.test.ts
rm src/lib/marcom/workItemsTenant.test.ts
```

---

## Phase 20 — Update Remaining Test Fixtures

For each `*.test.ts` in `src/lib/store/` that uses:
```ts
workspaces: [{ id: "ws-main", spaces: [...] }]
```
Rewrite to:
```ts
spaces: [...]
```

Files:
- [ ] `src/lib/store/taskCrud.test.ts`
- [ ] `src/lib/store/spaces.test.ts`
- [ ] `src/lib/store/trash.test.ts`
- [ ] `src/lib/store/backupRestore.test.ts`
- [ ] `src/lib/store/commentOperations.test.ts`
- [ ] `src/lib/store/dependencies.test.ts`
- [ ] `src/lib/store/tagOperations.test.ts`
- [ ] `src/lib/store/automationRules.test.ts`
- [ ] `src/lib/store/marcomNavigation.test.ts`
- [ ] `src/lib/store/marcomViews.test.ts`
- [ ] Other test files as TS errors guide

---

## Phase 21 — Realtime Hub

### `src/lib/server/realtimeHub.ts`
- [ ] Remove `workspaceId` from `broadcastTaskUpsert`, `broadcastTaskDelete` signatures
- [ ] Remove workspace-scoped SSE channels

### `src/lib/hooks/useRealtime.ts`
- [ ] Remove `activeWorkspaceId` from SSE subscription

---

## Phase 22 — Full Verification

```bash
# Scan remaining workspace refs (must be 0 outside migration SQL)
grep -rn "workspaceId\|WorkspaceItem\|WorkspaceMember\|activeWorkspaceId\|switchWorkspace\|Workspace\b" \
  src/ app/ --include="*.ts" --include="*.tsx"

# Type check
npm run build

# Test suite
npm test

# DB migration
npx prisma migrate dev --name remove_workspace_tenant
npx prisma generate
```

**All gates must pass:**
- `grep` → 0 results
- `npm run build` → 0 errors
- `npm test` → 0 failures

---

## Sequencing Rules

```
Phase 0 (Fork) → MANDATORY BEFORE ALL
Phase 1-4 (Schema + Types) → BEFORE Phase 5+
Phase 5 (DELETE files) → After Phase 3 (TS guides errors)
Phase 6-9 (Store) → After Phase 3
Phase 10-12 (API) → After Phase 5-6
Phase 13 (Marcom store) → After Phase 12
Phase 14-16 (UI) → After Phase 6, 13
Phase 17-18 (Router, taskQuery) → After Phase 6
Phase 19-20 (Tests) → After Phase 3 (TS errors guide which fixtures to update)
Phase 21 (Realtime) → After Phase 12
Phase 22 (Verify) → AFTER ALL
```

---

## Commit Convention

```
refactor(workspace): remove multi-workspace layer — single-tenant simplification

Collapses vrello-up from multi-workspace to permanent single-workspace.
Removes WorkspaceItem/WorkspaceMember Prisma models, workspaceId FK
from all 7 operational models, workspace switching UI, RBAC guards,
and workspace-keyed marcom caches.

Spec: docs/superpowers/specs/2026-10-27-remove-workspace-single-tenant-design.md
Plan: docs/superpowers/plans/2026-10-27-remove-workspace-single-tenant.md
```
