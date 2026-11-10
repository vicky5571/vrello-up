# Implementation Plan: Inventory Borrow Server-Side RBAC Guard and Audit Integrity

- **Date:** 2026-11-10
- **Status:** READY FOR EXECUTION
- **Spec:** [2026-11-10-inventory-borrow-server-side-rbac-and-audit-integrity-design.md](../specs/2026-11-10-inventory-borrow-server-side-rbac-and-audit-integrity-design.md)
- **ADR:** [ADR-0100](../../adr/0100-inventory-borrow-server-side-rbac-and-audit-integrity.md)

---

## 1. Executive Summary & File Manifest

This plan implements server-side RBAC and session-derived approver identity for the borrowing subsystem, closing the vulnerability identified in Temuan 1 and Temuan 3.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/app/api/marcom/inventory/borrow/route.ts` | Edit | Add session resolution & `REQUEST_BORROW` permission check in `POST`. | ~25 lines added |
| `src/app/api/marcom/inventory/borrow/[id]/route.ts` | Edit | Add session resolution, granular RBAC per transition (`APPROVE_BORROW`, `MANAGE_INVENTORY`, cancellation ownership), and enforce server-derived `approvedBy`. | ~45 lines added/edited |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | Edit | Add test headers to existing integration calls and add security negative tests (401/403) and audit log tests. | ~70 lines added |
| `docs/SESSION_STATE.md` | Edit | Update current feature status and test verification history. | ~15 lines edited |

### Prerequisites & Dependencies
- Zero database migrations required (preserves zero-downtime invariant).
- Central permissions imported from `src/lib/marcom/guards.ts` (`hasPermission`, `MarcomRole`).
- Authentication imported from `@/auth` (`auth()`).

---

## 2. Phase 1: Server-Side RBAC on `POST /api/marcom/inventory/borrow`

- [ ] **Task 1.1: Extract session and test role in `POST` handler**
  - File: `src/app/api/marcom/inventory/borrow/route.ts`
  - Import `auth` from `@/auth` and `hasPermission`, `type MarcomRole` from `@/lib/marcom/guards`.
  - Resolve session via `await auth().catch(() => null)`.
  - In `process.env.NODE_ENV === "test"`, permit `x-user-role` header fallback.
  - In production, fallback role is strictly `"viewer"` if unauthenticated, returning 401.
- [ ] **Task 1.2: Enforce `REQUEST_BORROW` guard**
  - Check `if (!hasPermission(userRole, "REQUEST_BORROW"))` and return 403:
    ```json
    { "error": "Peran Anda tidak memiliki izin untuk mengajukan peminjaman alat." }
    ```
- [ ] **Task 1.3: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/app/api/marcom/inventory/inventoryApi.test.ts`
  - Confirm existing borrow tests pass with test runner header.

---

## 3. Phase 2: Granular RBAC & Audit Integrity on `PUT /api/marcom/inventory/borrow/[id]`

- [ ] **Task 2.1: Session & Role Resolution in `PUT` handler**
  - File: `src/app/api/marcom/inventory/borrow/[id]/route.ts`
  - Resolve session and role (`userRole: MarcomRole`).
  - Extract `userName = session?.user?.name || session?.user?.email || (process.env.NODE_ENV === "test" ? request.headers.get("x-user-name") : null) || "Authorized User"`.
- [ ] **Task 2.2: Guard Transition to `APPROVED` and Enforce Server-Derived `approvedBy`**
  - If `status === "APPROVED"`:
    - Verify `hasPermission(userRole, "APPROVE_BORROW")`. Return 403 if false.
    - Set `updateData.approvedBy = userName`.
    - Set `updateData.approvedAt = new Date()`.
    - **Discard** any client-provided `body.approvedBy`.
- [ ] **Task 2.3: Guard Transition to `ACTIVE` (Pickup)**
  - If `status === "ACTIVE"`:
    - Verify `hasPermission(userRole, "MANAGE_INVENTORY")`. Return 403 if false.
- [ ] **Task 2.4: Guard Transition to `CANCELLED` & Metadata Updates**
  - If `status === "CANCELLED"`:
    - Allow if `hasPermission(userRole, "MANAGE_INVENTORY")`.
    - OR allow if `existing.status === "PENDING"` and `existing.borrowerName.trim().toLowerCase() === userName.trim().toLowerCase()`.
    - Reject with 403 if neither condition is met.
  - If updating metadata (`notes`, `picName`, `purpose`, `eventLocation`):
    - Allow if `hasPermission(userRole, "MANAGE_INVENTORY")` OR requester when `PENDING`.
    - Reject with 403 if unauthorized.

---

## 4. Phase 3: Automated Regression & Security Test Suite Extension

- [ ] **Task 3.1: Maintain Compatibility of Existing Tests**
  - File: `src/app/api/marcom/inventory/inventoryApi.test.ts`
  - Ensure all existing `postBorrow` and `putBorrow` test calls pass appropriate test headers:
    - For request: `headers: { "x-user-role": "staff", "x-user-name": "Staff Requester" }`
    - For approve: `headers: { "x-user-role": "supervisor", "x-user-name": "Supervisor Approver" }`
    - For active: `headers: { "x-user-role": "warehouse", "x-user-name": "Warehouse Officer" }`
- [ ] **Task 3.2: Implement Security Negative Tests**
  - Test Case A: `POST /borrow` with `x-user-role: viewer` returns 403.
  - Test Case B: `PUT /borrow/[id]` with `status: APPROVED` by `staff` returns 403.
  - Test Case C: `PUT /borrow/[id]` with `status: ACTIVE` by `staff` returns 403.
  - Test Case D: `PUT /borrow/[id]` with `status: CANCELLED` by matching `borrowerName` returns 200.
  - Test Case E: `PUT /borrow/[id]` with `status: CANCELLED` by unmatching non-manager returns 403.
  - Test Case F: Audit integrity assertion — when approved, `approvedBy` equals `"Supervisor Approver"` even if body passed `{ approvedBy: "Attacker Spoof" }`.

---

## 5. Phase 4: Non-Negotiable Verification Gates & Session Handoff

- [ ] **Task 4.1: Drift Invariant Verification**
  - Run: `npm run drift:check` (must report zero drift).
- [ ] **Task 4.2: Full Test Suite Execution**
  - Run: `npm test` (must report 0 failures).
- [ ] **Task 4.3: TypeScript Build Verification**
  - Run: `npm run build:check` (must report 0 errors).
- [ ] **Task 4.4: Session Handoff Documentation**
  - Update `docs/SESSION_STATE.md` with completed feature status and references to ADR-0100, Spec, and Plan.



