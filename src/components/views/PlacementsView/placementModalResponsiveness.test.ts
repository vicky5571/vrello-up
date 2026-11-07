import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Placement Modal Viewport Height and Search Expansion (ADR-0076)", () => {
  const modalPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFormModal.tsx"
  );
  const comboboxPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/OutletSearchCombobox.tsx"
  );

  describe("Modal Chassis Height Stabilization Invariants", () => {
    it("verifies PlacementFormModal dialog container uses h-[88dvh] on mobile and sm:h-auto sm:max-h-[92vh] on desktop", () => {
      const content = fs.readFileSync(modalPath, "utf-8");
      assert.ok(
        content.includes("h-[88dvh] sm:h-auto sm:max-h-[92vh]"),
        "Modal dialog container must use h-[88dvh] on mobile and sm:h-auto sm:max-h-[92vh] on desktop"
      );
    });

    it("verifies PlacementFormModal form body uses min-h-0 for internal scrolling without min-h-[340px] distortion", () => {
      const content = fs.readFileSync(modalPath, "utf-8");
      assert.ok(
        content.includes("overflow-y-auto flex-1 min-h-0") ||
          content.includes("flex-1 min-h-0 overflow-y-auto"),
        "Modal form body must use min-h-0 with flex-1 overflow-y-auto"
      );
      assert.ok(
        !content.includes("min-h-[340px]"),
        "Modal form body must eliminate min-h-[340px] hardcoded height"
      );
    });

    it("verifies PlacementFormModal maintains safe coordinator file limits (<= 350 LOC)", () => {
      const content = fs.readFileSync(modalPath, "utf-8");
      const loc = content.split("\n").length;
      assert.ok(
        loc <= 350,
        `PlacementFormModal.tsx has ${loc} LOC, exceeding 350 LOC limit`
      );
    });
  });

  describe("Search Dropdown Results Container Expansion Invariants", () => {
    it("verifies OutletSearchCombobox results list uses max-h-80 on mobile and sm:max-h-72 on desktop", () => {
      const content = fs.readFileSync(comboboxPath, "utf-8");
      assert.ok(
        content.includes("max-h-80 sm:max-h-72"),
        "Results list must expand to max-h-80 on mobile while preserving sm:max-h-72 on desktop"
      );
    });
  });
});
