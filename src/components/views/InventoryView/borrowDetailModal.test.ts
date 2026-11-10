import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { canCancelBorrowRecord } from "./borrowDetailModalHelpers";

describe("BorrowDetailModal Staff Self-Cancellation & RBAC Invariants (ADR-0101)", () => {
  const root = process.cwd();

  describe("canCancelBorrowRecord permission logic", () => {
    it("allows staff owner to cancel own PENDING request (AC-1)", () => {
      const decision = canCancelBorrowRecord({
        status: "PENDING",
        borrowerName: "Siti Rahma",
        sessionUserName: "Siti Rahma",
        canManage: false,
        canCancelOwn: true,
      });

      assert.strictEqual(decision.canCancelPending, true);
      assert.strictEqual(decision.canCancelLoan, false);
    });

    it("handles case-insensitive and trimmed borrower names cleanly", () => {
      const decision = canCancelBorrowRecord({
        status: "PENDING",
        borrowerName: "  Siti Rahma  ",
        sessionUserName: "siti rahma",
        canManage: false,
        canCancelOwn: true,
      });

      assert.strictEqual(decision.canCancelPending, true);
    });

    it("prevents staff from cancelling other staff's PENDING request (AC-2)", () => {
      const decision = canCancelBorrowRecord({
        status: "PENDING",
        borrowerName: "Siti Rahma",
        sessionUserName: "Budi Santoso",
        canManage: false,
        canCancelOwn: true,
      });

      assert.strictEqual(decision.canCancelPending, false);
      assert.strictEqual(decision.canCancelLoan, false);
    });

    it("prevents staff from cancelling an APPROVED loan even if they are the borrower (AC-3)", () => {
      const decision = canCancelBorrowRecord({
        status: "APPROVED",
        borrowerName: "Siti Rahma",
        sessionUserName: "Siti Rahma",
        canManage: false,
        canCancelOwn: true,
      });

      assert.strictEqual(decision.canCancelPending, false);
      assert.strictEqual(decision.canCancelLoan, false);
    });

    it("allows logistics manager (canManage: true) to cancel any PENDING request regardless of owner (AC-4)", () => {
      const decision = canCancelBorrowRecord({
        status: "PENDING",
        borrowerName: "Siti Rahma",
        sessionUserName: "Warehouse Lead",
        canManage: true,
        canCancelOwn: true,
      });

      assert.strictEqual(decision.canCancelPending, true);
      assert.strictEqual(decision.canCancelLoan, false);
    });

    it("allows logistics manager (canManage: true) to cancel any APPROVED loan (AC-4)", () => {
      const decision = canCancelBorrowRecord({
        status: "APPROVED",
        borrowerName: "Siti Rahma",
        sessionUserName: "Warehouse Lead",
        canManage: true,
        canCancelOwn: true,
      });

      assert.strictEqual(decision.canCancelPending, false);
      assert.strictEqual(decision.canCancelLoan, true);
    });

    it("prevents viewer from cancelling any request (AC-5)", () => {
      const decisionPending = canCancelBorrowRecord({
        status: "PENDING",
        borrowerName: "Viewer User",
        sessionUserName: "Viewer User",
        canManage: false,
        canCancelOwn: false,
      });
      assert.strictEqual(decisionPending.canCancelPending, false);
      assert.strictEqual(decisionPending.canCancelLoan, false);

      const decisionApproved = canCancelBorrowRecord({
        status: "APPROVED",
        borrowerName: "Viewer User",
        sessionUserName: "Viewer User",
        canManage: false,
        canCancelOwn: false,
      });
      assert.strictEqual(decisionApproved.canCancelPending, false);
      assert.strictEqual(decisionApproved.canCancelLoan, false);
    });
  });

  describe("BorrowDetailModal.tsx component code invariants", () => {
    it("imports useSession and useMarcomPermissions", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes('import { useSession } from "next-auth/react";'), "Must import useSession");
      assert.ok(content.includes('import { useMarcomPermissions } from "@/lib/marcom/permissions";'), "Must import useMarcomPermissions");
    });

    it("calls all React hooks before early return (Rules of Hooks invariant)", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      const sessionCallIdx = content.indexOf("const { data: session } = useSession();");
      const permsCallIdx = content.indexOf("const { can } = useMarcomPermissions();");
      const earlyReturnIdx = content.indexOf("if (!isOpen || !record) return null;");

      assert.ok(sessionCallIdx !== -1, "useSession must be called");
      assert.ok(permsCallIdx !== -1, "useMarcomPermissions must be called");
      assert.ok(earlyReturnIdx !== -1, "early return guard must exist");

      assert.ok(sessionCallIdx < earlyReturnIdx, "useSession must be called before early return");
      assert.ok(permsCallIdx < earlyReturnIdx, "useMarcomPermissions must be called before early return");
    });

    it("evaluates CANCEL_OWN_BORROW permission and guards PENDING status cancellation", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes('can("CANCEL_OWN_BORROW")'), "Must evaluate CANCEL_OWN_BORROW");
      assert.ok(content.includes('record.status === "PENDING" && canCancelPending'), "Cancel Request must be guarded by canCancelPending");
      assert.ok(content.includes('record.status === "APPROVED" && canManage'), "Cancel Loan must remain guarded exclusively by canManage");
    });

    it("verifies tight-schedule advisory, deficit warning, and unclaimed booking banner invariants (ADR-0102)", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes("isTightSchedule"), "Must check isTightSchedule");
      assert.ok(content.includes("isUnclaimed"), "Must check isUnclaimed");
      assert.ok(content.includes("hasDeficitWarning"), "Must check hasDeficitWarning");
      assert.ok(content.includes("Peringatan Defisit Unit:"), "Must render deficit warning callout");
      assert.ok(content.includes("Jadwal Mepet:"), "Must render tight-schedule advisory callout");
      assert.ok(content.includes("Unclaimed Booking:"), "Must render unclaimed booking suggestion badge");
    });
  });
});
