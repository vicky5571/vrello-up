# Design Spec: Virtual Overdue Status Lifecycle & Dual-Channel Notifications

- **Date:** 2026-11-11
- **Status:** APPROVED
- **Author:** Senior Software Engineer & Principal Systems Architect
- **Target ADR:** [ADR-0103](../../adr/0103-virtual-overdue-status-lifecycle-and-dual-channel-notifications.md)

---

## 1. Executive Summary

This specification establishes a dual-channel proactive notification architecture for overdue equipment loans in *vrello-up*, resolving the passive tracking vulnerability (Temuan 5).

To maintain high data integrity and avoid database write-churn, the database status of `BorrowRecord` remains **virtual** (`ACTIVE` in PostgreSQL, dynamically normalized to `OVERDUE` during serialization). 

Proactive alerting is achieved across two complementary channels:
1. **In-App TopNav Notification Center:** Automatically derives personalized overdue alerts for field borrowers and consolidated summaries for warehouse officers on application mount and window focus.
2. **Scheduled Daily Operational Cron (`/api/cron/borrow-overdue-sync`):** Periodically queries overdue loans, sends individual email reminders to borrowers, and transmits a consolidated operational digest to warehouse logistics managers.

---

## 2. In-App Notification Center Specification (`notifications.ts`)

### 2.1. Type Extensions
In `src/lib/productivity/notifications.ts`:
```ts
export type NotificationKind =
  | "assignment"
  | "mou_approval"
  | "mou_expiry"
  | "status"
  | "overdue"
  | "borrow_overdue"; // New kind for equipment borrowing
```

### 2.2. Pure Function Signature: `deriveBorrowOverdueNotifications`
```ts
export interface BorrowNotificationRow {
  id: string;
  borrowCode: string;
  borrowerName: string;
  returnDueDate: string; // ISO string
  status: string;        // "ACTIVE" | "OVERDUE"
  itemsSummary?: string; // e.g. "Tenda Lipat (2), Sound System (1)"
}

export function deriveBorrowOverdueNotifications(params: {
  records: BorrowNotificationRow[];
  currentUserName: string;
  userRole: "admin" | "supervisor" | "warehouse" | "staff" | "viewer";
  now?: Date;
}): AppNotification[];
```

### 2.3. Derivation Logic & Rules
1. **Filter Active Overdue Loans:**
   - Filter records where status is `"ACTIVE"` or `"OVERDUE"` and `new Date(record.returnDueDate) < now`.
2. **Borrower Personal Notification:**
   - If `userRole === "staff"` or `record.borrowerName.toLowerCase() === currentUserName.toLowerCase()`:
   - Generate individual notification per overdue loan:
     - `title`: `"Peringatan: Peminjaman ${record.borrowCode} Telah Jatuh Tempo"`
     - `body`: `"Batas pengembalian alat (${record.itemsSummary || 'Peralatan'}) telah terlewati pada ${formattedDueDate}. Harap segera dikembalikan ke gudang."`
     - `kind`: `"borrow_overdue"`
     - `id`: `"borrow-overdue-${record.id}"`
3. **Warehouse / Management Digest Notification:**
   - If `userRole === "warehouse"` or `userRole === "supervisor"` or `userRole === "admin"`:
   - If count $N > 0$:
     - `title`: `"Perhatian: ${N} Peminjaman Alat Melewati Batas Pengembalian"`
     - `body`: `"Terdapat ${N} unit peminjaman aktif yang belum dikembalikan oleh staf lapangan. Periksa tab Borrowing Tracking untuk tindak lanjut."`
     - `kind`: `"borrow_overdue"`
     - `id`: `"borrow-overdue-digest-${formatDate(now)}"`

---

## 3. Scheduled Operational Email Cron Contract (`/api/cron/borrow-overdue-sync`)

### 3.1. Endpoint Specification
- **Path:** `GET /api/cron/borrow-overdue-sync`
- **Security:**
  - In production (`process.env.NODE_ENV === "production"`), requires `Authorization: Bearer ${CRON_SECRET}`.
  - Returns `401 Unauthorized` if secret is missing or invalid.
- **Query Filter:**
  ```ts
  const overdueRecords = await prisma.borrowRecord.findMany({
    where: {
      status: "ACTIVE",
      returnDueDate: { lt: new Date() },
    },
    include: {
      items: {
        include: { inventoryItem: { select: { name: true } } },
      },
    },
  });
  ```

### 3.2. Email Dispatch Flow (`src/lib/server/mailer.ts`)
1. **Borrower Individual Reminders:**
   - For each overdue record, lookup borrower email:
     ```ts
     const user = await prisma.user.findFirst({
       where: { name: { equals: record.borrowerName.trim(), mode: "insensitive" } },
       select: { email: true },
     });
     ```
   - If email found, send HTML email reminder with subject:
     `"[Peringatan] Pengembalian Peralatan Marcom: ${record.borrowCode}"`
   - Content: list of items borrowed, due date, warehouse contact/instructions.
2. **Warehouse Operational Digest:**
   - Query all active users with role `warehouse`, `supervisor`, or `admin`:
     ```ts
     const managers = await prisma.user.findMany({
       where: { role: { in: ["warehouse", "supervisor", "admin"] }, active: true },
       select: { email: true },
     });
     ```
   - Send single consolidated email digest summarizing all $N$ overdue loans with borrow codes, borrower names, and days elapsed.
3. **Response Payload:**
   ```json
   {
     "ok": true,
     "syncedAt": "2026-11-11T00:00:00.000Z",
     "totalOverdue": 3,
     "borrowersNotified": 2,
     "managersNotified": 4
   }
   ```

---

## 4. Virtual Status Data Invariants

1. **Database Status Invariant:**
   - Under no circumstances shall the cron job or notification service execute `UPDATE BorrowRecord SET status = 'OVERDUE'`.
   - The database status remains strictly `"ACTIVE"`.
2. **Query Normalization Invariant:**
   - Client and API responses must continue using `normalizeBorrowRecord()` to map `"ACTIVE"` to `"OVERDUE"` when `returnDueDate < now`.
   - Any raw prisma query searching for overdue records must use:
     `{ OR: [{ status: "OVERDUE" }, { status: "ACTIVE", returnDueDate: { lt: new Date() } }] }`.

---

## 5. Acceptance Criteria (Gherkin Scenarios)

### AC-1: Borrower Personal In-App Overdue Alert
- **Given** an authenticated user "Rahmat Hidayat" with role `staff`
- **And** an active borrow record `BRW-20261101-001` with `borrowerName: "Rahmat Hidayat"` and `returnDueDate` in the past
- **When** Rahmat opens the application or focuses the window
- **Then** the TopNav notification bell shows an unread badge
- **And** the notification item displays kind `"borrow_overdue"` referencing `BRW-20261101-001`.

### AC-2: Non-Borrower Staff Isolation
- **Given** an authenticated user "Siti Rahma" with role `staff`
- **And** an active overdue record belonging to "Rahmat Hidayat"
- **When** Siti opens the application
- **Then** Siti does NOT receive Rahmat's personal overdue alert.

### AC-3: Warehouse Manager Overdue Digest Alert
- **Given** an authenticated user with role `warehouse`, `supervisor`, or `admin`
- **And** 3 active borrow records past their `returnDueDate`
- **When** the manager opens the application
- **Then** the notification bell surfaces a consolidated digest: `"Perhatian: 3 Peminjaman Alat Melewati Batas Pengembalian"`.

### AC-4: Automatic Disappearance upon Return
- **Given** an active overdue borrow record generating an in-app alert
- **When** the warehouse officer processes `/return` on the record
- **Then** on the next feed evaluation, the overdue alert is automatically removed from the notification feed.

### AC-5: Cron Execution & Authorization Security
- **Given** an environment in production mode
- **When** `GET /api/cron/borrow-overdue-sync` is invoked without `Authorization: Bearer CRON_SECRET`
- **Then** the endpoint rejects with HTTP 401
- **When** invoked with valid bearer secret
- **Then** it responds with HTTP 200 and JSON summary of notifications sent.

### AC-6: Safe Execution when SMTP is Disabled
- **Given** a testing or local environment where SMTP credentials are not configured
- **When** the cron endpoint runs
- **Then** it completes successfully without crashing or throwing unhandled rejections.

---

## 6. Non-Goals

1. **No Database State Mutation:** The cron shall not mutate `BorrowRecord.status = 'OVERDUE'`.
2. **No WhatsApp/SMS Integration:** Alerts are confined to In-App Bell and Email channels.
3. **No Schema Changes:** Zero migrations to `prisma/schema.prisma`.

---

## 7. Verification Checklist

- [ ] `npm run drift:check` passes with zero violations.
- [ ] Unit tests for `deriveBorrowOverdueNotifications` pass all personal and digest scenarios in `notifications.test.ts`.
- [ ] Integration tests in `borrowOverdueSyncRoute.test.ts` verify cron authorization, scan filters, and safe mailer execution.
- [ ] Full regression suite passes with 0 failures (`npm test`).
- [ ] `npm run build:check` compiles with 0 errors.



