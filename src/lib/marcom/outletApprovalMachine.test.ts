import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionOutletStatus,
  isPendingApproval,
  isApproved,
  OUTLET_STATUSES,
} from "@/lib/marcom/outletApprovalMachine";
import type { OutletStatus } from "@/types";

describe("Outlet Approval Machine - Pure State Transitions", () => {
  it("exposes all 4 valid outlet statuses", () => {
    assert.deepEqual(OUTLET_STATUSES, [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
    ]);
  });

  describe("canTransitionOutletStatus", () => {
    it("allows DRAFT to transition to PENDING_APPROVAL", () => {
      assert.equal(canTransitionOutletStatus("DRAFT", "PENDING_APPROVAL"), true);
    });

    it("prevents DRAFT from directly transitioning to APPROVED or REJECTED", () => {
      assert.equal(canTransitionOutletStatus("DRAFT", "APPROVED"), false);
      assert.equal(canTransitionOutletStatus("DRAFT", "REJECTED"), false);
      assert.equal(canTransitionOutletStatus("DRAFT", "DRAFT"), false);
    });

    it("allows PENDING_APPROVAL to transition to APPROVED, REJECTED, or retract to DRAFT", () => {
      assert.equal(canTransitionOutletStatus("PENDING_APPROVAL", "APPROVED"), true);
      assert.equal(canTransitionOutletStatus("PENDING_APPROVAL", "REJECTED"), true);
      assert.equal(canTransitionOutletStatus("PENDING_APPROVAL", "DRAFT"), true);
    });

    it("allows REJECTED to transition back to DRAFT or directly resubmit to PENDING_APPROVAL", () => {
      assert.equal(canTransitionOutletStatus("REJECTED", "DRAFT"), true);
      assert.equal(canTransitionOutletStatus("REJECTED", "PENDING_APPROVAL"), true);
      assert.equal(canTransitionOutletStatus("REJECTED", "APPROVED"), false);
    });

    it("treats APPROVED as terminal (cannot transition to any other status)", () => {
      for (const target of OUTLET_STATUSES) {
        assert.equal(
          canTransitionOutletStatus("APPROVED", target),
          false,
          `APPROVED should not transition to ${target}`
        );
      }
    });

    it("rejects unknown or invalid status inputs gracefully", () => {
      assert.equal(
        canTransitionOutletStatus("UNKNOWN" as OutletStatus, "APPROVED"),
        false
      );
      assert.equal(
        canTransitionOutletStatus("DRAFT", "UNKNOWN" as OutletStatus),
        false
      );
    });
  });

  describe("Helper predicates", () => {
    it("isPendingApproval returns true only for PENDING_APPROVAL", () => {
      assert.equal(isPendingApproval("PENDING_APPROVAL"), true);
      assert.equal(isPendingApproval("DRAFT"), false);
      assert.equal(isPendingApproval("APPROVED"), false);
      assert.equal(isPendingApproval("REJECTED"), false);
      assert.equal(isPendingApproval(undefined), false);
    });

    it("isApproved returns true only for APPROVED", () => {
      assert.equal(isApproved("APPROVED"), true);
      assert.equal(isApproved("PENDING_APPROVAL"), false);
      assert.equal(isApproved("DRAFT"), false);
      assert.equal(isApproved(undefined), false);
    });
  });
});
