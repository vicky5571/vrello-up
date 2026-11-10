# Implementation Plan: Virtual Overdue Status Lifecycle and Dual-Channel Notifications

- **Date:** 2026-11-11
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** [2026-11-11-virtual-overdue-status-lifecycle-and-dual-channel-notifications-design.md](../specs/2026-11-11-virtual-overdue-status-lifecycle-and-dual-channel-notifications-design.md)
- **ADR:** [ADR-0103](../../adr/0103-virtual-overdue-status-lifecycle-and-dual-channel-notifications.md)

---

## 1. Executive Summary & File Manifest

This plan implements proactive dual-channel alerting for equipment borrowing overdues (In-App TopNav Bell notifications and daily operational email cron reminders) while preserving the virtual/derived status lifecycle in PostgreSQL without database write churn.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/lib/productivity/notifications.ts` | Edit | Register `"borrow_overdue"` in `NotificationKind` and implement `deriveBorrowOverdueNotifications()`. | ~45 lines added |
| `src/lib/productivity/notifications.test.ts` | Edit | Unit tests for borrower individual alerts and warehouse digest alerts. | ~50 lines added |
| `src/lib/productivity/useNotificationFeed.ts` | Edit | Fetch active borrow records and synthesize `borrow_overdue` signals into TopNav bell. | ~30 lines edited |
| `src/app/api/cron/borrow-overdue-sync/route.ts` | Create | Daily operational cron endpoint protected by `CRON_SECRET` for email dispatch. | ~75 lines created |
| `src/app/api/cron/borrowOverdueSyncRoute.test.ts` | Create | Integration tests for cron authorization, scan filters, and safe mailer execution. | ~60 lines created |
| `docs/SESSION_STATE.md` | Edit | Update feature status and test verification history. | ~10 lines edited |

### Prerequisites & Dependencies
- Zero database migrations required (preserves zero-downtime and virtual status invariant).
- Reuses existing mailer infrastructure (`src/lib/server/mailer.ts`).

---

## 2. Phase 1: Pure In-App Notification Derivation Engine

- [x] **Task 1.1: Register `"borrow_overdue"` in `NotificationKind`**
  - File: `src/lib/productivity/notifications.ts`
  - Append `| "borrow_overdue"` to `NotificationKind` union.
- [x] **Task 1.2: Implement `deriveBorrowOverdueNotifications()`**
  - File: `src/lib/productivity/notifications.ts`
  - Accept `BorrowNotificationRow[]`, `currentUserName`, `userRole`, and optional `now` timestamp.
  - Filter overdue active loans: `(status === "ACTIVE" || status === "OVERDUE") && new Date(returnDueDate) < now`.
  - For borrower: Emit personal notification if `userRole === "staff"` or `borrowerName === currentUserName`.
  - For managers: If `userRole` in `['warehouse', 'supervisor', 'admin']` and count $> 0$, emit consolidated digest notification.
- [x] **Task 1.3: Unit Test Pure Derivation**
  - File: `src/lib/productivity/notifications.test.ts`
  - Test Case A: Generates personal overdue alert for borrower.
  - Test Case B: Isolates alerts between different staff members.
  - Test Case C: Generates single consolidated digest for warehouse officer.
  - Test Case D: Returns empty array when all returns are on time.
- [x] **Task 1.4: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/lib/productivity/notifications.test.ts`

---

## 3. Phase 2: Hook & TopNav Bell Feed Integration

- [x] **Task 2.1: Update `useNotificationFeed.ts` to fetch active borrows**
  - File: `src/lib/productivity/useNotificationFeed.ts`
  - Parallelize fetch: fetch `/api/marcom/mous` and `/api/marcom/inventory/borrow?status=ACTIVE`.
  - Pass resolved borrow records into `deriveBorrowOverdueNotifications()`.
  - Merge derived borrow notifications with existing MOU and task notification list.
- [x] **Task 2.2: Verify Hook Invariants & Lifecycle**
  - Run: `node --test --import ./test/register-alias.mjs src/lib/productivity/useNotificationFeed.test.ts`

---

## 4. Phase 3: Operational Email Cron Endpoint (`/api/cron/borrow-overdue-sync`)

- [x] **Task 3.1: Create Route Handler**
  - File: `src/app/api/cron/borrow-overdue-sync/route.ts`
  - Enforce `CRON_SECRET` check in production.
  - Query Prisma for `status: "ACTIVE"` and `returnDueDate: { lt: new Date() }`.
  - Dispatch reminder emails via `sendMail` in `src/lib/server/mailer.ts`.
  - Dispatch consolidated digest email to warehouse users (`role IN ['warehouse', 'supervisor', 'admin']`).
  - Return JSON status response with counts.
- [x] **Task 3.2: Create Integration Tests**
  - File: `src/app/api/cron/borrowOverdueSyncRoute.test.ts`
  - Test 1: Rejects unauthorized requests with 401 when in production mode with `CRON_SECRET`.
  - Test 2: Permits authorized execution and queries overdue records safely.
  - Test 3: Handles unconfigured SMTP environment safely without throwing unhandled exceptions.
- [x] **Task 3.3: Verify Phase 3**
  - Run: `node --test --import ./test/register-alias.mjs src/app/api/cron/borrowOverdueSyncRoute.test.ts`

---

## 5. Phase 4: Non-Negotiable Verification Gates & Session Handoff

- [x] **Task 4.1: Drift Invariant Verification**
  - Run: `npm run drift:check` (must pass 100% with spec-plan pairing).
- [x] **Task 4.2: Full Test Suite Execution**
  - Run: `npm test` (0 failures across full suite).
- [x] **Task 4.3: TypeScript Build Verification**
  - Run: `npm run build:check` (0 errors).
- [x] **Task 4.4: Session Handoff Documentation**
  - Update `docs/SESSION_STATE.md` with feature completion notes and references to ADR-0103, Spec, and Plan.



