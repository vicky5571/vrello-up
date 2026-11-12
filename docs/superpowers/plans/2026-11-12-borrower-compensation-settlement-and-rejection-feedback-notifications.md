# Implementation Plan: Borrower Compensation Settlement and Rejection Feedback Notifications

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Spec Reference:** `docs/superpowers/specs/2026-11-12-borrower-compensation-settlement-and-rejection-feedback-notifications-design.md`
- **ADR Reference:** `docs/adr/0109-borrower-compensation-settlement-and-rejection-feedback-notifications.md`

---

## 1. File Manifest & Responsibilities

| File Path | Responsibility | Estimated Changes |
| :--- | :--- | :--- |
| `src/lib/productivity/notifications.ts` | Extend `BorrowNotificationRow` with settlement fields; update `deriveBorrowCompensationNotifications` with resolution & rejection feedback logic | ~40 LOC modified |
| `src/lib/productivity/notifications.test.ts` | Unit tests for AC-1 through AC-6 (resolution feedback, persistence, mark-read dismissal, rejection parsing) | ~80 LOC addition |
| `src/components/layout/NotificationCenter.tsx` | Pass `lastSeenNotificationsAt` to `deriveBorrowCompensationNotifications`; maintain coordinator size $\le 250$ LOC | ~3 LOC modified |
| `docs/SESSION_STATE.md` | Session tracking and verification gates | Status update |

---

## 2. Phased Implementation Roadmap

### Phase 1: Pure Notification Derivation & Rejection Parser
- [ ] **Task 1.1:** In `src/lib/productivity/notifications.ts`, extend `BorrowNotificationRow`:
  ```ts
  settledAt?: string;
  settledBy?: string;
  settledAmount?: number;
  settlementNotes?: string;
  ```
- [ ] **Task 1.2:** Update `deriveBorrowCompensationNotifications` parameters to accept `lastSeenNotificationsAt?: string | null`:
  ```ts
  export function deriveBorrowCompensationNotifications(params: {
    records: BorrowNotificationRow[];
    currentUserName: string;
    userRole: "admin" | "supervisor" | "warehouse" | "staff" | "viewer";
    lastSeenNotificationsAt?: string | null;
    now?: Date;
  }): AppNotification[];
  ```
- [ ] **Task 1.3:** Implement affirmative `RESOLVED` notification for borrower:
  - If `rec.compensationStatus === "RESOLVED"` and `isBorrower`:
    - Compute `resolvedAtMs = new Date(rec.settledAt || rec.updatedAt || now.toISOString()).getTime()`.
    - If `lastSeenNotificationsAt && resolvedAtMs <= new Date(lastSeenNotificationsAt).getTime()`: skip (already acknowledged).
    - Otherwise, emit:
      - `id: "borrow-comp-resolved-${rec.id}"`
      - `kind: "borrow_compensation"`
      - `title: "Pelunasan Ganti Rugi Disetujui: ${rec.borrowCode}"`
      - `body: "Pembayaran ganti rugi sebesar Rp ${(rec.settledAmount || rec.compensationAmount || 0).toLocaleString("id-ID")} telah diverifikasi oleh ${rec.settledBy || "Admin/Gudang"}. Kewajiban Anda telah selesai."`
      - `createdAt: rec.settledAt || rec.updatedAt || now.toISOString()`
- [ ] **Task 1.4:** Implement rejection feedback notification for borrower:
  - If `rec.compensationStatus === "PENDING_SETTLEMENT"` and `isBorrower` and `rec.settlementNotes?.includes("[DITOLAK")`:
    - Extract rejection reason and officer from notes.
    - Emit:
      - `id: "borrow-comp-rejected-${rec.id}"`
      - `kind: "borrow_compensation"`
      - `title: "Pengajuan Pelunasan Ditolak: ${rec.borrowCode}"`
      - `body: "Bukti transfer ditolak oleh ${officer}: ${reason}. Silakan ajukan ulang bukti yang sah."`
      - `createdAt: rec.updatedAt || now.toISOString()`
- [ ] **Verification 1:** Run `npm run build:check` to ensure type compatibility.

### Phase 2: Comprehensive Unit Test Suite
- [ ] **Task 2.1:** In `src/lib/productivity/notifications.test.ts`, add tests for ADR-0109:
  - Borrower receives resolution confirmation when `lastSeenNotificationsAt` is null (AC-1).
  - Borrower receives resolution confirmation when `settledAt` is newer than `lastSeenNotificationsAt` (AC-2).
  - Resolution notification is omitted when `lastSeenNotificationsAt >= settledAt` (AC-3).
  - Borrower receives rejection alert with extracted reason and officer when notes contain `[DITOLAK` (AC-4).
  - Non-borrower and managers do not receive resolution or rejection alerts (AC-5).
  - Manager continues to receive verification operational alerts (AC-6).
- [ ] **Verification 2:** Run targeted test:  
  `node --test --import ./test/register-alias.mjs src/lib/productivity/notifications.test.ts`

### Phase 3: Activity Center UI Plumbing
- [ ] **Task 3.1:** In `src/components/layout/NotificationCenter.tsx`:
  - Pass `lastSeenNotificationsAt` into `deriveBorrowCompensationNotifications({ records: borrowRows, currentUserName: ..., userRole: ..., lastSeenNotificationsAt })`.
  - Add `lastSeenNotificationsAt` to the `useMemo` dependency array.
- [ ] **Task 3.2:** Verify `NotificationCenter.tsx` coordinator line count remains $\le 250$ LOC (currently 227 LOC).
- [ ] **Verification 3:** Run `node --test --import ./test/register-alias.mjs src/lib/productivity/useNotificationFeed.test.ts`.

### Phase 4: Non-Negotiable Quality Gates & Handoff
- [ ] **Task 4.1:** Run invariant drift check:
  ```bash
  npm run drift:check
  ```
  Must report `✅ No drift detected. All invariants pass.` with all 136 spec-plan pairs valid.
- [ ] **Task 4.2:** Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Must compile with 0 errors.
- [ ] **Task 4.3:** Run full test suite:
  ```bash
  npm test
  ```
  Must pass 100% of test suites (target 0 failures).
- [ ] **Task 4.4:** Update `docs/SESSION_STATE.md` with ADR-0109 progress.
- [ ] **Task 4.5:** Git commit all documentation artifacts.


