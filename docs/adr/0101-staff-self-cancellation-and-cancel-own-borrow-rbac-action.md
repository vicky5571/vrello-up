# ADR-0101: Staff Self-Cancellation of Pending Requests via CANCEL_OWN_BORROW Permission

- **Status:** APPROVED
- **Date:** 2026-11-10
- **Deciders:** Senior Software Engineer, Lead Architect

---

## 1. Context & Business Problem

In *vrello-up*, field staff regularly submit equipment borrow requests (`POST /api/marcom/inventory/borrow`) for upcoming brand activations, promo events, and partner store activities. When submitted, the borrow request enters a `PENDING` state awaiting administrative review.

However, an operational friction and access-control contradiction was identified in the UI:
- In `BorrowDetailModal.tsx`, the "Cancel Request" button for records in `PENDING` status is guarded strictly by:
  ```tsx
  {record.status === "PENDING" && canManage && (
    <button onClick={() => onStatusChange(record.id, "CANCELLED")}>
      Cancel Request
    </button>
  )}
  ```
- Under ADR-0050, the `MANAGE_INVENTORY` permission was intentionally stripped from the `staff` role to prevent unauthorized self-service asset edits and inventory modifications. Consequently, `canManage = can("MANAGE_INVENTORY")` evaluates to `false` for all Staff members.
- As a result, Field Staff who mistakenly select the wrong equipment, or whose event is suddenly cancelled by a client/partner, cannot cancel their own pending tickets. They face a dead-end UI and are forced to message Warehouse officers or Administrators to manually cancel the request.
- Conversely, once a loan is `APPROVED`, equipment staging may have already begun, meaning cancellation at that stage ("Cancel Loan") must remain an administrative action restricted to logistics managers.

---

## 2. Options Considered

### Option 1: Ad-hoc Name Matching in UI Component without RBAC Registry Update
- In `BorrowDetailModal.tsx`, inspect `record.borrowerName === session.user.name` alongside `canManage`.
- *Trade-offs:*
  - Pros: Zero registry changes.
  - Cons: Bypasses the centralized RBAC SSOT (`src/lib/marcom/guards.ts`); authorization rule is implicit and hardcoded in component logic.

### Option 2: Database Schema Migration (`createdById` on `BorrowRecord`)
- Add a foreign key column `createdById String?` linking to `User.id` in `schema.prisma`.
- *Trade-offs:*
  - Pros: Strong relational integrity.
  - Cons: Requires database migration, backfill strategy for legacy records, and introduces downtime/lock risks for a problem that is primarily operational lifecycle management.

### Option 3: Dedicated Permission Action `CANCEL_OWN_BORROW` in Central RBAC Registry (Chosen)
- Formally register `CANCEL_OWN_BORROW` into `PermissionAction` in `src/lib/marcom/guards.ts`.
- Grant `CANCEL_OWN_BORROW` to `admin`, `supervisor`, `warehouse`, and `staff`.
- In `BorrowDetailModal.tsx`, compute:
  ```ts
  const isOwner = Boolean(
    session?.user?.name &&
    record.borrowerName.trim().toLowerCase() === session.user.name.trim().toLowerCase()
  );
  const canCancelPending = canManage || (can("CANCEL_OWN_BORROW") && isOwner);
  ```
  Render "Cancel Request" if `record.status === "PENDING" && canCancelPending`.
- Keep "Cancel Loan" (`status === "APPROVED"`) strictly guarded by `canManage`.
- In `PUT /api/marcom/inventory/borrow/[id]`, validate that cancellation of `PENDING` records is permitted for callers with `MANAGE_INVENTORY` OR (`CANCEL_OWN_BORROW` with matching requester name).
- *Trade-offs:*
  - Pros: Clean architectural SSOT; declares permission explicitly in the authorization matrix; zero database migration; immediately unblocks field staff.
  - Cons: Requires matching borrower name against session identity.

---

## 3. Decision

Adopt **Option 3**:
1. Add `CANCEL_OWN_BORROW` to `PermissionAction` in `src/lib/marcom/guards.ts`, granting it to `admin`, `supervisor`, `warehouse`, and `staff`.
2. Update `BorrowDetailModal.tsx` so that `record.status === "PENDING"` allows cancellation if `canManage || (can("CANCEL_OWN_BORROW") && isOwner)`.
3. Retain `canManage` as an exclusive requirement for cancelling `APPROVED` loans.
4. Align server-side `PUT` handler verification with the `CANCEL_OWN_BORROW` permission check for self-cancellation.

---

## 4. Consequences & Mitigations

### Positive Consequences
- **Operational Autonomy:** Field staff can retract or correct pending equipment requests without administrative intervention.
- **Auditable Authorization:** The capability is explicitly defined in `src/lib/marcom/guards.ts`, making security policies queryable and testable.
- **Logistics Protection:** Staff cannot cancel requests that have already progressed to `APPROVED` or `ACTIVE`, protecting warehouse physical staging workflows.

### Accepted Trade-offs & Mitigations
- **Requester Identification:** Name matching (`record.borrowerName.trim().toLowerCase() === session.user.name.trim().toLowerCase()`) is used. Since `BorrowRequestModal` automatically defaults `borrowerName` from `session.user.name`, standard requests match seamlessly.

