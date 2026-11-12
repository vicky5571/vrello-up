import test from "node:test";
import assert from "node:assert/strict";
import {
  countUnread,
  deriveMouNotifications,
  deriveTaskNotifications,
  deriveBorrowOverdueNotifications,
} from "./notifications";
import type { Task } from "@/types";

const NOW = new Date("2026-09-07T12:00:00.000Z");

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    listId: "l1",
    title: "Fix login",
    description: "",
    statusId: "status-todo",
    priority: "high",
    assignees: [{ id: "user-1", name: "Alex", email: "a@x.dev", avatar: "" }],
    tags: [],
    subtasks: [],
    orderIndex: 0,
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

test("derives overdue, assignment, and status-transition notifications", () => {
  const notifs = deriveTaskNotifications(
    [
      task({
        id: "overdue-1",
        title: "Late task",
        dueDate: "2026-09-01",
        activities: [],
      }),
      task({
        id: "moved-1",
        title: "Moved task",
        dueDate: "2026-09-20",
        activities: [
          {
            id: "act-1",
            taskId: "moved-1",
            userId: "user-1",
            userName: "Alex",
            action: "moved task to IN REVIEW",
            createdAt: "2026-09-06T11:00:00.000Z",
          },
        ],
      }),
    ],
    { currentUserId: "user-1", now: NOW },
  );
  const kinds = notifs.map((n) => n.kind).sort();
  assert.ok(kinds.includes("overdue"));
  assert.ok(kinds.includes("assignment"));
  assert.ok(kinds.includes("status"));
});

test("closed statuses suppress overdue and assignment signals", () => {
  const notifs = deriveTaskNotifications(
    [task({ dueDate: "2026-09-01", statusId: "status-done" })],
    { currentUserId: "user-1", doneStatusIds: ["status-done"], now: NOW },
  );
  assert.deepEqual(notifs, []);
});

test("MOU approvals surface only SUBMITTED rows", () => {
  const notifs = deriveMouNotifications([
    { id: "m1", partnerName: "Acme", status: "SUBMITTED" },
    { id: "m2", partnerName: "Globex", status: "APPROVED" },
  ]);
  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].kind, "mou_approval");
  assert.match(notifs[0].title, /Acme/);
});

test("countUnread respects the last-seen timestamp", () => {
  const notifs = deriveMouNotifications([
    { id: "m1", partnerName: "Acme", status: "SUBMITTED" },
  ]);
  assert.equal(countUnread(notifs, null), notifs.length);
  assert.equal(countUnread(notifs, new Date().toISOString()), 0);
});

test("MOU expiry watchdog triggers for expiring (<30d) and expired MOUs", () => {
  const now = new Date("2026-09-19T00:00:00Z");
  const notifs = deriveMouNotifications(
    [
      { id: "m1", partnerName: "Acme", status: "APPROVED", endDate: "2026-09-29T00:00:00Z" },
      { id: "m2", partnerName: "Old Corp", status: "APPROVED", endDate: "2026-08-01T00:00:00Z" },
      { id: "m3", partnerName: "Far Corp", status: "APPROVED", endDate: "2026-12-31T00:00:00Z" },
      { id: "m4", partnerName: "Draft Corp", status: "DRAFT", endDate: "2026-09-25T00:00:00Z" },
    ],
    now,
  );

  assert.equal(notifs.length, 2);
  const expiring = notifs.find((n) => n.id === "mou-exp-m1");
  const expired = notifs.find((n) => n.id === "mou-exp-m2");

  assert.ok(expiring);
  assert.equal(expiring.kind, "mou_expiry");
  assert.match(expiring.title, /Expiring Soon/);

  assert.ok(expired);
  assert.equal(expired.kind, "mou_expiry");
  assert.match(expired.title, /Expired/);
});

test("deriveBorrowOverdueNotifications generates personal overdue alert for borrower (AC-1)", () => {
  const records = [
    {
      id: "rec-1",
      borrowCode: "BRW-20261101-001",
      borrowerName: "Rahmat Hidayat",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "ACTIVE",
      itemsSummary: "Tenda Lipat (2)",
    },
  ];

  const notifs = deriveBorrowOverdueNotifications({
    records,
    currentUserName: "Rahmat Hidayat",
    userRole: "staff",
    now: new Date("2026-11-10T12:00:00.000Z"),
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].id, "borrow-overdue-rec-1");
  assert.equal(notifs[0].kind, "borrow_overdue");
  assert.match(notifs[0].title, /BRW-20261101-001 Telah Jatuh Tempo/);
  assert.match(notifs[0].body || "", /Tenda Lipat \(2\)/);
});

test("deriveBorrowOverdueNotifications isolates alerts between different staff members (AC-2)", () => {
  const records = [
    {
      id: "rec-1",
      borrowCode: "BRW-20261101-001",
      borrowerName: "Rahmat Hidayat",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "ACTIVE",
      itemsSummary: "Tenda Lipat (2)",
    },
  ];

  // Logged-in user is Siti Rahma (role staff) - should not see Rahmat's alert
  const notifs = deriveBorrowOverdueNotifications({
    records,
    currentUserName: "Siti Rahma",
    userRole: "staff",
    now: new Date("2026-11-10T12:00:00.000Z"),
  });

  assert.equal(notifs.length, 0);
});

test("deriveBorrowOverdueNotifications generates single consolidated digest for warehouse officer (AC-3)", () => {
  const records = [
    {
      id: "rec-1",
      borrowCode: "BRW-20261101-001",
      borrowerName: "Rahmat Hidayat",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "ACTIVE",
      itemsSummary: "Tenda Lipat (2)",
    },
    {
      id: "rec-2",
      borrowCode: "BRW-20261102-002",
      borrowerName: "Budi Santoso",
      returnDueDate: "2026-11-06T00:00:00.000Z",
      status: "ACTIVE",
      itemsSummary: "Sound System (1)",
    },
    {
      id: "rec-3",
      borrowCode: "BRW-20261103-003",
      borrowerName: "Dewi Lestari",
      returnDueDate: "2026-11-07T00:00:00.000Z",
      status: "ACTIVE",
      itemsSummary: "Rollup Banner (3)",
    },
  ];

  const notifs = deriveBorrowOverdueNotifications({
    records,
    currentUserName: "Agus Gudang",
    userRole: "warehouse",
    now: new Date("2026-11-10T12:00:00.000Z"),
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].kind, "borrow_overdue");
  assert.match(notifs[0].title, /Perhatian: 3 Peminjaman Alat Melewati Batas Pengembalian/);
  assert.match(notifs[0].body || "", /Terdapat 3 unit peminjaman aktif/);
});

test("deriveBorrowOverdueNotifications returns empty array when all returns are on time", () => {
  const records = [
    {
      id: "rec-1",
      borrowCode: "BRW-20261101-001",
      borrowerName: "Rahmat Hidayat",
      returnDueDate: "2026-11-15T00:00:00.000Z", // Future date
      status: "ACTIVE",
      itemsSummary: "Tenda Lipat (2)",
    },
  ];

  const notifs = deriveBorrowOverdueNotifications({
    records,
    currentUserName: "Rahmat Hidayat",
    userRole: "staff",
    now: new Date("2026-11-10T12:00:00.000Z"),
  });

  assert.equal(notifs.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADR-0106 — deriveBorrowCompensationNotifications
// ─────────────────────────────────────────────────────────────────────────────
import {
  deriveBorrowCompensationNotifications,
  extractLatestRejectionReason,
} from "./notifications";

test("deriveBorrowCompensationNotifications: borrower receives PENDING_SETTLEMENT alert when amount > 0 (AC-5a)", () => {
  const records = [
    {
      id: "comp-1",
      borrowCode: "BRW-20261101-010",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_SETTLEMENT",
      compensationAmount: 500000,
      updatedAt: "2026-11-06T10:00:00.000Z",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].kind, "borrow_compensation");
  assert.ok(notifs[0].title.includes("BRW-20261101-010"));
  assert.ok(notifs[0].body!.includes("500.000"));
});

test("deriveBorrowCompensationNotifications: borrower does NOT receive alert when compensationStatus is NONE (AC-5b)", () => {
  const records = [
    {
      id: "comp-2",
      borrowCode: "BRW-20261101-011",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "NONE",
      compensationAmount: 0,
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
  });

  assert.equal(notifs.length, 0);
});

test("deriveBorrowCompensationNotifications: borrower does NOT receive alert when compensationStatus is RESOLVED and already seen (AC-5c & ADR-0109)", () => {
  const records = [
    {
      id: "comp-3",
      borrowCode: "BRW-20261101-012",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "RESOLVED",
      compensationAmount: 500000,
      settledAt: "2026-11-07T10:00:00.000Z",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
    lastSeenNotificationsAt: "2026-11-07T11:00:00.000Z",
  });

  assert.equal(notifs.length, 0);
});

test("deriveBorrowCompensationNotifications: manager receives PENDING_VERIFICATION operational alert (AC-5d)", () => {
  const records = [
    {
      id: "comp-4",
      borrowCode: "BRW-20261101-013",
      borrowerName: "Budi Santoso",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_VERIFICATION",
      compensationAmount: 750000,
      updatedAt: "2026-11-07T08:00:00.000Z",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Warehouse Manager",
    userRole: "warehouse",
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].id, "borrow-verify-comp-4");
  assert.ok(notifs[0].title.includes("BRW-20261101-013"));
  assert.ok(notifs[0].body!.includes("Budi Santoso"));
  assert.ok(notifs[0].body!.includes("750.000"));
});

test("deriveBorrowCompensationNotifications: staff non-borrower does NOT receive verification alert (AC-5e)", () => {
  const records = [
    {
      id: "comp-5",
      borrowCode: "BRW-20261101-014",
      borrowerName: "Budi Santoso",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_VERIFICATION",
      compensationAmount: 750000,
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Other Staff",
    userRole: "staff",
  });

  // Other staff: not borrower (no personal alert), not manager (no operational alert)
  assert.equal(notifs.length, 0);
});

test("deriveBorrowCompensationNotifications: PENDING_VERIFICATION emits both borrower and manager alerts (AC-5f)", () => {
  const records = [
    {
      id: "comp-6",
      borrowCode: "BRW-20261101-015",
      borrowerName: "Clara Dewi",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_VERIFICATION",
      compensationAmount: 300000,
      updatedAt: "2026-11-08T10:00:00.000Z",
    },
  ];

  // Test from admin perspective (is also the borrower — unlikely but test both roles)
  const notifsAdmin = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Admin User",
    userRole: "admin",
  });
  // Admin is not the borrower, only gets operational alert
  assert.equal(notifsAdmin.length, 1);
  assert.equal(notifsAdmin[0].id, "borrow-verify-comp-6");

  // Test from borrower's perspective
  const notifsBorrower = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Clara Dewi",
    userRole: "staff",
  });
  // Borrower gets personal "sent" reminder
  assert.equal(notifsBorrower.length, 1);
  assert.equal(notifsBorrower[0].id, "borrow-comp-sent-comp-6");
});

test("deriveBorrowCompensationNotifications: multiple records produce correct notification count (AC-5g)", () => {
  const records = [
    {
      id: "multi-1",
      borrowCode: "BRW-001",
      borrowerName: "Staff A",
      returnDueDate: "2026-11-01T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_SETTLEMENT",
      compensationAmount: 100000,
    },
    {
      id: "multi-2",
      borrowCode: "BRW-002",
      borrowerName: "Staff B",
      returnDueDate: "2026-11-01T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_VERIFICATION",
      compensationAmount: 200000,
    },
    {
      id: "multi-3",
      borrowCode: "BRW-003",
      borrowerName: "Staff C",
      returnDueDate: "2026-11-01T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "NONE",
      compensationAmount: 0,
    },
  ];

  // As warehouse manager: should get 1 operational alert (multi-2 PENDING_VERIFICATION)
  const notifsManager = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Warehouse Manager",
    userRole: "warehouse",
  });
  assert.equal(notifsManager.length, 1);
  assert.equal(notifsManager[0].id, "borrow-verify-multi-2");
});

// ─────────────────────────────────────────────────────────────────────────────
// ADR-0109 — Borrower Compensation Settlement & Rejection Feedback Notifications
// ─────────────────────────────────────────────────────────────────────────────

test("extractLatestRejectionReason extracts officer and reason correctly", () => {
  // Empty or non-rejection notes
  assert.deepEqual(extractLatestRejectionReason(""), {
    reason: "Bukti transfer ditolak oleh petugas.",
  });
  assert.deepEqual(extractLatestRejectionReason("Transfer pelunasan via BCA"), {
    reason: "Bukti transfer ditolak oleh petugas.",
  });

  // Single rejection note
  const singleNote = "[DITOLAK Budi Santoso - 12/11/2026]: Bukti transfer buram, mutasi belum masuk";
  const res1 = extractLatestRejectionReason(singleNote);
  assert.equal(res1.officer, "Budi Santoso");
  assert.equal(res1.reason, "Bukti transfer buram, mutasi belum masuk");

  // Multiple sequential rejection notes (extracts latest)
  const multiNotes = `Transfer pertama\n\n[DITOLAK Budi - 10/11/2026]: Bukti buram\n\nTransfer kedua\n\n[DITOLAK Warehouse Lead - 12/11/2026]: Nominal tidak sesuai tagihan`;
  const res2 = extractLatestRejectionReason(multiNotes);
  assert.equal(res2.officer, "Warehouse Lead");
  assert.equal(res2.reason, "Nominal tidak sesuai tagihan");
});

test("deriveBorrowCompensationNotifications: borrower receives resolution confirmation when lastSeenNotificationsAt is null (AC-1 & AC-2)", () => {
  const records = [
    {
      id: "res-1",
      borrowCode: "BRW-20261101-099",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "RESOLVED",
      compensationAmount: 500000,
      settledAmount: 500000,
      settledAt: "2026-11-08T12:00:00.000Z",
      settledBy: "Supervisor Budi",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
    lastSeenNotificationsAt: null, // First time opening
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].id, "borrow-comp-resolved-res-1");
  assert.equal(notifs[0].kind, "borrow_compensation");
  assert.equal(notifs[0].title, "Pelunasan Ganti Rugi Disetujui: BRW-20261101-099");
  assert.ok(notifs[0].body!.includes("Rp 500.000"));
  assert.ok(notifs[0].body!.includes("Supervisor Budi"));
  assert.ok(notifs[0].body!.includes("Kewajiban Anda telah selesai"));
});

test("deriveBorrowCompensationNotifications: borrower receives resolution confirmation when settledAt > lastSeenNotificationsAt (AC-2)", () => {
  const records = [
    {
      id: "res-2",
      borrowCode: "BRW-20261101-100",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "RESOLVED",
      compensationAmount: 250000,
      settledAmount: 250000,
      settledAt: "2026-11-10T14:00:00.000Z",
      settledBy: "Admin Clara",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
    lastSeenNotificationsAt: "2026-11-10T10:00:00.000Z", // User last viewed 4 hours before approval
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].id, "borrow-comp-resolved-res-2");
  assert.equal(notifs[0].title, "Pelunasan Ganti Rugi Disetujui: BRW-20261101-100");
  assert.ok(notifs[0].body!.includes("Admin Clara"));
});

test("deriveBorrowCompensationNotifications: resolution notification is dismissed when lastSeenNotificationsAt >= settledAt (AC-3)", () => {
  const records = [
    {
      id: "res-3",
      borrowCode: "BRW-20261101-101",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "RESOLVED",
      compensationAmount: 250000,
      settledAmount: 250000,
      settledAt: "2026-11-10T14:00:00.000Z",
      settledBy: "Admin Clara",
    },
  ];

  // User clicked "Mark all read" at 15:00, after 14:00 settlement
  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
    lastSeenNotificationsAt: "2026-11-10T15:00:00.000Z",
  });

  // Omitted from active feed to prevent clutter
  assert.equal(notifs.length, 0);
});

test("deriveBorrowCompensationNotifications: borrower receives rejection alert with parsed officer and reason (AC-4)", () => {
  const records = [
    {
      id: "rej-1",
      borrowCode: "BRW-20261101-102",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_SETTLEMENT",
      compensationAmount: 400000,
      settlementNotes: "Transfer BCA\n\n[DITOLAK Budi Santoso - 12/11/2026]: Bukti transfer buram, mutasi rekening belum masuk",
      updatedAt: "2026-11-12T09:00:00.000Z",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Alice Smith",
    userRole: "staff",
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].id, "borrow-comp-rejected-rej-1");
  assert.equal(notifs[0].kind, "borrow_compensation");
  assert.equal(notifs[0].title, "Pengajuan Pelunasan Ditolak: BRW-20261101-102");
  assert.ok(notifs[0].body!.includes("Budi Santoso"));
  assert.ok(notifs[0].body!.includes("Bukti transfer buram, mutasi rekening belum masuk"));
  assert.ok(notifs[0].body!.includes("Silakan ajukan ulang bukti yang sah"));
});

test("deriveBorrowCompensationNotifications: non-borrowers and managers do NOT receive resolution or rejection alerts (AC-5)", () => {
  const records = [
    {
      id: "res-4",
      borrowCode: "BRW-20261101-103",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "RESOLVED",
      compensationAmount: 500000,
      settledAt: "2026-11-12T10:00:00.000Z",
      settledBy: "Warehouse Lead",
    },
    {
      id: "rej-2",
      borrowCode: "BRW-20261101-104",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_SETTLEMENT",
      compensationAmount: 500000,
      settlementNotes: "[DITOLAK Warehouse Lead - 12/11/2026]: Foto tidak jelas",
    },
  ];

  // 1. Other staff: should get 0 notifications
  const notifsOtherStaff = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Dewi Sartika",
    userRole: "staff",
  });
  assert.equal(notifsOtherStaff.length, 0);

  // 2. Warehouse Manager: should get 0 notifications (not pending verification)
  const notifsWarehouse = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Warehouse Lead",
    userRole: "warehouse",
  });
  assert.equal(notifsWarehouse.length, 0);

  // 3. Admin: should get 0 notifications
  const notifsAdmin = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Super Admin",
    userRole: "admin",
  });
  assert.equal(notifsAdmin.length, 0);
});

test("deriveBorrowCompensationNotifications: manager continues to receive verification operational alerts (AC-6)", () => {
  const records = [
    {
      id: "verif-1",
      borrowCode: "BRW-20261101-105",
      borrowerName: "Alice Smith",
      returnDueDate: "2026-11-05T00:00:00.000Z",
      status: "RETURNED",
      compensationStatus: "PENDING_VERIFICATION",
      compensationAmount: 600000,
      updatedAt: "2026-11-12T11:00:00.000Z",
    },
  ];

  const notifs = deriveBorrowCompensationNotifications({
    records,
    currentUserName: "Warehouse Lead",
    userRole: "warehouse",
  });

  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].id, "borrow-verify-verif-1");
  assert.equal(notifs[0].title, "Verifikasi Pelunasan: BRW-20261101-105");
  assert.ok(notifs[0].body!.includes("Alice Smith"));
  assert.ok(notifs[0].body!.includes("600.000"));
});
