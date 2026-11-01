# ADR 14: User Management Branch Assignment & Area Supervisor Scoping

## Context & Problem Statement
In Vrello's multi-branch architecture, each operational activity (Outlets, MOUs, Equipment Inventory, POSM Placements) is tied to a specific branch (`branchId`). Role-based access control (`guards.ts`) designates `supervisor` as an *Area Supervisor* whose administrative authority is strictly bounded by their assigned branch scope (`assignedBranchIds`).

However, user registration (`/register`) and user management (`UsersView`) previously provided no interface to select, assign, or modify branch penugasan (`assignedBranchIds`). As a result:
1. Newly approved accounts always entered the database with `assignedBranchIds: []`.
2. Supervisors with empty branch arrays were blocked from branch-scoped approvals (`canAccessBranch` returned `false`).
3. Admins had no way in the UI to assign a staff member or supervisor to their respective branch(es).

The user explicitly confirmed Model A: **Area Supervisor (Supervisor Wilayah)**, where supervisors are assigned to 1 or more branches, and managers assign branches directly within the User Management workflow (Option 1).

## Decision Drivers
1. **Decentralized Area Management**: Area Supervisors must be able to assign staff to branches within their area, while Super Admins can assign nationwide.
2. **Boundary Enforcement**: Supervisors must never be allowed to assign users to branches outside their own assigned branches (`actorBranchIds`).
3. **Approval-Time Assignment**: When approving a pending registration, the manager should be able to explicitly designate the user's role and branch penugasan before activating the account.
4. **Single Source of Truth & Pure Guards**: Branch assignment rules must be codified into pure, testable functions in `guards.ts` and `branchAssignmentHelpers.ts`.
5. **Coordinator LOC Invariant**: All coordinator files (`UsersView.tsx`, `UsersActiveTab.tsx`, `UsersPendingTab.tsx`) must remain $\le 250$ LOC (Strangler Pattern).

## Decision
1. **Pure RBAC & Scoping Helpers (`src/lib/marcom/branchAssignmentHelpers.ts`)**:
   - `getAssignableBranches(actorRole, actorBranchIds, allBranches)`:
     - `admin`: Returns all branches.
     - `supervisor`: Returns only branches present in `actorBranchIds`.
     - `staff` / `viewer`: Returns empty array `[]`.
   - `canAssignBranchToUser(actorRole, actorBranchIds, targetBranchIds)`:
     - `admin`: Always returns `true`.
     - `supervisor`: Returns `true` if and only if every branch in `targetBranchIds` is within `actorBranchIds`.
     - `staff` / `viewer`: Returns `false`.
   - `formatUserBranchSummary(user, allBranches)`:
     - `admin`: Returns `["Semua Cabang (Nasional)"]`.
     - Empty `assignedBranchIds`: Returns `["Belum Ada Cabang"]`.
     - Formats assigned IDs into branch names.

2. **API Endpoint Hardening (`src/app/api/admin/users/[id]/route.ts`)**:
   - In `PATCH /api/admin/users/[id]`:
     - When `assignedBranchIds` is updated by a supervisor, enforce `canAssignBranchToUser(session.user.role, session.user.assignedBranchIds, assignedBranchIds)`.
     - Rejects unauthorized cross-area branch assignments with HTTP 403 (`Supervisor hanya dapat menugaskan cabang dalam wilayah binaannya.`).

3. **User Management UI Components (`src/components/views/UsersView/`)**:
   - **`ApproveUserModal.tsx`**: Lightweight modal opened upon clicking "Setujui" in `UsersPendingTab`. Allows the manager to review/select the user's role and branch penugasan before activating the account.
   - **`UserBranchSelectModal.tsx`**: Reusable modal/dialog for updating branch assignments in `UsersActiveTab`.
   - **`UsersActiveTab.tsx`**: Adds a "Cabang" column displaying branch chips with an edit action.
   - **`UsersPendingTab.tsx`**: Integrates `ApproveUserModal` for approval-time role and branch assignment.
   - **`UsersView.tsx`**: Fetches branches list via `/api/marcom/branches` and shares it across active and pending tabs.

## Consequences
- **Positive**: Complete end-to-end user lifecycle where new users are cleanly assigned to branches upon approval or via active user management.
- **Positive**: Strict area boundaries prevent supervisors from assigning staff outside their operational jurisdiction.
- **Positive**: Backward compatible with existing DB schema (`assignedBranchIds String[]`) without schema migrations.
- **Positive**: Preserves modularity and keep all view components $\le 250$ LOC.

