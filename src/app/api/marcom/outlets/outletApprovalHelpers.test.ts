import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateApprovalActionPayload,
  buildApprovalTransitionData,
} from "@/app/api/marcom/outlets/outletApprovalHelpers";

describe("Outlet Approval Transition Helpers", () => {
  describe("validateApprovalActionPayload", () => {
    it("validates an APPROVE payload with optional official code", () => {
      const valid = validateApprovalActionPayload({ action: "APPROVE", code: "O-SMG-0842" });
      assert.equal(valid.isValid, true);
      assert.equal(valid.errors.length, 0);
    });

    it("validates a REJECT payload with required rejectionReason", () => {
      const valid = validateApprovalActionPayload({
        action: "REJECT",
        rejectionReason: "Toko duplikat dengan O-SMG-012",
      });
      assert.equal(valid.isValid, true);
    });

    it("rejects when action is missing or unrecognized", () => {
      const invalidAction = validateApprovalActionPayload({ action: "CANCEL" as any });
      assert.equal(invalidAction.isValid, false);
      assert.ok(invalidAction.errors.some((e) => e.includes("action")));
    });

    it("rejects REJECT action without rejectionReason", () => {
      const missingReason = validateApprovalActionPayload({ action: "REJECT" });
      assert.equal(missingReason.isValid, false);
      assert.ok(missingReason.errors.some((e) => e.includes("rejectionReason")));
    });
  });

  describe("buildApprovalTransitionData", () => {
    it("builds APPROVED payload for a PENDING_APPROVAL outlet", () => {
      const result = buildApprovalTransitionData({
        action: "APPROVE",
        currentStatus: "PENDING_APPROVAL",
        newCode: "O-SMG-0999",
        approverName: "manager@jateng.indosat.com",
      });

      assert.equal(result.data.status, "APPROVED");
      assert.equal(result.data.active, true);
      assert.equal(result.data.code, "O-SMG-0999");
      assert.equal(result.data.approvedBy, "manager@jateng.indosat.com");
      assert.ok(result.data.approvedAt instanceof Date);
    });

    it("builds REJECTED payload for a PENDING_APPROVAL outlet", () => {
      const result = buildApprovalTransitionData({
        action: "REJECT",
        currentStatus: "PENDING_APPROVAL",
        rejectionReason: "Foto buram dan tidak terbaca",
        approverName: "manager@jateng.indosat.com",
      });

      assert.equal(result.data.status, "REJECTED");
      assert.equal(result.data.active, false);
      assert.equal(result.data.rejectionReason, "Foto buram dan tidak terbaca");
    });

    it("throws error if transition is invalid in state machine", () => {
      assert.throws(
        () =>
          buildApprovalTransitionData({
            action: "APPROVE",
            currentStatus: "APPROVED",
            approverName: "manager@jateng.indosat.com",
          }),
        /Cannot transition/
      );
    });
  });
});
