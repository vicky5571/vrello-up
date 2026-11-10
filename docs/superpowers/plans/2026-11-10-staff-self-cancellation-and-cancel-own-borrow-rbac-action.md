# Implementation Plan: Staff Self-Cancellation and CANCEL_OWN_BORROW RBAC Action

- **Date:** 2026-11-10
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** [2026-11-10-staff-self-cancellation-and-cancel-own-borrow-rbac-action-design.md](../specs/2026-11-10-staff-self-cancellation-and-cancel-own-borrow-rbac-action-design.md)
- **ADR:** [ADR-0101](../../adr/0101-staff-self-cancellation-and-cancel-own-borrow-rbac-action.md)

---

## 1. Executive Summary & File Manifest

This plan implements the `CANCEL_OWN_BORROW` permission action and dynamic requester ownership matching in `BorrowDetailModal.tsx`, resolving Temuan 2 by allowing Field Staff to cancel their own `PENDING` equipment requests while preserving warehouse staging control on `APPROVED` loans.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/lib/marcom/guards.ts` | Edit | Register `CANCEL_OWN_BORROW` in `PermissionAction` and add to role mappings. | ~10 lines added |
| `src/lib/marcom/guards.test.ts` | Edit | Assert `CANCEL_OWN_BORROW` permission rules across roles. | ~15 lines added |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | Edit | Add session and ownership check for `CANCEL_OWN_BORROW` on `PENDING` records. | ~20 lines edited |
| `src/components/views/InventoryView/borrowDetailModal.test.ts` | Create | Unit test modal button rendering conditions for staff owner, non-owner, manager, and viewer. | ~65 lines created |
| `docs/SESSION_STATE.md` | Edit | Update current feature status. | ~10 lines edited |

### Prerequisites & Dependencies
- Zero database migrations required.
- Relies on NextAuth session client hook (`useSession` from `next-auth/react`).
- Permissions evaluated via `useMarcomPermissions` from `@/lib/marcom/permissions`.

---

## 2. Phase 1: Register `CANCEL_OWN_BORROW` in Central Guards SSOT

- [x] **Task 1.1: Update `PermissionAction` union type**
  - File: `src/lib/marcom/guards.ts`
  - Append `| "CANCEL_OWN_BORROW"` to `PermissionAction`.
- [x] **Task 1.2: Update `rolePermissions` table**
  - Add `"CANCEL_OWN_BORROW"` to `admin`, `supervisor`, `warehouse`, and `staff`.
  - Leave `viewer` without this permission.
- [x] **Task 1.3: Update Guards Unit Test**
  - File: `src/lib/marcom/guards.test.ts`
  - Assert `hasPermission("staff", "CANCEL_OWN_BORROW") === true`.
  - Assert `hasPermission("warehouse", "CANCEL_OWN_BORROW") === true`.
  - Assert `hasPermission("supervisor", "CANCEL_OWN_BORROW") === true`.
  - Assert `hasPermission("admin", "CANCEL_OWN_BORROW") === true`.
  - Assert `hasPermission("viewer", "CANCEL_OWN_BORROW") === false`.
- [x] **Task 1.4: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/lib/marcom/guards.test.ts`

---

## 3. Phase 2: Dynamic Ownership Guard in `BorrowDetailModal.tsx`

- [x] **Task 2.1: Hook Integration**
  - File: `src/components/views/InventoryView/BorrowDetailModal.tsx`
  - Import `useSession` from `next-auth/react`.
  - Import `useMarcomPermissions` from `@/lib/marcom/permissions`.
- [x] **Task 2.2: Compute Ownership and Permission Guard**
  - Inside `BorrowDetailModal`:
    ```tsx
    const { data: session } = useSession();
    const { can } = useMarcomPermissions();
    const canCancelOwn = can("CANCEL_OWN_BORROW");

    const isOwner = Boolean(
      session?.user?.name &&
      record.borrowerName.trim().toLowerCase() === session.user.name.trim().toLowerCase()
    );

    const canCancelPending = canManage || (canCancelOwn && isOwner);
    ```
- [x] **Task 2.3: Update Button Rendering Condition**
  - Replace line 461:
    ```tsx
    {record.status === "PENDING" && canCancelPending && (
      <button
        type="button"
        onClick={() => onStatusChange(record.id, "CANCELLED")}
        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1"
      >
        <Ban className="w-3.5 h-3.5" />
        Cancel Request
      </button>
    )}
    ```
  - Verify line 471 (`status === "APPROVED" && canManage`) remains untouched for "Cancel Loan".

---

## 4. Phase 3: Automated Unit Testing

- [x] **Task 3.1: Create `src/components/views/InventoryView/borrowDetailModal.test.ts`**
  - Implement pure helper/logic or JSX test simulating:
    - Condition 1: Staff user matching `borrowerName` with `status === "PENDING"` $\rightarrow$ `canCancelPending === true`.
    - Condition 2: Staff user NOT matching `borrowerName` with `status === "PENDING"` $\rightarrow$ `canCancelPending === false`.
    - Condition 3: Staff user matching `borrowerName` with `status === "APPROVED"` $\rightarrow$ `canManage === false`, no cancel button rendered.
    - Condition 4: Manager user (`canManage === true`) with `status === "PENDING"` $\rightarrow$ `canCancelPending === true` regardless of owner.
    - Condition 5: Manager user (`canManage === true`) with `status === "APPROVED"` $\rightarrow$ "Cancel Loan" rendered.
- [x] **Task 3.2: Execute Component & Guard Tests**
  - Run: `node --test --import ./test/register-alias.mjs src/lib/marcom/guards.test.ts src/components/views/InventoryView/borrowDetailModal.test.ts`

---

## 5. Phase 4: Non-Negotiable Verification Gates & Session Handoff

- [x] **Task 4.1: Drift Invariant Verification**
  - Run: `npm run drift:check` (must pass 100%).
- [x] **Task 4.2: Full Test Suite Execution**
  - Run: `npm test` (0 failures across all tests).
- [x] **Task 4.3: TypeScript Build Verification**
  - Run: `npm run build:check` (0 errors).
- [x] **Task 4.4: Session Handoff Documentation**
  - Update `docs/SESSION_STATE.md` with feature completion notes and references to ADR-0101, Spec, and Plan.



