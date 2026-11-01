# ADR 13: Supervisor Guarded User Management Access

## Context & Problem Statement
In Vrello's RBAC architecture, `admin` had sole access to the User Management workspace view (`/?view=users`) and its underlying API routes (`/api/admin/users/*`). `supervisor` was established in ADR 0007 / `guards.ts` as an *Area Supervisor* with administrative operational authority (MoU, Outlet, Borrow Equipment) strictly bounded by their assigned branch scope (`assignedBranchIds`).

However, field supervisors also need to approve pending user registrations ("Menunggu Review"), assign branches, and manage staff/viewer accounts within their operational scope without waiting for a Super Admin.

Unrestricted equivalence (granting supervisor raw Super Admin power) introduces high-severity security vulnerabilities:
1. **Privilege Escalation**: A supervisor could promote other accounts or themselves to `admin`.
2. **Admin Tampering**: A supervisor could demote or delete a Super Admin account.

## Decision Drivers
1. **Operational Decentralization**: Supervisors must be able to review, approve, reject, and assign branch coverage to team members.
2. **Hierarchy Protection**: Super Admin accounts and the `admin` role must remain protected against modification or unauthorized assignment by supervisors.
3. **Single Source of Truth**: Permission logic must be encapsulated in pure, testable functions in `guards.ts` rather than fragmented inline string comparisons.
4. **Coordinator LOC Invariant**: All coordinator files (`GlobalRail.tsx`, `UsersView.tsx`, `ActiveViewStage.tsx`) must remain $\le 250$ LOC.

## Decision
1. **Pure RBAC Guards (`src/lib/marcom/guards.ts`)**:
   - `canAccessUserManagement(role)`: Returns `true` for `admin` and `supervisor`.
   - `canManageUserTarget(actorRole, targetRole)`: Admins can manage anyone; Supervisors can manage `supervisor`, `staff`, `viewer`, but CANNOT manage or delete `admin` accounts.
   - `canAssignUserRole(actorRole, newRole)`: Admins can assign any role; Supervisors can assign `supervisor`, `staff`, `viewer`, but CANNOT assign `admin`.
2. **API Endpoint Hardening**:
   - `GET /api/admin/users`: Open to `canAccessUserManagement(session.user.role)`.
   - `GET /api/admin/users/[id]`: Open to `canAccessUserManagement(session.user.role)`.
   - `PATCH /api/admin/users/[id]`:
     - Checks `canManageUserTarget(session.user.role, targetUser.role)`.
     - Checks `canAssignUserRole(session.user.role, role)` when role change is requested.
     - Rejects unauthorized admin modifications with HTTP 403.
   - `DELETE /api/admin/users/[id]`:
     - Checks `canManageUserTarget(session.user.role, targetUser.role)`. Rejects attempts by supervisor to delete admin accounts with HTTP 403.
3. **UI / Shell Integration**:
   - `GlobalRail.tsx`: Renders `Users` nav item and pending badge for both `admin` and `supervisor`.
   - `ActiveViewStage.tsx`: Authorizes `UsersView` for `canAccessUserManagement(session.user.role)`.
   - `/admin/users/page.tsx`: Redirects unauthorized non-management roles to `/`.
   - `UserRoleSelect.tsx`: Excludes `admin` option when viewed by supervisor and disables editing when target is an admin.
   - `UsersActiveTab.tsx` & `UsersRejectedTab.tsx`: Disables deactivation/deletion of admin accounts when actor is a supervisor.

## Consequences
- **Positive**: Supervisors can manage user approvals and assignments independently.
- **Positive**: Super Admin accounts and the admin role cannot be compromised or escalated by supervisors.
- **Positive**: 100% test coverage with automated boundary regression tests.

