# Implementation Plan: Strict Test-Environment Header Isolation & Inventory Auth Standardization

- **Date:** 2026-11-11
- **Status:** COMPLETED
- **Spec:** [2026-11-11-strict-test-environment-header-isolation-and-inventory-auth-standardization-design.md](../specs/2026-11-11-strict-test-environment-header-isolation-and-inventory-auth-standardization-design.md)
- **ADR:** [ADR-0104](../../adr/0104-strict-test-environment-header-isolation-and-inventory-auth-standardization.md)

---

## 1. Executive Summary & File Manifest

This plan implements strict test-environment isolation for the `x-user-role` test harness, closes an open privilege escalation vector in production/staging, eliminates the non-production `"warehouse"` fallback in `/return`, and standardizes inventory authentication across all 4 operational routes.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/lib/server/inventoryAuth.ts` | Create | Centralized SSOT helper for inventory session resolution, role normalization, and test harness isolation. | ~45 lines created |
| `src/lib/server/inventoryAuth.test.ts` | Create | Dedicated unit tests for environment isolation (`test` vs `production`/`development`) and role normalization. | ~55 lines created |
| `src/app/api/marcom/inventory/borrow/route.ts` | Edit | Consume `resolveInventoryAuth` for `POST /borrow`. | ~20 lines edited |
| `src/app/api/marcom/inventory/borrow/[id]/route.ts` | Edit | Consume `resolveInventoryAuth` for `PUT /borrow/[id]`. | ~20 lines edited |
| `src/app/api/marcom/inventory/borrow/[id]/return/route.ts` | Edit | Consume `resolveInventoryAuth`, eliminate `"warehouse"` fallback, enforce 401 on unauthenticated requests. | ~20 lines edited |
| `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` | Edit | Consume `resolveInventoryAuth` for `POST /settle`. | ~20 lines edited |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | Edit | Add security test verifying unauthenticated `/return` in non-test mode returns 401. | ~25 lines added |
| `docs/SESSION_STATE.md` | Edit | Update feature status and test verification history. | ~10 lines edited |

### Prerequisites & Dependencies
- Zero database migrations required.
- Relies on `@/auth` for NextAuth session extraction.

---

## 2. Phase 1: Centralized Inventory Auth Helper (`inventoryAuth.ts`)

- [x] **Task 1.1: Create `src/lib/server/inventoryAuth.ts`**
  - Implement `resolveInventoryAuth(request: Request)`.
  - Extract session via `await auth().catch(() => null)`.
  - Isolate test headers strictly to `process.env.NODE_ENV === "test"`:
    - In test mode: read `x-user-role` and `x-user-name`.
    - In non-test mode: ignore headers completely.
  - Return `{ session, role, userName, userId, isAuthenticated }`.
- [x] **Task 1.2: Create `src/lib/server/inventoryAuth.test.ts`**
  - Test 1: In `NODE_ENV === "production"`, `x-user-role: admin` is ignored and returns `isAuthenticated: false`.
  - Test 2: In `NODE_ENV === "test"`, `x-user-role: warehouse` is parsed and returns `role: "warehouse"`.
  - Test 3: Unauthenticated requests without session return `isAuthenticated: false`.
  - Test 4: Role normalization maps unknown strings to `"viewer"`.
- [x] **Task 1.3: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/lib/server/inventoryAuth.test.ts`

---

## 3. Phase 2: Route Handler Refactoring Across Inventory Subsystem

- [x] **Task 2.1: Refactor `POST /api/marcom/inventory/borrow`**
  - File: `src/app/api/marcom/inventory/borrow/route.ts`
  - Replace local auth resolution with `resolveInventoryAuth`.
  - Enforce `401 Unauthorized` when `!isAuthenticated`.
- [x] **Task 2.2: Refactor `PUT /api/marcom/inventory/borrow/[id]`**
  - File: `src/app/api/marcom/inventory/borrow/[id]/route.ts`
  - Replace local auth resolution with `resolveInventoryAuth`.
  - Enforce `401 Unauthorized` when `!isAuthenticated`.
- [x] **Task 2.3: Refactor `POST /api/marcom/inventory/borrow/[id]/return`**
  - File: `src/app/api/marcom/inventory/borrow/[id]/return/route.ts`
  - Replace local auth resolution with `resolveInventoryAuth`.
  - **Remove** `(process.env.NODE_ENV === "production" ? "viewer" : "warehouse")`.
  - Enforce `401 Unauthorized` when `!isAuthenticated`.
- [x] **Task 2.4: Refactor `POST /api/marcom/inventory/borrow/[id]/settle`**
  - File: `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts`
  - Replace local auth resolution with `resolveInventoryAuth`.
  - Enforce `401 Unauthorized` when `!isAuthenticated`.

---

## 4. Phase 3: Regression & Security Negative Tests

- [x] **Task 3.1: Add Security Negative Tests in `src/app/api/marcom/inventory/inventoryApi.test.ts`**
  - Test: Unauthenticated request to `/return` without session returns 401.
  - Test: Request to `/return` with spoofed `x-user-role: admin` in production simulation returns 401.
- [x] **Task 3.2: Verify Inventory Subsystem Integration Tests**
  - Run: `node --test --import ./test/register-alias.mjs src/app/api/marcom/inventory/inventoryApi.test.ts`
  - Confirm all 8 integration tests pass with 0 regressions.

---

## 5. Phase 4: Non-Negotiable Verification Gates & Session Handoff

- [x] **Task 4.1: Drift Check**
  - Run `npm run drift:check` (must pass 100% with all spec-plan pairs valid).
- [x] **Task 4.2: Full Test Suite**
  - Run `npm test` (must pass with 0 failures across all 1107+ tests).
- [x] **Task 4.3: Build Check**
  - Run `npm run build:check` (must pass with 0 TypeScript/Next.js errors).
- [x] **Task 4.4: Session Handoff & State Update**
  - Update `docs/SESSION_STATE.md`.



