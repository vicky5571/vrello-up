import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateDraftForm,
  formatCoordinatesPreview,
  buildDraftSubmissionPayload,
  type DraftFormData,
} from "@/components/views/OutletsView/submitDraftOutletHelpers";

describe("Submit Draft Outlet Modal Helpers", () => {
  const sampleForm: DraftFormData = {
    name: "Kios Berkah Baru",
    type: "TRADITIONAL",
    tier: "TIER_1",
    branchId: "branch-smg",
    address: "Jl. Pandanaran No. 45",
    city: "Semarang",
    picName: "Mas Joko",
    picPhone: "081987654321",
    latitude: -6.9854,
    longitude: 110.4187,
    photoUrl: "https://example.com/foto-toko.jpg",
  };

  describe("validateDraftForm", () => {
    it("validates a complete valid draft form with 0 errors", () => {
      const result = validateDraftForm(sampleForm);
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });

    it("requires outlet name", () => {
      const result = validateDraftForm({ ...sampleForm, name: "   " });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.name);
    });

    it("requires branch selection", () => {
      const result = validateDraftForm({ ...sampleForm, branchId: "" });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.branchId);
    });

    it("requires photo URL or image evidence for physical storefront verification", () => {
      const result = validateDraftForm({ ...sampleForm, photoUrl: "" });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.photoUrl);
    });

    it("requires GPS coordinates to verify physical store location", () => {
      const result = validateDraftForm({ ...sampleForm, latitude: null, longitude: null });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.coordinates);
    });
  });

  describe("formatCoordinatesPreview", () => {
    it("formats lat and lng to 5 decimal places with symbol", () => {
      const formatted = formatCoordinatesPreview(-6.9854123, 110.4187456);
      assert.equal(formatted, "-6.98541, 110.41875");
    });

    it("returns Belum Terdeteksi when coordinates are absent", () => {
      assert.equal(formatCoordinatesPreview(null, null), "Belum Terdeteksi");
      assert.equal(formatCoordinatesPreview(undefined, undefined), "Belum Terdeteksi");
    });
  });

  describe("buildDraftSubmissionPayload", () => {
    it("trims fields and formats payload for POST /api/marcom/outlets/draft", () => {
      const payload = buildDraftSubmissionPayload({
        ...sampleForm,
        name: "  Kios Berkah Baru  ",
        address: "  Jl. Pandanaran No. 45  ",
      });

      assert.equal(payload.name, "Kios Berkah Baru");
      assert.equal(payload.address, "Jl. Pandanaran No. 45");
      assert.equal(payload.branchId, "branch-smg");
      assert.equal(payload.latitude, -6.9854);
      assert.equal(payload.longitude, 110.4187);
      assert.equal(payload.photoUrl, "https://example.com/foto-toko.jpg");
    });
  });
});
