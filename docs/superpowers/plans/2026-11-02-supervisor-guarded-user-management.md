# Implementation Plan: Supervisor Guarded User Management Access

**Date:** 2026-11-02  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Status:** Approved  
**Related Spec:** `docs/superpowers/specs/2026-11-02-supervisor-guarded-user-management-design.md`  
**ADR:** `docs/adr/0013-supervisor-guarded-user-management-access.md`  

---

## 1. Overview & File Manifest

| File | Est. LOC | Purpose |
|------|----------|---------|
| `src/lib/marcom/guards.ts` | +25 | Add pure helpers: `canAccessUserManagement`, `canManageUserTarget`, `canAssignUserRole` |
| `src/lib/marcom/guards.test.ts` | +40 | Unit tests for pure guard functions across admin, supervisor, staff, viewer |
| `src/app/api/admin/users/route.ts` | ~60 | Authorize using `canAccessUserManagement` |
| `src/app/api/admin/users/[id]/route.ts` | ~185 (≤250) | Add target and role assignment protection against privilege escalation |
| `src/app/api/admin/users/adminUsersApi.test.ts` | ~90 | API route tests for supervisor access and guarded restrictions |
| `src/app/admin/users/page.tsx` | ~20 | Update redirect check to `canAccessUserManagement` |
| `src/components/views/ActiveViewStage.tsx` | ~125 (≤250) | Update view mount check to `canAccessUserManagement` |
| `src/components/layout/GlobalRail.tsx` | ~240 (≤250) | Update Users item & pending hook to `canAccessUserManagement` |
| `src/components/views/UsersView/UserRoleSelect.tsx` | ~35 | Filter out "admin" option when actor is supervisor |
| `src/components/views/UsersView/UsersActiveTab.tsx` | ~185 | Disable role and deactivate actions on admin rows when actor is supervisor |
| `src/components/views/UsersView/UsersRejectedTab.tsx` | ~160 | Disable delete action on admin rows when actor is supervisor |
| `src/components/views/UsersView/UsersView.tsx` | ~125 | Pass actor role to tabs for conditional controls |

---

## 2. Phased Implementation Tasks

### Phase 1: Pure RBAC Guards & Unit Tests (TDD)
- [x] Add `canAccessUserManagement`, `canManageUserTarget`, and `canAssignUserRole` to `src/lib/marcom/guards.ts`.
- [x] Add comprehensive test suite to `src/lib/marcom/guards.test.ts`.
- [x] Verify pure logic tests pass: `node --test --import ./test/register-alias.mjs src/lib/marcom/guards.test.ts`.

### Phase 2: API Route Hardening & Integration Tests
- [x] Update `src/app/api/admin/users/route.ts` with `canAccessUserManagement`.
- [x] Update `src/app/api/admin/users/[id]/route.ts`:
  - Enforce `canAccessUserManagement(session.user.role)` for `GET`, `PATCH`, `DELETE`.
  - Block supervisor from modifying admin accounts in `PATCH` (`canManageUserTarget`).
  - Block supervisor from assigning `role: "admin"` in `PATCH` (`canAssignUserRole`).
  - Block supervisor from deleting admin accounts in `DELETE` (`canManageUserTarget`).
- [x] Create `src/app/api/admin/users/adminUsersGuards.test.ts` verifying API security rules.
- [x] Verify API tests pass.

### Phase 3: UI Shell & Coordinator Integration
- [x] Update `src/components/layout/GlobalRail.tsx`:
  - Use `canAccessUserManagement(session?.user?.role)` to authorize Users nav item and pending badge.
  - Verify LOC strictly $\le 250$ LOC.
- [x] Update `src/components/views/ActiveViewStage.tsx`:
  - Mount `UsersView` when `canAccessUserManagement(session?.user?.role)`.
- [x] Update `src/app/admin/users/page.tsx`:
  - Authorize when `canAccessUserManagement(session.user.role)`.
- [x] Update `src/components/views/UsersView/UserRoleSelect.tsx`:
  - Support `currentUserRole` prop; exclude "admin" option if `currentUserRole === "supervisor"`.
- [x] Update `src/components/views/UsersView/UsersActiveTab.tsx`, `UsersRejectedTab.tsx`, `UsersView.tsx`:
  - Pass actor role and disable admin modifications for supervisors.

### Phase 4: Verification Gates & Handoff
- [x] Run `npm run drift:check`
- [x] Run `npm run test:smoke`
- [x] Run `npm test`
- [x] Run `npm run build:check`
- [x] Run `npm run build`
- [x] Update `docs/SESSION_STATE.md`
