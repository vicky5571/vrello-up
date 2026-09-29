import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatTierAndBrand, formatOutletCoordinates } from "./outletRowHelpers";

describe("outletRowHelpers", () => {
  describe("formatTierAndBrand", () => {
    it("formats TIER_1 and IM3 correctly", () => {
      const result = formatTierAndBrand("TIER_1", "IM3");
      assert.equal(result, "TIER 1 • IM3");
    });

    it("formats TIER_2 and TRI correctly", () => {
      const result = formatTierAndBrand("TIER_2", "TRI");
      assert.equal(result, "TIER 2 • TRI");
    });

    it("handles missing tier and brand by falling back to defaults", () => {
      const result = formatTierAndBrand(null, null);
      assert.equal(result, "TIER 1 • IM3");
    });

    it("handles undefined inputs gracefully", () => {
      const result = formatTierAndBrand(undefined, undefined);
      assert.equal(result, "TIER 1 • IM3");
    });
  });

  describe("formatOutletCoordinates", () => {
    it("formats numeric latitude and longitude to 5 decimal places", () => {
      const result = formatOutletCoordinates(-6.208763, 106.845599);
      assert.equal(result, "-6.20876, 106.84560");
    });

    it("returns 'Belum disetel' when coordinates are null or undefined", () => {
      assert.equal(formatOutletCoordinates(null, null), "Belum disetel");
      assert.equal(formatOutletCoordinates(undefined, undefined), "Belum disetel");
      assert.equal(formatOutletCoordinates(-6.2, null), "Belum disetel");
    });
  });
});
