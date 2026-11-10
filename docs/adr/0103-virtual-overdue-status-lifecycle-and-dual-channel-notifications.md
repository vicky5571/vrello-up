# ADR-0103: Virtual Overdue Status Lifecycle and Dual-Channel Notifications

- **Status:** APPROVED
- **Date:** 2026-11-11
- **Deciders:** Senior Software Engineer, Lead Architect

---

## 1. Context & Business Problem

In *vrello-up*, promotional equipment borrowed for field activations has an explicit return deadline (`returnDueDate`). In the PostgreSQL database, `BorrowStatus` contains an `OVERDUE` enum value, but the system currently treats `OVERDUE` purely as a **virtual, dynamically computed display state**:
- In `src/app/api/marcom/inventory/borrow/route.ts` and related endpoints, `normalizeBorrowRecord` checks:
  ```ts
  if (currentStatus === "ACTIVE" && record.returnDueDate && new Date(record.returnDueDate) < new Date()) {
    currentStatus = "OVERDUE";
  }
  ```
- The underlying database row retains `status = "ACTIVE"`.
- No state transition event occurs on the server when a loan passes its return deadline.

### The Operational Problem
Because the overdue state is calculated purely at UI read-time:
1. **Passive Tracking & Forgotten Assets:** Field staff and warehouse officers are never proactively alerted when an item becomes overdue. If staff forget to return equipment, days or weeks can elapse before anyone notices.
2. **Domino Collisions for Upcoming Bookings:** Under the Calendar-Based Booking Engine (ADR-0102), an unreturned overdue asset endangers the physical fulfillment of upcoming bookings scheduled with tight buffers ($T+0$ or $T+1$).
3. **Absence of Actionable Notifications:** The application's top navigation notification center (`useNotificationFeed.ts`) currently tracks task assignments, MOU approvals, and task overdues, but completely ignores inventory borrowing overdues. Furthermore, field staff who do not actively log into the web dashboard miss critical return alerts entirely.

We need an architecture that proactively alerts borrowers and warehouse officers through both **In-App TopNav Bell notifications** and **automated Email reminders via Cron**, while intentionally keeping the database status virtual to prevent premature state churn and worker dependencies.

---

## 2. Options Considered

### Option A: Pure Virtual Status with In-App Bell Derivation Only
- Keep status virtual; derive `borrow_overdue` notifications purely in memory when users open the application (`src/lib/productivity/notifications.ts`).
- *Trade-offs:*
  - Pros: Zero background worker or cron requirement; zero email dependencies.
  - Cons: Fails to reach field staff who are on the road and not logged into the desktop web app.

### Option B: Database Status Persistence via Scheduled Cron with Email Alerts Only
- Run a daily cron job that mutates `BorrowRecord.status = 'OVERDUE'` in PostgreSQL and dispatches emails.
- *Trade-offs:*
  - Pros: Status is physically stored in database rows.
  - Cons: Introduces state lag (records only become overdue when cron fires, not instantly at midnight); introduces database write churn and worker failure failure modes.

### Option C: Hybrid Architecture — Retain Virtual Status + Dual-Channel Notifications (Chosen)
- **Status Persistence:** Maintain `OVERDUE` as a virtual/derived state in the database layer and API normalization (`normalizeBorrowRecord`). The database row remains `ACTIVE`, ensuring zero latency, zero worker dependencies for UI display, and instantaneous transition at midnight.
- **In-App Notification Channel:** Integrate `borrow_overdue` signals into the TopNav Notification Center (`notifications.ts` & `useNotificationFeed.ts`). When staff or managers open the application, overdue loans are surfaced in the notification bell with direct links to the borrow detail drawer.
- **Email Notification Channel:** Add a scheduled daily operational cron endpoint (`GET /api/cron/borrow-overdue-sync` guarded by `CRON_SECRET`) using the existing mailer infrastructure (`src/lib/server/mailer.ts`). The cron scans active records where `returnDueDate < NOW()`, dispatches reminder emails to borrowers, and sends a daily overdue digest to warehouse managers.
- *Trade-offs:*
  - Pros: Best of both worlds: zero-lag, self-healing virtual UI status; instant in-app alerts; external email reach for field staff; zero schema migrations.
  - Cons: Requires configuring CRON_SECRET and SMTP environment variables for email delivery.

---

## 3. Decision

Adopt **Option C**:
1. **Preserve Virtual Status:** Keep `BorrowRecord.status` as `ACTIVE` in PostgreSQL. Compute `OVERDUE` dynamically via `normalizeBorrowRecord` and query helpers (`status: "ACTIVE", returnDueDate: { lt: now }`).
2. **TopNav Bell In-App Notifications:**
   - Add `"borrow_overdue"` to `NotificationKind` in `src/lib/productivity/notifications.ts`.
   - Update `useNotificationFeed.ts` to fetch user's active borrow records and synthesize actionable overdue warnings.
   - For Borrowers: *"Peminjaman [borrowCode] telah melewati batas waktu pengembalian."*
   - For Warehouse / Management: *"Terdapat N peminjaman aktif yang melewati batas pengembalian."*
3. **Daily Scheduled Email Cron:**
   - Implement `src/app/api/cron/borrow-overdue-sync/route.ts` protected by `CRON_SECRET`.
   - Scan overdue records daily at 07:00 AM.
   - Dispatch individual reminder emails to borrowers (via `sendMail` in `mailer.ts`).
   - Dispatch a consolidated operational overdue recap to the warehouse/supervisor email list.

---

## 4. Consequences & Mitigations

### Positive Consequences
- **Instant UI Accuracy:** UI status flips to `OVERDUE` precisely at the day boundary without waiting for any cron run.
- **Proactive Multi-Channel Reach:** Field staff receive email reminders even when off-site, and see immediate badges in the TopNav bell upon logging in.
- **Logistics Protection:** Warehouse officers receive early notification of unreturned gear, allowing them to intervene before domino collisions affect subsequent bookings.

### Accepted Trade-offs & Mitigations
- **Email Delivery Dependencies:** If SMTP is not configured in local/test environments, `mailer.ts` safely skips transmission without throwing errors (existing invariant verified in `mailer.test.ts`).
- **Database Query Invariant:** Because DB status is virtual, API queries must continue using the existing composite filter `{ OR: [{ status: "OVERDUE" }, { status: "ACTIVE", returnDueDate: { lt: new Date() } }] }`.


