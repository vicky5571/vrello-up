# ADR 0109: Borrower Compensation Settlement and Rejection Feedback Notifications (Persistent Until Read)

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Author:** Senior Software Engineer & Principal Systems Architect
- **References:** ADR-0050, ADR-0052, ADR-0106, ADR-0108

---

## 1. Context & Business Problem

In Vrello Up's equipment borrowing lifecycle ([ADR-0050](0050-warehouse-role-and-return-inspection-compensation-workflow.md), [ADR-0052](0052-inventory-compensation-settlement-and-restoration-workflow.md), [ADR-0106](0106-hybrid-staff-cash-settlement-submission-and-warehouse-verification.md), and [ADR-0108](0108-strict-one-shot-settlement-nominal-lock-and-compensation-adjustment-workflow.md)), when a borrower incurs liability for damaged or missing equipment, they submit proof of payment via bank transfer (`PENDING_VERIFICATION`). The warehouse officer or administrator subsequently evaluates the submission and either confirms the payment (`CONFIRM` $\rightarrow$ `RESOLVED`) or rejects it (`REJECT` $\rightarrow$ `PENDING_SETTLEMENT`).

### The Communication Gap
While the notification engine ([ADR-0106](0106-hybrid-staff-cash-settlement-submission-and-warehouse-verification.md)) successfully informs managers when proof is submitted and alerts borrowers when liabilities are pending, it contains an **operational feedback void** at the terminal decision moments:
1. **Silent Resolution on Payment Confirmation (`RESOLVED`):**  
   When an admin or warehouse officer confirms a payment as received, `deriveBorrowCompensationNotifications` previously executed `if (rec.compensationStatus === "RESOLVED") continue`. The pending verification alert disappeared silently. The borrower received no confirmation that their funds were safely received and that their debt was officially expunged.
2. **Ambiguous Feedback on Rejection (`REJECT`):**  
   When an officer rejects a payment proof due to an invalid receipt, illegible image, or missing funds in the company bank account, the record returns to `PENDING_SETTLEMENT`. The borrower previously saw a generic "Kewajiban Ganti Rugi" alert without prominent indication that their previous submission had been rejected, nor the reason why.
3. **Persistence Dilemma:**  
   Unlike transient alerts (e.g. task moves), a financial resolution notice must persist until the borrower actually sees it. However, because `RESOLVED` is a terminal state, emitting notifications for every historical `RESOLVED` record without a dismissal mechanism would permanently pollute the borrower's Activity Center with years of old settled loans.

---

## 2. Options Considered

### Option 1: Time-Windowed TTL (e.g. 7 Days Post-Settlement)
- Render `RESOLVED` notifications only if `settledAt` is within the past 7 days.
- **Pros:** Automatic cleanup without requiring user action.
- **Cons:** If a staff member is on annual leave or off-site for 10 days, they completely miss the confirmation that their payment was approved.

### Option 2: State-Aware Persistence Until Dismissed / Read (Chosen)
- Deliver affirmative `RESOLVED` confirmation and explicit rejection alerts directly to the borrower in the Activity Center.
- **Resolution Persistence Model:**
  - When `compensationStatus === "RESOLVED"`, emit the `borrow_compensation` notification for the borrower (`rec.borrowerName === currentUserName`).
  - To prevent historical clutter while guaranteeing delivery, evaluate the user's `lastSeenNotificationsAt` timestamp:
    - If `!lastSeenNotificationsAt` or `new Date(rec.settledAt || rec.updatedAt).getTime() > new Date(lastSeenNotificationsAt).getTime()`, the resolution is unread: **emit the notification**.
    - Once the user views the notifications and clicks *"Mark all read"* (which updates `lastSeenNotificationsAt = now.toISOString()`), the resolved notification is permanently suppressed from the active feed.
- **Rejection Notification Model:**
  - When `compensationStatus === "PENDING_SETTLEMENT"` and `rec.settlementNotes` contains rejection markers (e.g. `[DITOLAK`), extract the latest rejection reason and display an urgent alert:  
    `title: "Pengajuan Pelunasan Ditolak: ${rec.borrowCode}"`  
    `body: "Bukti transfer ditolak oleh ${officer}. Alasan: ${reason}. Silakan ajukan ulang bukti yang sah."`
- **Pros:** 100% guaranteed delivery regardless of when the staff member logs in; zero historical clutter once read/dismissed; clear actionable feedback on rejection.
- **Cons:** Requires threading `lastSeenNotificationsAt` into `deriveBorrowCompensationNotifications`.

### Option 3: Passive In-Modal Banners Only
- Display settlement confirmation and rejection feedback only inside `BorrowDetailModal`.
- **Pros:** No changes to `NotificationCenter`.
- **Cons:** Defeats the purpose of proactive notifications; staff are left in the dark unless they proactively hunt down and open the modal.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1 (7-Day TTL) | Option 2 (Persistent Until Read - Chosen) | Option 3 (In-Modal Only) |
| :--- | :--- | :--- | :--- |
| **Delivery Guarantee** | Partial (missed if offline >7 days) | **100% Guaranteed (persists until user acknowledges)** | Zero (passive discovery only) |
| **Feed Clutter Control** | Good (cleans up after 7 days) | **Excellent (dismissed on "Mark all read")** | Perfect (no notifications) |
| **Rejection Transparency** | Good | **High (prominent rejection alert with reason)** | Low |
| **Staff Peace of Mind** | Medium | **High (immediate positive confirmation)** | Low |

---

## 4. Decision & Technical Architecture

We adopt **Option 2: State-Aware Persistence Until Dismissed / Read**.

### 4.1. Extension of `deriveBorrowCompensationNotifications` Signature
Thread `lastSeenNotificationsAt?: string | null` into parameter object:
```ts
export function deriveBorrowCompensationNotifications(params: {
  records: BorrowNotificationRow[];
  currentUserName: string;
  userRole: "admin" | "supervisor" | "warehouse" | "staff" | "viewer";
  lastSeenNotificationsAt?: string | null;
  now?: Date;
}): AppNotification[];
```

### 4.2. Resolution Feedback Notification Contract
When `rec.compensationStatus === "RESOLVED"`:
1. Target only the borrower (`rec.borrowerName.toLowerCase() === currentUserName.toLowerCase()`).
2. Compare resolved timestamp `resolvedAtMs = new Date(rec.settledAt || rec.updatedAt).getTime()`.
3. If `lastSeenNotificationsAt` exists and `resolvedAtMs <= new Date(lastSeenNotificationsAt).getTime()`, **skip** (already seen and dismissed).
4. Otherwise, emit:
   - `id: "borrow-comp-resolved-${rec.id}"`
   - `kind: "borrow_compensation"`
   - `title: "Pelunasan Ganti Rugi Disetujui: ${rec.borrowCode}"`
   - `body: "Pembayaran ganti rugi sebesar Rp ${(rec.settledAmount || rec.compensationAmount || 0).toLocaleString("id-ID")} telah diverifikasi oleh ${rec.settledBy || "Admin/Gudang"}. Kewajiban Anda telah selesai."`
   - `createdAt: rec.settledAt || rec.updatedAt || now.toISOString()`

### 4.3. Rejection Feedback Notification Contract
When `rec.compensationStatus === "PENDING_SETTLEMENT"` and `rec.settlementNotes` indicates rejection (contains `[DITOLAK`):
1. Extract the latest rejection reason using regex or string splitting.
2. Emit an explicit rejection notification:
   - `id: "borrow-comp-rejected-${rec.id}"`
   - `kind: "borrow_compensation"`
   - `title: "Pengajuan Pelunasan Ditolak: ${rec.borrowCode}"`
   - `body: "Bukti transfer ditolak oleh petugas: ${extractedReason}. Silakan ajukan ulang bukti yang sah."`
   - `createdAt: rec.updatedAt || now.toISOString()`

---

## 5. Consequences & Trade-offs

### Positive Consequences
- **Positive Financial Closure:** Borrowers are immediately informed when their payment has been validated and their company liability cleared.
- **Actionable Rejection Guidance:** Staf are immediately notified if their transfer receipt was rejected and why, preventing liabilities from languishing unnoticed.
- **Zero Invariant Drift:** Reuses the existing `borrow_compensation` notification kind and TopNav notification feed pipeline without new database models or table mutations.
- **Clutter-Free Operation:** Once the user clicks "Mark all read", older resolved notifications cleanly disappear from the active feed.

### Accepted Trade-offs
- `BorrowNotificationRow` is extended with optional fields `settledAt?: string`, `settledBy?: string`, and `settlementNotes?: string`. All three fields already exist on the Prisma `BorrowRecord` model and are already returned by the `/api/marcom/inventory/borrow` endpoint.

---

## 6. Verification & Invariants

1. **Resolution Receipt Invariant:** A borrower with an unread `RESOLVED` record receives a success notification until `lastSeenNotificationsAt >= settledAt`.
2. **Dismissal Invariant:** When `lastSeenNotificationsAt >= settledAt`, the resolved notification is omitted from the feed.
3. **Rejection Alert Invariant:** When an officer rejects proof with a reason, the borrower receives a clear rejection alert containing that reason.
4. **Non-Borrower Isolation Invariant:** Non-borrowers do not receive resolution or rejection notices intended for the borrower.
5. **Non-Negotiable Gates:** `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 failures and 0 errors.



