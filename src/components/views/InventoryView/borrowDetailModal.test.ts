import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { canCancelBorrowRecord, getSettlementUiState } from "./borrowDetailModalHelpers";

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
      const permsMatch = content.match(/useMarcomPermissions\(\)/);
      const permsCallIdx = permsMatch ? (permsMatch.index ?? -1) : -1;
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

    it("verifies hybrid staff cash settlement submission and warehouse verification invariants (ADR-0106)", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes("Menunggu Konfirmasi Gudang/Admin"), "Must render pending verification badge");
      assert.ok(content.includes("Kirim Bukti Pelunasan Transfer"), "Must render staff submission trigger button");
      assert.ok(content.includes("Konfirmasi Pelunasan"), "Must render officer confirm button");
      assert.ok(content.includes("Tolak Bukti"), "Must render officer reject button");
      assert.ok(content.includes("Kirim Penolakan"), "Must render reject submission button");
      assert.ok(content.includes("Bukti transfer Anda telah dikirim dan sedang menunggu konfirmasi admin atau petugas gudang."), "Must render staff waiting alert banner");
      assert.ok(content.includes("userRole={role}"), "Must pass role to BorrowSettlementModal");
    });

    it("verifies localized mutation button loaders and concurrency guards (ADR-0107)", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes("isMutating?: boolean;"), "Must define isMutating in BorrowDetailModalProps");
      assert.ok(content.includes('isMutating ? ('), "Must conditionally render loader based on isMutating");
      assert.ok(content.includes('"Approving..."'), "Must render Approving... text when mutating");
      assert.ok(content.includes('"Picking Up..."'), "Must render Picking Up... text when mutating");
      assert.ok(content.includes("disabled={isMutating}"), "Must disable action buttons when isMutating is true");
    });

    it("verifies compensation adjustment button and modal integration (ADR-0108)", () => {
      const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes("CompensationAdjustmentModal"), "Must import CompensationAdjustmentModal");
      assert.ok(content.includes("Adjust Nilai Ganti Rugi"), "Must render Adjust Nilai Ganti Rugi button");
      assert.ok(content.includes("isAdjustModalOpen"), "Must manage isAdjustModalOpen state");
      assert.ok(content.includes("<CompensationAdjustmentModal"), "Must mount CompensationAdjustmentModal");

      // Verify CompensationAdjustmentModal component implementation
      const modalPath = path.resolve(root, "src/components/views/InventoryView/CompensationAdjustmentModal.tsx");
      const modalContent = fs.readFileSync(modalPath, "utf-8");
      assert.ok(modalContent.includes("Penyesuaian Nilai Ganti Rugi"), "Must render adjustment title");
      assert.ok(modalContent.includes("Nominal Tagihan Saat Ini"), "Must render current amount card");
      assert.ok(modalContent.includes("Pembebasan Ganti Rugi (Waiver to Rp 0)"), "Must render waiver notice when newAmount is 0");
      assert.ok(modalContent.includes("reason.trim().length >= 5"), "Must validate minimum 5 characters reason");
      assert.ok(modalContent.includes("/adjust-compensation"), "Must POST to adjust-compensation endpoint");
    });
  });

  describe("getSettlementUiState helper invariants (ADR-0106)", () => {
    it("allows staff owner to submit cash settlement proof when status is PENDING_SETTLEMENT", () => {
      const state = getSettlementUiState({
        compensationStatus: "PENDING_SETTLEMENT",
        borrowerName: "Dewi Sartika",
        sessionUserName: "dewi sartika",
        canManage: false,
      });

      assert.strictEqual(state.isOwner, true);
      assert.strictEqual(state.canStaffSubmit, true);
      assert.strictEqual(state.canDirectSettle, false);
      assert.strictEqual(state.isPendingVerification, false);
      assert.strictEqual(state.canVerify, false);
    });

    it("allows warehouse officer to direct settle when status is PENDING_SETTLEMENT", () => {
      const state = getSettlementUiState({
        compensationStatus: "PENDING_SETTLEMENT",
        borrowerName: "Dewi Sartika",
        sessionUserName: "Warehouse Officer",
        canManage: true,
      });

      assert.strictEqual(state.canDirectSettle, true);
      assert.strictEqual(state.canStaffSubmit, false);
    });

    it("allows warehouse officer to verify or reject when status is PENDING_VERIFICATION", () => {
      const state = getSettlementUiState({
        compensationStatus: "PENDING_VERIFICATION",
        borrowerName: "Dewi Sartika",
        sessionUserName: "Warehouse Officer",
        canManage: true,
      });

      assert.strictEqual(state.isPendingVerification, true);
      assert.strictEqual(state.canVerify, true);
      assert.strictEqual(state.isStaffWaiting, false);
    });

    it("displays waiting advisory for staff borrower when status is PENDING_VERIFICATION", () => {
      const state = getSettlementUiState({
        compensationStatus: "PENDING_VERIFICATION",
        borrowerName: "Dewi Sartika",
        sessionUserName: "Dewi Sartika",
        canManage: false,
      });

      assert.strictEqual(state.isPendingVerification, true);
      assert.strictEqual(state.canVerify, false);
      assert.strictEqual(state.isStaffWaiting, true);
    });
  });
});
