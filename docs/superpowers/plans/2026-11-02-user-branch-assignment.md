# Implementation Plan: User Management Branch Assignment & Area Supervisor Scoping

**Date:** 2026-11-02  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Status:** Completed  
**Related Spec:** `docs/superpowers/specs/2026-11-02-user-branch-assignment-design.md`  
**ADR:** `docs/adr/0014-user-management-branch-assignment.md`

---

## 1. Overview & File Manifest

| File | Est. LOC | Purpose |
|------|----------|---------|
| `src/lib/marcom/branchAssignmentHelpers.ts` | ~60 | Pure helpers: `getAssignableBranches`, `canAssignBranchToUser`, `formatUserBranchBadges` |
| `src/lib/marcom/branchAssignmentHelpers.test.ts` | ~80 | Comprehensive unit tests for branch assignment permissions and filtering |
| `src/app/api/admin/users/[id]/route.ts` | ~218 (≤250) | Add supervisor branch boundary enforcement in PATCH |
| `src/app/api/admin/users/adminUsersGuards.test.ts` | ~120 | Test API branch assignment security rules |
| `src/components/views/UsersView/ApproveUserModal.tsx` | ~224 (≤250) | Approval dialog with role dropdown and branch selection |
| `src/components/views/UsersView/UserBranchSelectModal.tsx` | ~199 (≤250) | Edit branch assignment modal for active users |
| `src/components/views/UsersView/UserActiveRow.tsx` | ~136 (≤250) | Extracted atomic row component for active users table |
| `src/components/views/UsersView/UsersPendingTab.tsx` | ~233 (≤250) | Trigger `ApproveUserModal` on "Setujui" |
| `src/components/views/UsersView/UsersActiveTab.tsx` | ~172 (≤250) | Add "Cabang" column and edit branch trigger |
| `src/components/views/UsersView/UsersView.tsx` | ~155 (≤250) | Fetch active branches and pass to active/pending tabs |
| `src/components/views/UsersView/userBranchAssignment.test.ts` | ~60 | UI and coordinator line count tests |

---

## 2. Phased Implementation Tasks

### Phase 1: Pure Logic Helpers & Unit Tests (TDD)
- [x] Create `src/lib/marcom/branchAssignmentHelpers.ts` with `getAssignableBranches`, `canAssignBranchToUser`, and `formatUserBranchBadges`.
- [x] Create `src/lib/marcom/branchAssignmentHelpers.test.ts` verifying admin, supervisor, and edge cases.
- [x] Run targeted unit test: `node --test --import ./test/register-alias.mjs src/lib/marcom/branchAssignmentHelpers.test.ts`.

### Phase 2: Backend API Hardening & Security Tests
- [x] Update `src/app/api/admin/users/[id]/route.ts`:
  - When `assignedBranchIds` is modified by a supervisor, enforce `canAssignBranchToUser(session.user.role, session.user.assignedBranchIds, assignedBranchIds)`.
  - Return HTTP 403 if supervisor attempts out-of-scope branch assignment.
  - Keep file size $\le 250$ LOC.
- [x] Update `src/app/api/admin/users/adminUsersGuards.test.ts` with branch assignment tests.
- [x] Verify API test suite passes.

### Phase 3: UI Modals & Tab Integration
- [x] Create `src/components/views/UsersView/ApproveUserModal.tsx`:
  - Role select (`staff`, `supervisor`, `viewer` — excluding `admin` for supervisor actors).
  - Branch checkboxes (filtered by `assignableBranches`).
  - Calls `onConfirm(role, assignedBranchIds)`.
- [x] Create `src/components/views/UsersView/UserBranchSelectModal.tsx`:
  - Branch checkboxes with save action for active users.
- [x] Create `src/components/views/UsersView/UserActiveRow.tsx` (Strangler Pattern, keeping `UsersActiveTab` $\le 250$ LOC).
- [x] Update `src/components/views/UsersView/UsersPendingTab.tsx`:
  - Add "Setujui" flow opening `ApproveUserModal`.
  - Keep $\le 250$ LOC.
- [x] Update `src/components/views/UsersView/UsersActiveTab.tsx`:
  - Add "Cabang" column with branch badges and edit button.
  - Keep $\le 250$ LOC.
- [x] Update `src/components/views/UsersView/UsersView.tsx`:
  - Fetch `/api/marcom/branches` on mount.
  - Pass `branches` to tabs.
  - Keep $\le 250$ LOC.
- [x] Add `src/components/views/UsersView/userBranchAssignment.test.ts`.

### Phase 4: Full Verification Gates
- [x] Run `npm run drift:check` (verify 46 specs/plans pairing and $\le 250$ LOC invariant).
- [x] Run `npm run test:smoke`.
- [x] Run `npm test`.
- [x] Run `npm run build:check`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Update `docs/SESSION_STATE.md` and `CHANGELOG.md`.
