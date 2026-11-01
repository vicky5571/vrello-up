# Design Spec: User Management Branch Assignment & Area Supervisor Scoping

**Date:** 2026-11-02  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Status:** Approved  
**ADR:** `docs/adr/0014-user-management-branch-assignment.md`

---

## 1. Executive Summary

This specification establishes an end-to-end branch assignment workflow within User Management (`/?view=users`). When approving a pending registration in `UsersPendingTab` or managing active accounts in `UsersActiveTab`, managers can assign users to their designated operational branch(es).

In alignment with **Model A (Area Supervisor)**:
- Super Admins (`admin`) have nationwide purview and can assign any branch.
- Area Supervisors (`supervisor`) can only assign users to branches within their own assigned branch scope (`assignedBranchIds`). Attempts to assign out-of-area branches are strictly blocked at both the UI and API levels (HTTP 403).

---

## 2. UX Flow & Interaction Design

```
+-----------------------------------------------------------------------------------+
| Tab: Menunggu Review (UsersPendingTab)                                            |
+-----------------------------------------------------------------------------------+
|  Pengguna        Email             Waktu Daftar      Aksi                         |
|  [Avatar] Budi   budi@vrello.com   2 jam lalu        [Setujui] [Tolak]            |
+-----------------------------------------------------------------------------------+
                                                           |
                                                           v
                                            +-------------------------------+
                                            | Modal: Setujui Pendaftaran    |
                                            +-------------------------------+
                                            | Pengguna: Budi                |
                                            | Role: [Staff        v]        |
                                            | Cabang Penugasan:             |
                                            |  [x] Surabaya (SUB)           |
                                            |  [ ] Malang (MLG)             |
                                            |                               |
                                            | [Batal]      [Setujui & Simpan]|
                                            +-------------------------------+
                                                           |
                                                           v
                                             PATCH /api/admin/users/:id
                                             { status: "APPROVED",
                                               role: "staff",
                                               assignedBranchIds: ["b-1"] }
```

```
+-------------------------------------------------------------------------------------------------------+
| Tab: Pengguna Aktif (UsersActiveTab)                                                                 |
+-------------------------------------------------------------------------------------------------------+
| Pengguna   Email          Role      Cabang                         Status    Terakhir Masuk   Aksi    |
| [A] Admin  admin@v.com    [Admin]   [Semua Cabang (Nasional)]      [Aktif]   Hari ini         (Anda)  |
| [B] Budi   budi@v.com     [Staff]   [Surabaya] [Edit Cabang]       [Aktif]   Kemarin          [Nonaktifkan] |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. SSOT Domain Schemas & Contracts

Existing SSOT in `src/types/index.ts`:
```ts
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

Branch lookup interface:
```ts
export interface BranchLookupItem {
  id: string;
  name: string;
  code?: string;
  region?: string;
}
```

---

## 4. Pure Logic Function Signatures (`src/lib/marcom/branchAssignmentHelpers.ts`)

```ts
/**
 * Filters the list of all branches to only those the actor is authorized to assign.
 */
export function getAssignableBranches(
  actorRole: UserRole,
  actorBranchIds: string[] = [],
  allBranches: BranchLookupItem[] = [],
): BranchLookupItem[];

/**
 * Validates whether the actor is allowed to assign the specified target branches.
 */
export function canAssignBranchToUser(
  actorRole: UserRole,
  actorBranchIds: string[] = [],
  targetBranchIds: string[] = [],
): boolean;

/**
 * Formats assigned branch badges for UI display.
 */
export function formatUserBranchLabels(
  userRole: UserRole,
  userBranchIds: string[] = [],
  allBranches: BranchLookupItem[] = [],
): string[];
```

---

## 5. API Contracts

### `PATCH /api/admin/users/:id`
**Request Payload:**
```json
{
  "status": "APPROVED",
  "role": "staff",
  "assignedBranchIds": ["branch-sby"]
}
```

**Security Rules:**
1. Check `canAccessUserManagement(session.user.role)`: 403 if unauthorized.
2. Check `canManageUserTarget(session.user.role, targetUser.role)`: 403 if supervisor tries to alter admin.
3. Check `canAssignUserRole(session.user.role, role)`: 403 if supervisor tries to assign `admin`.
4. If `assignedBranchIds` provided:
   - Check `canAssignBranchToUser(session.user.role, session.user.assignedBranchIds, assignedBranchIds)`:
   - If returns `false`, reject with HTTP 403: `{ "error": "Supervisor hanya dapat menugaskan cabang dalam wilayah binaannya." }`.

---

## 6. Component Architecture & Invariants

To guarantee that coordinator files strictly maintain $\le 250$ LOC:
1. **`ApproveUserModal.tsx`** (~100 LOC):
   - Standalone modal component handling role selector and branch checkbox list.
   - Submits approved status with role and branch IDs.
2. **`UserBranchSelectModal.tsx`** (~110 LOC):
   - Standalone modal component for updating branch assignments in active tab.
3. **`UsersActiveTab.tsx`** ($\le 220$ LOC):
   - Houses the table with "Cabang" column and opens `UserBranchSelectModal`.
4. **`UsersPendingTab.tsx`** ($\le 210$ LOC):
   - Houses table and opens `ApproveUserModal` on "Setujui" click.
5. **`UsersView.tsx`** ($\le 160$ LOC):
   - Fetches `/api/marcom/branches` once and passes `branches` to subcomponents.

---

## 7. Acceptance Criteria

- [ ] Super Admin can assign any branch to staff and supervisors.
- [ ] Area Supervisor can only assign branches from their own `assignedBranchIds`.
- [ ] API rejects supervisor attempts to assign branches outside their area with HTTP 403.
- [ ] When approving a user in `UsersPendingTab`, an approval modal allows selecting role and branch before committing.
- [ ] In `UsersActiveTab`, each user's assigned branches are displayed with an action to modify their branch assignments.
- [ ] For `admin` users, branch display shows `"Semua Cabang (Nasional)"` and assignment is disabled.
- [ ] All coordinator files remain strictly $\le 250$ LOC.
- [ ] 0 test failures and clean build.

---

## 8. Non-Goals
- Modifying the self-registration form (`/register`) — user registration remains simple and uncoupled from internal organizational branch structures.
- Multi-tenant workspace scoping — single-tenant invariant preserved.

