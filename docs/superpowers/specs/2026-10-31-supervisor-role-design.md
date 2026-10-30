# Spec — Supervisor Role & Scoped Area Permissions

**Date:** 2026-10-31  
**Status:** DRAFT  
**Scope:** Full-stack role extension (`UserRole`, Prisma schema, NextAuth, `guards.ts`, Admin User Management, UI gating)

---

## 1. Executive Summary

This feature introduces the **`supervisor`** (Area Supervisor / Branch Manager) user level to `vrello-up`.
While the existing `staff` role has operational execution capabilities with Four-Eyes approval constraints, and the `admin` role has unrestricted global authority, there is a clear organizational need for an **Area Supervisor** who holds **full operational decision authority (approvals, deletions, inventory authorizations)** strictly bounded by their assigned branch territories (`assignedBranchIds`).

Supervisors have the same operational capabilities as an Admin for their branches, but **cannot** perform global identity and security administration (`/admin/users` remains strictly restricted to `admin`).

---

## 2. Role Comparison & Hierarchy

| Capability / Domain | `admin` (Global Super Admin) | `supervisor` (Area Supervisor) | `staff` (Field Coordinator) | `viewer` (Auditor / Executive) |
| :--- | :---: | :---: | :---: | :---: |
| **System User Administration (`/admin/users`)** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Global Master Infrastructure (`MANAGE_MASTER_DATA`)** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Branch Scope Boundary** | Global (all 12 branches) | Strictly scoped to `assignedBranchIds` | Strictly scoped to `assignedBranchIds` | Read-only across system |
| **MoU Operations (`CREATE`, `APPROVE`, `DELETE`)** | ✅ All Branches | ✅ Assigned Branches only | ⚠️ Create only; Approve only if PIC; No Delete | ❌ Read-only |
| **Outlet Operations (`SUBMIT`, `APPROVE`)** | ✅ All Branches | ✅ Assigned Branches only | ⚠️ Submit only; Approve only if PIC | ❌ Read-only |
| **Equipment Borrow Approval (`APPROVE_BORROW`)** | ✅ Allowed | ✅ Assigned Branches only | ❌ Forbidden | ❌ Forbidden |
| **Document Management (`UPLOAD`, `DELETE`)** | ✅ All Branches | ✅ Assigned Branches only | ⚠️ Upload only; No Delete | ❌ Read-only |
| **Media Placements & Events (`CREATE`, `UPDATE`)** | ✅ All Branches | ✅ Assigned Branches only | ✅ Assigned Branches only | ❌ Read-only |
| **Export & Reporting (`EXPORT_REPORTS`)** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Inventory Viewing (`VIEW_INVENTORY`)** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

---

## 3. Architecture & Data Contracts (SSOT)

### 3.1 Domain Types (`src/types/index.ts`)
```typescript
export type UserRole = "admin" | "supervisor" | "staff" | "viewer";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  assignedBranchIds?: string[];
  createdAt: string;
  lastLoginAt: string | null;
}
```

### 3.2 Database Schema (`prisma/schema.prisma`)
```prisma
enum DbUserRole {
  ADMIN
  SUPERVISOR
  STAFF
  VIEWER
}

model User {
  id                String       @id @default(cuid())
  name              String
  email             String       @unique
  password          String?
  googleId          String?      @unique
  avatar            String       @default("")
  role              DbUserRole   @default(STAFF)
  status            DbUserStatus @default(PENDING)
  assignedBranchIds String[]     @default([])
  createdAt         DateTime     @default(now())
  lastLoginAt       DateTime?

  @@index([status])
  @@index([role])
}
```

### 3.3 Auth Helpers (`src/lib/server/auth-helpers.ts`)
```typescript
export function normalizeRole(dbRole: DbUserRole): UserRole {
  switch (dbRole) {
    case "ADMIN":
      return "admin";
    case "SUPERVISOR":
      return "supervisor";
    case "STAFF":
      return "staff";
    case "VIEWER":
      return "viewer";
    default:
      return "viewer";
  }
}
```

---

## 4. Pure Permission Logic (`src/lib/marcom/guards.ts`)

### 4.1 Role Actions Matrix
```typescript
export type MarcomRole = "admin" | "supervisor" | "staff" | "viewer";

// Unscoped capability check
const rolePermissions: Record<MarcomRole, PermissionAction[]> = {
  admin: [ ...allActions ],
  supervisor: [
    "CREATE_MOU", "APPROVE_MOU", "DELETE_MOU",
    "CREATE_PLACEMENT", "UPDATE_PLACEMENT",
    "CREATE_EVENT", "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT", "DELETE_DOCUMENT",
    "EXPORT_REPORTS", "SUBMIT_DRAFT_OUTLET", "APPROVE_OUTLET",
    "VIEW_INVENTORY", "MANAGE_INVENTORY",
    "REQUEST_BORROW", "APPROVE_BORROW", "PROCESS_RETURN",
  ],
  staff: [ ...staffActions ],
  viewer: ["EXPORT_REPORTS", "VIEW_INVENTORY"],
};
```

### 4.2 Scoped Permission Rules (`hasScopedPermission`)
For `role === "supervisor"`:
1. `MANAGE_MASTER_DATA` is **always forbidden** (system-level configuration reserved for Super Admin).
2. For all operational actions:
   - If `targetBranchId` is specified, `userBranchIds` must include `targetBranchId`. If `userBranchIds` is empty or does not contain `targetBranchId`, the action is denied.
   - If no `targetBranchId` is required (e.g. `EXPORT_REPORTS`, `VIEW_INVENTORY`), access is granted.

---

## 5. UI & Administration Contracts

1. **User Management Panel (`/admin/users`)**:
   - Remains strictly restricted to `role === "admin"`. If a `supervisor` navigates to `/admin/users`, middleware / server redirect sends them to `/`.
   - Super Admin can assign the `supervisor` role and designate assigned branches via the role update dialog.
2. **User Badge & Profile Menu (`UserMenuDropdown.tsx`)**:
   - Badges role as `SUPERVISOR` with distinctive amber/emerald color scheme.
3. **Client-side Hook (`useMarcomPermissions.ts`)**:
   - Resolves role and `assignedBranchIds` accurately for the active session.

---

## 6. Acceptance Criteria

- [ ] `UserRole` union includes `"supervisor"` in SSOT (`src/types/index.ts`).
- [ ] `DbUserRole` enum includes `SUPERVISOR` and `User` includes `assignedBranchIds` in `prisma/schema.prisma`.
- [ ] `normalizeRole` maps `SUPERVISOR` $\leftrightarrow$ `"supervisor"` seamlessly.
- [ ] `hasScopedPermission` allows `supervisor` to execute full operational actions (approve MoU, approve Outlet, delete MoU/document, approve borrow) inside their assigned branches, but blocks them outside their branches.
- [ ] `hasScopedPermission` prevents `supervisor` from accessing `MANAGE_MASTER_DATA`.
- [ ] Super Admin endpoint `/api/admin/users/[id]` accepts `"supervisor"` role and updates the database.
- [ ] All verification gates pass: `npm run build:check`, `npm run drift:check`, `npm test` with 0 errors.

---

## 7. Non-Goals

- Non-goal: Creating dynamic per-user custom permission checkboxes; the 4-tier model (`admin`, `supervisor`, `staff`, `viewer`) provides clean, predictable governance.
- Non-goal: Delegating user creation/approval to supervisors; user account lifecycle remains exclusively managed by Super Admin.
