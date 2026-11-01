# Spec — Session RBAC & Permissions Synchronization

**Date:** 2026-11-01  
**Status:** DRAFT  
**Scope:** Marcom RBAC permissions hook, NextAuth session claims, and unified view button visibility (`src/lib/marcom/permissions.ts`, `src/lib/marcom/permissionsHelpers.ts`, `src/auth.ts`, `src/auth.config.ts`, `src/types/next-auth.d.ts`)  
**Refs:** Missing Add Buttons on Media Placements, Field Events, MOU, Branches, Outlets, Equipment Inventory, Documents  

---

## 1. Executive Summary

In all seven primary operational views across Marcom Hub:
1. **Media Placements** (`PlacementsHeader.tsx:69` — `canManage = can("CREATE_PLACEMENT")`)
2. **Field Events** (`EventsHeader.tsx:74` — `canManage = can("CREATE_EVENT")`)
3. **MOU** (`MousHeader.tsx:108` — `canCreate = can("CREATE_MOU")`)
4. **Branches** (`BranchesHeader.tsx:86` — `canAddBranch = canManage || role !== "viewer"`)
5. **Outlets** (`OutletsHeader.tsx:101` — `canAddOutlet = canManage || role !== "viewer"`)
6. **Equipment Inventory** (`InventoryHeaderKpis.tsx:96` — `canManage = can("MANAGE_INVENTORY")`)
7. **Documents** (`DocumentsHeader.tsx:81` — `canUpload = can("UPLOAD_DOCUMENT")`)

The "+ Add / New / Upload" action button is conditionally rendered based on permissions evaluated by `useMarcomPermissions()`.

Currently, `useMarcomPermissions()` in `src/lib/marcom/permissions.ts` resolves the user's role against a static array `const members = SEED_USERS` from `src/lib/constants/seeds.ts` (which only contains mock IDs `"user-1"` through `"user-5"`). When a user logs in via NextAuth (Credentials or Google OAuth), their actual database ID (e.g. `"user-admin"` or a CUID) is set to `currentUserId`. Because this real ID is not in `SEED_USERS`, `resolveMarcomRole` defaults to `"viewer"`. In `guards.ts`, a `"viewer"` only has permissions `["EXPORT_REPORTS", "VIEW_INVENTORY"]`. Consequently, every single Add button in the application is hidden for logged-in staff and admins.

Additionally, NextAuth's `session.user` currently omits `assignedBranchIds` (a database column in Prisma `User`), preventing branch-scoped permissions from evaluating accurately in the client.

This specification unifies the RBAC permission resolution by:
1. Hydrating `assignedBranchIds` through NextAuth JWT and session callbacks.
2. Creating a pure helper `permissionsHelpers.ts` that derives authoritative permissions prioritizing active `session.user`, with clean fallback to Zustand store state for SSR, mock, and test environments.
3. Updating `useMarcomPermissions()` to read `useSession()` and evaluate permissions accurately for the logged-in user.
4. Ensuring full visibility of Add buttons for authorized roles (Admin, Supervisor, Staff).

---

## 2. Architecture & Data Flow

```
[NextAuth Provider / useSession()] ──────┐
                                         ├─► [permissionsHelpers.resolveEffectivePermissionsUser]
[Zustand useWorkspaceStore] ────────────┘         │
  - currentUserId                                  │
  - users fallback                                 ▼
                                       { role, assignedBranchIds, isAuthenticated }
                                                   │
                                                   ▼
                                       [useMarcomPermissions Hook]
                                         - can(action, targetBranchId?)
                                         - canAccessBranch(targetBranchId?)
                                         - role, assignedBranchIds
                                                   │
                                                   ├──────────────────────────────────────┐
                                                   ▼                                      ▼
                                       [View Headers / Toolbars]              [Detail Drawers / Tables]
                                       - Add Placement (PlacementsHeader)     - Approve/Reject Outlet
                                       - New Field Event (EventsHeader)       - Approve/Delete MOU
                                       - New MOU (MousHeader)                 - Manage Master Data
                                       - Tambah Branch (BranchesHeader)       - Approve Borrow Item
                                       - Add Outlet (OutletsHeader)
                                       - Add Item (InventoryHeader)
                                       - Upload Document (DocumentsHeader)
```

### 2.1 Role Hierarchy & Capabilities

| Role | Operational Rights | Scope |
|---|---|---|
| **admin** | All actions permitted (`CREATE_*`, `MANAGE_*`, `DELETE_*`, `APPROVE_*`) | Unrestricted (all branches) |
| **supervisor** | `CREATE_*`, `UPDATE_*`, `APPROVE_*`, `DELETE_*` | Restricted to `assignedBranchIds` |
| **staff** | `CREATE_PLACEMENT`, `CREATE_EVENT`, `CREATE_MOU`, `SUBMIT_DRAFT_OUTLET`, `REQUEST_BORROW` | Restricted to `assignedBranchIds` |
| **viewer** | `EXPORT_REPORTS`, `VIEW_INVENTORY` | Read-only |

---

## 3. Interfaces & Contracts

### 3.1 NextAuth Typings (`src/types/next-auth.d.ts`)

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      assignedBranchIds?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    status?: UserStatus;
    assignedBranchIds?: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    assignedBranchIds?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    assignedBranchIds?: string[];
  }
}
```

### 3.2 Pure Helper Contract (`src/lib/marcom/permissionsHelpers.ts`)

```typescript
import type { MarcomRole } from "./guards";

export interface EffectiveUserPermissionsParams {
  sessionUser?: {
    id?: string | null;
    role?: string | null;
    assignedBranchIds?: string[] | null;
  } | null;
  fallbackUser?: {
    id?: string;
    role?: string;
    assignedBranchIds?: string[];
  } | null;
}

export interface EffectivePermissionsResult {
  role: MarcomRole;
  assignedBranchIds: string[];
  isAuthenticated: boolean;
}

export function normalizeMarcomRole(role?: string | null): MarcomRole | null;
export function resolveEffectivePermissionsUser(params: EffectiveUserPermissionsParams): EffectivePermissionsResult;
```

---

## 4. Acceptance Criteria

1. **TopNav & Session Parity:**
   - When logged in as `admin@vrelloup.dev` (`role: "ADMIN"`), `useMarcomPermissions().role` is strictly `"admin"`.
   - All seven views immediately display their respective "+ Add / New / Upload" buttons.
2. **Supervisor Parity:**
   - When logged in as `supervisor.rian@vrelloup.dev` (`role: "SUPERVISOR"`), `useMarcomPermissions().role` is strictly `"supervisor"`, and `assignedBranchIds` contains `["branch-1", "branch-2"]`.
   - Supervisor can create items within assigned branches and approve drafts.
3. **Staff Parity:**
   - When logged in as `staff.dewi@vrelloup.dev` (`role: "STAFF"`), `useMarcomPermissions().role` is strictly `"staff"`, and `assignedBranchIds` contains `["branch-1"]`.
   - Staff can add placements, events, MOUs, draft outlets, and borrow items.
4. **Viewer Parity:**
   - When logged in as `viewer.hendra@vrelloup.dev` (`role: "VIEWER"`), `useMarcomPermissions().role` is strictly `"viewer"`.
   - Add buttons remain safely hidden in accordance with least-privilege principles.
5. **Offline / Fallback Resilience:**
   - When `session.user` is unavailable (SSR, mock dev, unit test), permissions seamlessly fall back to Zustand `users.find(u => u.id === currentUserId) ?? users[0]` (Alex Rivera = admin) without throwing errors.
6. **Codebase Invariants:**
   - Coordinator LOC $\le 250$.
   - SSOT types respected.
   - 0 TypeScript errors (`npm run build:check`).
   - 100% test pass rate (`npm test`).
   - Clean drift check (`npm run drift:check`).

