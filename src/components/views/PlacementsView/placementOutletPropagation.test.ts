import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { OutletSearchResult } from "@/components/views/PlacementsView/outletSearchComboboxHelpers";

// Pure coalescing logic matching PlacementFormModal.tsx
function coalesceSelectedOutlet(
  selOutlet?: {
    id: string;
    name: string;
    code?: string;
    brand?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  },
  placementOutlet?: {
    id: string;
    name: string;
    code?: string;
    brand?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  }
): OutletSearchResult | undefined {
  if (!selOutlet && !placementOutlet) return undefined;

  const lat = placementOutlet?.latitude ?? selOutlet?.latitude ?? null;
  const lng = placementOutlet?.longitude ?? selOutlet?.longitude ?? null;

  return {
    id: placementOutlet?.id || selOutlet?.id || "",
    name: placementOutlet?.name || selOutlet?.name || "",
    code: placementOutlet?.code || selOutlet?.code || "",
    brand: placementOutlet?.brand || selOutlet?.brand || "IM3",
    address: placementOutlet?.address || selOutlet?.address || "",
    latitude: lat !== undefined ? lat : null,
    longitude: lng !== undefined ? lng : null,
  };
}

describe("Placement Form Selected Outlet GPS and Address Data Propagation (ADR-0074)", () => {
  const placementsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementsView.tsx"
  );
  const placementModalPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFormModal.tsx"
  );

  describe("File Content & Invariants", () => {
    it("verifies PlacementsView preserves full outlet fields (latitude, longitude, address, code, city, picPhone) in outletsList", () => {
      const content = fs.readFileSync(placementsViewPath, "utf-8");
      assert.ok(
        content.includes("latitude: o.latitude") &&
          content.includes("longitude: o.longitude") &&
          content.includes("address: o.address") &&
          content.includes("code: o.code"),
        "PlacementsView must project latitude, longitude, address, and code into outletsList"
      );
    });

    it("verifies PlacementsView.tsx does not exceed 250 LOC coordinator limit", () => {
      const content = fs.readFileSync(placementsViewPath, "utf-8");
      const loc = content.split("\n").length;
      assert.ok(
        loc <= 250,
        `PlacementsView.tsx has ${loc} LOC, exceeding 250 LOC coordinator limit`
      );
    });

    it("verifies PlacementFormModal implements fail-safe coordinate coalescing", () => {
      const content = fs.readFileSync(placementModalPath, "utf-8");
      assert.ok(
        content.includes("pOutlet?.latitude ?? selOutlet?.latitude ?? null") &&
          content.includes("pOutlet?.longitude ?? selOutlet?.longitude ?? null"),
        "PlacementFormModal must coalesce latitude and longitude from pOutlet and selOutlet"
      );
    });

    it("verifies PlacementFormModal.tsx maintains safe file limits (<= 350 LOC)", () => {
      const content = fs.readFileSync(placementModalPath, "utf-8");
      const loc = content.split("\n").length;
      assert.ok(
        loc <= 350,
        `PlacementFormModal.tsx has ${loc} LOC, exceeding 350 LOC limit`
      );
    });
  });

  describe("Coalescing Behavior Scenarios", () => {
    it("Scenario 1 (Fresh Selection): preserves GPS coordinates and address when present on placement.outlet", () => {
      const placementOutlet = {
        id: "out-001",
        name: "Cellular World Denpasar",
        code: "OUT-DPS-001",
        brand: "IM3",
        address: "Jl. Teuku Umar No. 60, Denpasar",
        latitude: -8.6754,
        longitude: 115.2154,
      };

      // Even if selOutlet in list has no coordinates (legacy / stripped state)
      const selOutletStripped = {
        id: "out-001",
        name: "Cellular World Denpasar",
        brand: "IM3",
      };

      const result = coalesceSelectedOutlet(selOutletStripped, placementOutlet);

      assert.ok(result);
      assert.equal(result.id, "out-001");
      assert.equal(result.latitude, -8.6754);
      assert.equal(result.longitude, 115.2154);
      assert.equal(result.address, "Jl. Teuku Umar No. 60, Denpasar");
      assert.equal(result.code, "OUT-DPS-001");
    });

    it("Scenario 2 (Edit Mode): resolves GPS coordinates and address from selOutlet when placement.outlet is absent or partial", () => {
      const selOutletFromList = {
        id: "out-002",
        name: "Mitra Sejati Kuta",
        code: "OUT-DPS-002",
        brand: "TRI",
        address: "Jl. Raya Kuta No. 88, Badung",
        latitude: -8.7231,
        longitude: 115.1765,
      };

      // In edit mode with only ID or minimal placement.outlet
      const result = coalesceSelectedOutlet(selOutletFromList, undefined);

      assert.ok(result);
      assert.equal(result.id, "out-002");
      assert.equal(result.latitude, -8.7231);
      assert.equal(result.longitude, 115.1765);
      assert.equal(result.address, "Jl. Raya Kuta No. 88, Badung");
      assert.equal(result.code, "OUT-DPS-002");
      assert.equal(result.brand, "TRI");
    });

    it("Scenario 3 (Legitimate Null Coordinates): preserves null when an outlet genuinely lacks coordinates", () => {
      const outletWithoutGps = {
        id: "out-003",
        name: "Toko Baru Sanur",
        code: "OUT-DPS-003",
        brand: "IM3",
        address: "Jl. Danau Tamblingan No. 12",
        latitude: null,
        longitude: null,
      };

      const result = coalesceSelectedOutlet(outletWithoutGps, outletWithoutGps);

      assert.ok(result);
      assert.strictEqual(result.latitude, null);
      assert.strictEqual(result.longitude, null);
      assert.equal(result.address, "Jl. Danau Tamblingan No. 12");
    });

    it("Scenario 4 (Unselected State): returns undefined when neither source exists", () => {
      const result = coalesceSelectedOutlet(undefined, undefined);
      assert.strictEqual(result, undefined);
    });
  });
});
