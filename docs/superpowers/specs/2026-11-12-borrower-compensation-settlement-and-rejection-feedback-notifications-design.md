# Specification: Borrower Compensation Settlement and Rejection Feedback Notifications

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Author:** Senior Software Engineer & Principal Systems Architect
- **References:** ADR-0050, ADR-0052, ADR-0106, ADR-0108, ADR-0109

---

## 1. Executive Summary & Business Flow

This specification formalizes the closing feedback loop for equipment inventory compensation liabilities in Vrello Up. When staff borrowers submit payments for damaged or lost equipment, the subsequent administrative decisions—either full payment verification (`RESOLVED`) or submission rejection (`REJECT`)—must be transparently, proactively, and affirmatively communicated back to the borrower.

### 1.1 Business Problems Addressed
1. **The Silent Resolution Void:**  
   Prior to this design, when an authorized officer clicked *"Konfirmasi Pelunasan"* on a pending verification submission, the transaction transitioned to `RESOLVED`, but `deriveBorrowCompensationNotifications` immediately suppressed `RESOLVED` records. As a result, the pending verification alert disappeared without positive confirmation, leaving the borrower uncertain whether their payment was accepted or lost in administrative backlog.
2. **The Ambiguous Rejection Void:**  
   When an officer rejected an illegible or unverified bank transfer proof, the status reverted to `PENDING_SETTLEMENT`. The borrower was re-presented with a generic liability notice without prominent indication that their prior submission was rejected, nor the reason why.
3. **The Clean Feed Guarantee (Persistent Until Read):**  
   Financial resolution alerts must remain visible until the borrower actually sees them, regardless of when they log in. However, to prevent historical clutter from accumulating indefinitely, resolved notifications are cleanly dismissed from the active feed once the borrower marks notifications as read (`lastSeenNotificationsAt >= settledAt`).

### 1.2 End-to-End User Journeys

#### Journey A: Positive Resolution Confirmation
1. Staff member "Alice" has a loan `BRW-001` with pending compensation proof.
2. Warehouse Officer "Budi" verifies the transfer against company accounts and clicks *"Konfirmasi Pelunasan"*.
3. The server updates `compensationStatus: "RESOLVED"`, `settledAt: new Date()`, `settledBy: "Budi"`.
4. When Alice opens Vrello Up, the Activity Center badge illuminates with an unread count.
5. In the Activity Center feed, Alice sees:
   - **Header:** `Kompensasi ganti rugi (1)`
   - **Title:** `Pelunasan Ganti Rugi Disetujui: BRW-001`
   - **Body:** `Pembayaran ganti rugi sebesar Rp 500.000 telah diverifikasi oleh Budi. Kewajiban Anda telah selesai.`
6. Alice clicks *"Mark all read"* (or closes the session after acknowledging). The notification is permanently dismissed from subsequent sessions.

#### Journey B: Rejection Feedback & Resubmission
1. Staff member "Alice" submits an unreadable screenshot.
2. Warehouse Officer "Budi" clicks *"Tolak Bukti"* with reason `"Bukti transfer buram, mutasi rekening belum masuk"`.
3. The server reverts status to `PENDING_SETTLEMENT` and appends `[DITOLAK Budi - DD/MM/YYYY]: Bukti transfer buram...` to `settlementNotes`.
4. When Alice opens the Activity Center, she sees an urgent warning:
   - **Title:** `Pengajuan Pelunasan Ditolak: BRW-001`
   - **Body:** `Bukti transfer ditolak oleh Budi: Bukti transfer buram, mutasi rekening belum masuk. Silakan ajukan ulang bukti yang sah.`
5. Clicking the notification opens the inventory borrow view, allowing Alice to resubmit valid proof.

---

## 2. Notification State Machine & Lifecycle Rules

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BORROW COMPENSATION NOTIFICATION ENGINE              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [PENDING_SETTLEMENT]                                                  │
│    ├─ (Normal / Initial) ────► Borrower: "Kewajiban Ganti Rugi"        │
│    │                                                                   │
│    └─ (Contains [DITOLAK) ──► Borrower: "Pengajuan Pelunasan Ditolak"  │
│                                                                        │
│  [PENDING_VERIFICATION]                                                │
│    ├─► Borrower: "Pengajuan Pelunasan Dikirim" (Waiting acknowledgment)│
│    │                                                                   │
│    └─► Manager:  "Verifikasi Pelunasan" (Operational review required)  │
│                                                                        │
│  [RESOLVED]                                                            │
│    ├─ If unread (settledAt > lastSeen):                                │
│    │    └──► Borrower: "Pelunasan Ganti Rugi Disetujui"                │
│    │                                                                   │
│    └─ If read (settledAt <= lastSeen):                                 │
│         └──► Suppressed from active feed (Clean feed invariant)        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Rule Invariant Matrix

| Compensation State | Condition | Target Recipient | Notification Title | Body Contents |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING_SETTLEMENT` | No rejection tag | Borrower | `Kewajiban Ganti Rugi: ${code}` | Rp amount and call to upload proof |
| `PENDING_SETTLEMENT` | Notes contain `[DITOLAK` | Borrower | `Pengajuan Pelunasan Ditolak: ${code}` | Officer name + parsed rejection reason |
| `PENDING_VERIFICATION` | Any | Borrower | `Pengajuan Pelunasan Dikirim: ${code}` | Confirmation that proof is under review |
| `PENDING_VERIFICATION` | Any | Manager (`warehouse`, `supervisor`, `admin`) | `Verifikasi Pelunasan: ${code}` | Borrower name + Rp amount awaiting check |
| `RESOLVED` | `settledAt > lastSeenNotificationsAt` (or null) | Borrower | `Pelunasan Ganti Rugi Disetujui: ${code}` | Approved amount + officer name |
| `RESOLVED` | `settledAt <= lastSeenNotificationsAt` | Borrower | *(Omitted)* | Clean feed suppression |
| `RESOLVED` | Any | Manager / Non-Borrower | *(Omitted)* | Managers do not receive resolution notices |

---

## 3. Data Contracts & Interface Extensions

### 3.1 Interface: `BorrowNotificationRow` (`src/lib/productivity/notifications.ts`)

```ts
export interface BorrowNotificationRow {
  id: string;
  borrowCode: string;
  borrowerName: string;
  returnDueDate: string;
  status: string;
  itemsSummary?: string;
  items?: Array<{
    inventoryItem?: { name?: string };
    quantity?: number;
  }>;
  compensationStatus?: string;
  compensationAmount?: number;
  updatedAt?: string;
  // ADR-0109 Extensions:
  settledAt?: string;
  settledBy?: string;
  settledAmount?: number;
  settlementNotes?: string;
}
```

### 3.2 Function Signature: `deriveBorrowCompensationNotifications`

```ts
export function deriveBorrowCompensationNotifications(params: {
  records: BorrowNotificationRow[];
  currentUserName: string;
  userRole: "admin" | "supervisor" | "warehouse" | "staff" | "viewer";
  lastSeenNotificationsAt?: string | null;
  now?: Date;
}): AppNotification[];
```

### 3.3 Rejection Reason Parser Helper

```ts
function extractLatestRejectionReason(notes?: string): { officer?: string; reason: string } {
  if (!notes || !notes.includes("[DITOLAK")) {
    return { reason: "Bukti transfer ditolak oleh petugas." };
  }
  // Matches "[DITOLAK <Officer> - <Date>]: <Reason>"
  const matches = [...notes.matchAll(/\[DITOLAK\s+([^-\]]+?)(?:\s*-\s*[^\]]+)?\]:\s*([^\n]+)/g)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    return { officer: last[1].trim(), reason: last[2].trim() };
  }
  return { reason: "Bukti transfer ditolak oleh petugas." };
}
```

---

## 4. Acceptance Criteria

- **AC-1 (Affirmative Resolution Notification):** When `compensationStatus === "RESOLVED"`, an unread notification with title `"Pelunasan Ganti Rugi Disetujui: ${code}"` is generated exclusively for the borrower.
- **AC-2 (Persistence Until Read):** The `RESOLVED` notification continues to appear on page refresh and session reopen until `lastSeenNotificationsAt >= settledAt`.
- **AC-3 (Clean Dismissal on Mark-Read):** When `lastSeenNotificationsAt >= settledAt` (e.g. after clicking "Mark all read"), the `RESOLVED` notification is omitted from subsequent feeds.
- **AC-4 (Rejection Notification with Reason):** When an officer rejects a settlement, the borrower receives `"Pengajuan Pelunasan Ditolak: ${code}"` containing the extracted rejection reason and officer identity.
- **AC-5 (Strict Borrower Isolation):** Non-borrowers and managers never receive resolution success or rejection notices intended for the borrower.
- **AC-6 (Manager Verification Digest Preserved):** Managers continue to receive operational alerts when transactions enter `PENDING_VERIFICATION`.

---

## 5. Verification Checklist

- [ ] `npm run drift:check` passes with 136/136 matching spec-plan pairs.
- [ ] Unit tests in `notifications.test.ts` verify:
  - Borrower receives resolution confirmation when `lastSeenNotificationsAt` is null or older than `settledAt`.
  - Resolution notification is omitted when `lastSeenNotificationsAt >= settledAt`.
  - Rejection alert extracts rejection reason from `settlementNotes`.
  - Non-borrowers do not receive resolution or rejection alerts.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` runs full suite with 0 failures.


