# Session RBAC & Permissions Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and synchronize the "+ Add / New / Upload" buttons across Media Placements, Field Events, MOU, Branches, Outlets, Equipment Inventory, and Documents by wiring `useMarcomPermissions()` to the authenticated NextAuth session (`session.user.role`, `session.user.assignedBranchIds`), eliminating the hardcoded `SEED_USERS` fallback bug.

**Architecture:** Extend NextAuth session and JWT claims with `assignedBranchIds`. Implement pure helper `permissionsHelpers.ts` to resolve effective role and assigned branches (prioritizing `session.user` over fallback store users). Update `useMarcomPermissions()` to consume `useSession()`, ensuring authenticated users immediately receive their true permissions and authorized UI action triggers.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, NextAuth v5, Zustand 5, Prisma 6, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-session-rbac-permissions-sync-design.md`

## Global Constraints

- Coordinator files must remain strictly $\le 250$ LOC.
- SSOT: No duplicate domain interfaces outside `src/types/index.ts`. NextAuth module augmentations stay in `src/types/next-auth.d.ts`.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`) must pass with 0 errors.

---

### Phase 1: NextAuth JWT & Session Claims Hydration

- [x] **Task 1.1: Augment NextAuth Types with `assignedBranchIds`**
  - Edit: `src/types/next-auth.d.ts`
  - Add `assignedBranchIds?: string[]` to `Session["user"]`, `User`, `@auth/core/jwt.JWT`, and `next-auth/jwt.JWT`.

- [x] **Task 1.2: Hydrate `assignedBranchIds` in Auth Helpers & Callbacks**
  - Edit: `src/lib/server/auth-helpers.ts`
  - In `resolveJwtClaims`, pass through `assignedBranchIds` from `user` input or `findUserByEmail` database query.
  - Edit: `src/auth.ts`
  - In Credentials `authorize()`, return `assignedBranchIds: user.assignedBranchIds ?? []`.
  - In `jwt()` callback, select `assignedBranchIds: true` from database and populate `token.assignedBranchIds`.
  - Edit: `src/auth.config.ts`
  - In `session()` callback, assign `session.user.assignedBranchIds = (token.assignedBranchIds as string[]) ?? []`.

- [x] **Task 1.3: Update & Run Auth Unit Tests**
  - Edit: `src/lib/server/auth-helpers.test.ts`
  - Verify that `resolveJwtClaims` preserves and extracts `assignedBranchIds`.
  - Run: `node --test src/lib/server/auth-helpers.test.ts` (Confirm 0 failures).

---

### Phase 2: Pure Helper Module (`permissionsHelpers.ts`)

- [x] **Task 2.1: Write Unit Test Suite for Permissions Resolution**
  - Create: `src/lib/marcom/permissionsHelpers.test.ts`
  - Test cases:
    - Normalizes case variations (`"ADMIN"`, `"admin"`, `"SUPERVISOR"`, `"staff"`, `"VIEWER"`).
    - Rejects invalid roles and defaults to `"viewer"`.
    - Prioritizes `sessionUser` over `fallbackUser`.
    - Correctly extracts `assignedBranchIds` from `sessionUser`.
    - Falls back to `fallbackUser` when `sessionUser` is missing or has no role.
    - Sets `isAuthenticated: true` when `sessionUser` is present and false otherwise.
    - Gracefully handles `null`, `undefined`, empty objects, and empty arrays.

- [x] **Task 2.2: Implement `permissionsHelpers.ts`**
  - Create: `src/lib/marcom/permissionsHelpers.ts`
  - Implement `normalizeMarcomRole(role?: string | null): MarcomRole | null`.
  - Implement `resolveEffectivePermissionsUser(params: EffectiveUserPermissionsParams): EffectivePermissionsResult`.
  - Run: `node --test src/lib/marcom/permissionsHelpers.test.ts` (Confirm 0 failures).

---

### Phase 3: Hook Integration (`useMarcomPermissions`)

- [x] **Task 3.1: Refactor `useMarcomPermissions` to Consume `useSession()`**
  - Edit: `src/lib/marcom/permissions.ts`
  - Import `useSession` from `next-auth/react`.
  - Import `resolveEffectivePermissionsUser` from `./permissionsHelpers`.
  - Read `const { data: session } = useSession()`.
  - Read `currentUserId` and `users` from `useWorkspaceStore`.
  - Resolve `role` and `assignedBranchIds` using `resolveEffectivePermissionsUser`.
  - Keep `can` and `canAccessBranch` closures bound to the resolved `role` and `assignedBranchIds`.

- [x] **Task 3.2: Verify Hook Safety & Tests**
  - Run: `node --test src/lib/marcom/permissions.test.ts` (Confirm 0 failures).

---

### Phase 4: Zustand Store Parity & Synchronization

- [x] **Task 4.1: Synchronize Active User in Zustand Store**
  - Edit: `src/components/layout/TopNav.tsx` and `src/lib/store/slices/createDataSlice.ts`
  - When `session?.user` is present, ensure the current user object with matching `id`, `name`, `email`, `role`, and `assignedBranchIds` exists in Zustand `users` so fallback lookups (`users.find(u => u.id === currentUserId)`) find an exact match.

---

### Phase 5: Verification & End-to-End Gates

- [x] **Task 5.1: Execute Verification Suite**
  - Run: `npm run drift:check` (Confirm 0 drift).
  - Run: `npm run build:check` (Confirm 0 TypeScript errors).
  - Run: `npm run test:smoke` (Confirm 89 passed, 0 failed).
  - Run: `npm test` (Confirm 643 passed, 0 failed).

- [x] **Task 5.2: Update Documentation & Session State**
  - Update: `docs/superpowers/specs/README.md`
  - Update: `docs/superpowers/plans/README.md`
  - Update: `docs/SESSION_STATE.md`

