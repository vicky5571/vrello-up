# Spec: Remove Multi-Workspace Layer (Single-Tenant Simplification)

**Spec ID:** `2026-10-27-remove-workspace-single-tenant`
**Status:** Approved
**Author:** AI Pair Programmer
**Date:** 2026-10-27
**Branch Target:** `vicky`

---

## 1. Executive Summary

`vrello-up` currently supports multiple workspaces per user with:
- `WorkspaceItem` and `WorkspaceMember` Prisma models
- Workspace switching UI (dropdown in TopNav), create/edit/delete workspace modals
- All 7 Marcom operational models scoped via `workspaceId` FK (`Placement`, `Mou`, `FieldEvent`, `ContentPost`, `DocumentItem`, `MonthlyReport`, + `SpaceItem`)
- RBAC: `validateWorkspaceAccess()` guards on every API route
- Zustand store: `workspaces[]`, `activeWorkspaceId`, multi-workspace slice logic
- Client marcom cache: all `marcomDataStore` fetch methods keyed by `workspaceId`

Since this system will be used by **one organization only**, the multi-workspace layer is overhead. This refactoring collapses to a **permanently hardcoded single workspace** `ws-main`.

**Pre-condition (MANDATORY):** Fork repo to `vicky5571/vrello-up-workspace` BEFORE any code change.

---

## 2. Pre-Condition: Fork Repo First

```bash
# Create vicky5571/vrello-up-workspace on GitHub first, then:
git remote add vrello-up-workspace https://github.com/vicky5571/vrello-up-workspace.git
git push vrello-up-workspace vicky:main
git remote remove vrello-up-workspace
```

---

## 3. Scope Audit

### 3.1 Prisma Schema

| Change | Detail |
|---|---|
| DELETE `model WorkspaceMember` | Entire model |
| DELETE `model WorkspaceItem` | Entire model |
| REMOVE `workspaceId` + `workspace WorkspaceItem @relation` + `@@index([workspaceId])` | From `SpaceItem`, `Placement`, `Mou`, `FieldEvent`, `ContentPost`, `DocumentItem`, `MonthlyReport` |
| New migration | `prisma migrate dev --name remove_workspace_tenant` |

### 3.2 SSOT Types (`src/types/index.ts`)

| Change | Detail |
|---|---|
| DELETE `interface Workspace` | Entire interface |
| DELETE `type WorkspaceRole` | Entire type |
| REMOVE `workspaceId` from `Space` | Space becomes top-level |
| EXPORT constant `WS_MAIN_ID = "ws-main"` | From `src/lib/constants/workspace.ts` (new) |

### 3.3 Zustand Store

| File | Change |
|---|---|
| `src/lib/store/slices/types.ts` | Remove `workspaces: Workspace[]`, `activeWorkspaceId`. Add `spaces: Space[]` |
| `src/lib/store/slices/createWorkspaceSlice.ts` | DELETE |
| `src/lib/store/workspaceCrud.ts` | DELETE |
| `src/lib/store/workspaceSwitch.ts` | DELETE |
| `src/lib/store/workspaceSync.ts` | Rewrite: operate on `spaces[]` directly (no workspace nesting) |
| `src/lib/store/useWorkspaceStore.ts` | Remove `createWorkspaceSlice`; add `spaces` state |
| `src/lib/store/slices/createSpaceSlice.ts` | Operate on `spaces[]` directly |
| `src/lib/store/slices/createTaskSlice.ts` | Traverse `spaces[]` directly |
| `src/lib/store/slices/createAutomationSlice.ts` | Traverse `spaces[]` directly |
| Other store operations (spaces, task, comment, tag, trash, dep, automation, backup) | Remove `workspaces.find(ws => ws.id === activeId)` wrapper → use `spaces[]` directly |

### 3.4 Server / API Layer

| File | Change |
|---|---|
| `src/lib/server/workspaceAuth.ts` | DELETE |
| `src/app/api/workspaces/route.ts` | DELETE |
| `src/app/api/tasks/route.ts` | Remove `workspaceId` param, `requireWorkspaceAccess`, `WorkspaceItem` queries. Auto-seed logic simplified. |
| `src/app/api/tasks/[id]/route.ts` | Remove `requireWorkspaceAccess` |
| `src/app/api/tasks/[id]/comments/route.ts` | Remove `requireWorkspaceAccess` |
| All 14 marcom API routes | Remove `workspaceId` query param, `requireWorkspaceAccess`, workspace filter in Prisma queries |
| `src/lib/server/realtimeHub.ts` | Remove `workspaceId` from broadcast args |
| `src/lib/tasks/taskQuery.ts` | Remove `buildTaskTenantWhere`; simplify to `fetchAllTasks` |

### 3.5 Marcom Data Store

| File | Change |
|---|---|
| `src/lib/marcom/marcomDataStore.ts` | Remove `workspaceId` from all cache keys and method signatures. Caches are global. |
| `src/lib/marcom/auth.ts` | Remove workspace-scoped auth |
| `src/lib/marcom/permissions.ts` | Remove workspace permission checks |

### 3.6 Client Components (UI)

| File | Change |
|---|---|
| `src/components/workspaces/CreateWorkspaceModal.tsx` | DELETE |
| `src/components/workspaces/EditWorkspaceModal.tsx` | DELETE |
| `src/components/layout/WorkspaceMenuDropdown.tsx` | DELETE |
| `src/components/layout/TopNav.tsx` | Remove workspace switcher; show static org name |
| `src/components/layout/TopNavActionModals.tsx` | Remove workspace modal state/handlers |
| `src/components/layout/Sidebar.tsx` | Operate on `spaces[]` directly |
| `src/components/layout/GlobalRail.tsx` | Remove workspace avatar/switcher |
| `src/components/layout/CommandPalette.tsx` | Remove workspace commands |
| All marcom view components | Remove `activeWorkspaceId` prop; use global `spaces[]` |
| All task view components | Same |
| `src/components/modals/InviteModal.tsx` | Remove workspace member invite |
| `src/components/modals/TeamsModal.tsx` | Remove workspace team mgmt |
| `src/components/modals/SettingsModal.tsx` | Remove workspace settings tab |

### 3.7 Router / URL State

| File | Change |
|---|---|
| `src/lib/router/urlState.ts` | Remove `wsId` from URL state |
| `src/lib/router/useUrlStateSync.ts` | Remove workspace sync |

### 3.8 Test Files

**DELETE** (entirely workspace-scoped):
- `src/lib/store/workspaceCrud.test.ts`
- `src/lib/store/workspaceSwitch.test.ts`
- `src/lib/tasks/taskTenantScoping.test.ts`
- `src/lib/server/workspaceAuth.test.ts`
- `src/lib/marcom/workItemsTenant.test.ts`

**UPDATE** (remove workspace fixture wrappers):
- All `*.test.ts` in `src/lib/store/` that use `workspaces: [{ id, spaces: [...] }]` → use `spaces: [...]` directly

---

## 4. Non-Goals

- Do NOT remove user auth (NextAuth remains)
- Do NOT change Branch/Outlet/Material master data models
- Do NOT refactor Marcom domain features
- Do NOT change task CRUD logic beyond removing workspace traversal

---

## 5. Acceptance Criteria

- [ ] Fork pushed and verified
- [ ] `grep -rn "workspaceId\|WorkspaceItem\|WorkspaceMember\|activeWorkspaceId\|switchWorkspace" src/ app/` → 0 results
- [ ] Prisma migration generated and applied
- [ ] `npm test` → 0 failures
- [ ] `npm run build` → 0 TypeScript errors
- [ ] App loads: spaces visible, task CRUD works, Marcom views load, no workspace dropdown
