import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateDraftOutletPayload,
  buildDraftOutletData,
  type RawDraftOutletInput,
} from "@/app/api/marcom/outlets/draft/draftOutletHelpers";

describe("Draft Outlet Submission Helpers", () => {
  const validPayload: RawDraftOutletInput = {
    name: "Toko Sinar Rejeki",
    type: "TRADITIONAL",
    tier: "TIER_1",
    branchId: "branch-smg",
    branchCode: "SMG",
    address: "Jl. Pemuda No. 12",
    city: "Semarang",
    picName: "Budi Santoso",
    picPhone: "081234567890",
    latitude: -6.9932,
    longitude: 110.4203,
    photoUrl: "https://example.com/storefront.jpg",
  };

  describe("validateDraftOutletPayload", () => {
    it("validates a complete and correct draft outlet input", () => {
      const result = validateDraftOutletPayload(validPayload);
      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
    });

    it("requires outlet name", () => {
      const result = validateDraftOutletPayload({ ...validPayload, name: "" });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("name")));
    });

    it("requires branchId", () => {
      const result = validateDraftOutletPayload({ ...validPayload, branchId: "" });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("branchId")));
    });

    it("rejects invalid outlet type", () => {
      const result = validateDraftOutletPayload({
        ...validPayload,
        type: "SUPERMARKET" as any,
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("type")));
    });

    it("validates numeric coordinates safely", () => {
      const invalidLat = validateDraftOutletPayload({
        ...validPayload,
        latitude: "not-a-num" as any,
      });
      assert.equal(invalidLat.isValid, false);
    });
  });

  describe("buildDraftOutletData", () => {
    it("constructs an outlet record with PENDING_APPROVAL status and active=false", () => {
      const data = buildDraftOutletData(validPayload, "sales@jateng.indosat.com");

      assert.equal(data.name, "Toko Sinar Rejeki");
      assert.equal(data.status, "PENDING_APPROVAL");
      assert.equal(data.active, false);
      assert.equal(data.submittedBy, "sales@jateng.indosat.com");
      assert.equal(data.branchId, "branch-smg");
      assert.equal(data.latitude, -6.9932);
      assert.equal(data.longitude, 110.4203);
      assert.equal(data.photoUrl, "https://example.com/storefront.jpg");
      assert.match(data.code, /^DRAFT-SMG-/);
    });

    it("uses custom draft code if explicitly passed", () => {
      const data = buildDraftOutletData(
        { ...validPayload, code: "DRAFT-CUSTOM-001" },
        "user1"
      );
      assert.equal(data.code, "DRAFT-CUSTOM-001");
    });
  });
});
