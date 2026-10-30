# Implementation Plan — Supervisor Role & Scoped Area Permissions

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-supervisor-role-design.md`  
**Status:** READY TO EXECUTE  

---

## 1. Overview & Phased Roadmap

This plan implements the `supervisor` user level with Admin-equivalent operational authority strictly bounded by assigned branch boundaries (`assignedBranchIds`), while reserving global user management and master data infrastructure exclusively for `admin`.

### Phased Roadmap
- [x] **Phase 1: Domain Types & Database Schema**
  - Update `src/types/index.ts` to include `"supervisor"` in `UserRole` and `assignedBranchIds` in `AppUser`.
  - Update `prisma/schema.prisma` to add `SUPERVISOR` to `DbUserRole` and `assignedBranchIds String[]` to `model User`.
  - Run `prisma db push` and `prisma generate`.
- [x] **Phase 2: Auth Helpers, Role Normalization & Tests**
  - Update `normalizeRole` in `src/lib/server/auth-helpers.ts` to handle `SUPERVISOR`.
  - Add unit tests in `src/lib/server/auth-helpers.test.ts`.
  - Update PATCH schema in `src/app/api/admin/users/[id]/route.ts`.
- [x] **Phase 3: Core Permissions Engine (`guards.ts` & `permissions.ts`)**
  - Update `rolePermissions` and `hasScopedPermission` in `src/lib/marcom/guards.ts`.
  - Write comprehensive unit tests in `src/lib/marcom/guards.test.ts` verifying supervisor capabilities inside assigned branches and rejections outside.
- [x] **Phase 4: Admin UI & Profile Display**
  - Update `UsersActiveTab.tsx` and `UsersPendingTab.tsx` role selection options to include Supervisor.
  - Update `UserMenuDropdown.tsx` badge styling.
- [x] **Phase 5: Verification & Verification Gates**
  - Run `npm run build:check`.
  - Run `npm run drift:check`.
  - Run `npm run test:smoke`.
  - Run `npm test`.

---

## 2. File Manifest & LOC Estimates

| File Path | Action | Est. LOC Change | Purpose |
| :--- | :---: | :---: | :--- |
| `src/types/index.ts` | Edit | ~5 LOC | Add `"supervisor"` to `UserRole` SSOT |
| `prisma/schema.prisma` | Edit | ~6 LOC | Add `SUPERVISOR` enum & `assignedBranchIds` |
| `src/lib/server/auth-helpers.ts` | Edit | ~8 LOC | Normalize `SUPERVISOR` $\leftrightarrow$ `"supervisor"` |
| `src/lib/server/auth-helpers.test.ts` | Edit | ~10 LOC | Test role normalization |
| `src/app/api/admin/users/[id]/route.ts` | Edit | ~10 LOC | Accept `supervisor` and `assignedBranchIds` |
| `src/lib/marcom/guards.ts` | Edit | ~25 LOC | Scoped permission rules for supervisor |
| `src/lib/marcom/guards.test.ts` | Edit | ~45 LOC | TDD test coverage for supervisor |
| `src/components/views/UsersView/UsersActiveTab.tsx` | Edit | ~15 LOC | Add supervisor option to role picker |
| `src/components/views/UsersView/UsersPendingTab.tsx` | Edit | ~15 LOC | Add supervisor option to approval picker |
| `src/components/layout/UserMenuDropdown.tsx` | Edit | ~5 LOC | Badge styling for supervisor |

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Database schema drift during migration | High | Execute `npx prisma db push` followed by `npx prisma generate` to keep Prisma client types in sync |
| Accidental leakage of `/admin/users` to supervisor | High | Assert strictly in `AdminUsersPage` and API routes that `session.user.role !== "admin"` returns 403 / redirects to `/` |
| Branch scope bypass when `assignedBranchIds` is empty | Medium | Require explicit branch assignment; if `assignedBranchIds` is empty, supervisor cannot perform branch-scoped operations (fail-closed) |

---

## 4. Dependencies

- Node.js & Prisma ORM
- NextAuth.js JWT claims
- Built-in test runner (`node --test`)
