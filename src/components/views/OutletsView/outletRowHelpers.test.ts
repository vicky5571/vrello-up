import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

describe("OutletExpandedRow structural contracts", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletExpandedRow.tsx",
  );

  it("exports OutletExpandedRow component", () => {
    assert.ok(fs.existsSync(filePath), "OutletExpandedRow.tsx must exist");
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("export function OutletExpandedRow"), "Must export OutletExpandedRow");
  });

  it("replaces redundant Status MoU card with Tier & Brand", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("Tier & Brand"), "Must display Tier & Brand card header");
    assert.ok(!content.includes("Status MoU"), "Must not display duplicate Status MoU card");
  });

  it("provides MoUs quick-jump action button with navigateToMarcom", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes('navigateToMarcom("mous", outlet.name)'), "Must trigger MoU navigation");
    assert.ok(content.includes("MoUs ("), "Must display MoU count in button label");
  });
});

describe("OutletsView integration contracts", () => {
  const outletsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsView.tsx",
  );

  it("wires interactive button in MoU Status column", () => {
    const content = fs.readFileSync(outletsViewPath, "utf-8");
    assert.ok(
      content.includes('navigateToMarcom("mous", row.original.name)'),
      "MoU Status table cell must navigate to mous on click",
    );
  });

  it("uses OutletExpandedRow component in renderExpanded", () => {
    const content = fs.readFileSync(outletsViewPath, "utf-8");
    assert.ok(
      content.includes("<OutletExpandedRow"),
      "OutletsView must delegate renderExpanded to OutletExpandedRow",
    );
  });
});
