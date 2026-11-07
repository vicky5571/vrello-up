import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { WIZARD_STEPS } from "./wizard/placementWizardHelpers";

describe("Mobile Wizard Stepper Header Dynamic Accordion Expansion (ADR-0077)", () => {
  const stepperPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx"
  );

  describe("Responsive Layout & Accordion Invariants", () => {
    it("verifies container switches from mobile flex accordion to desktop 4-column grid", () => {
      const content = fs.readFileSync(stepperPath, "utf-8");
      assert.ok(
        content.includes("flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2"),
        "Stepper track must use 'flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2'"
      );
    });

    it("verifies active step expands dynamically (flex-1 min-w-0) on mobile viewports", () => {
      const content = fs.readFileSync(stepperPath, "utf-8");
      assert.ok(
        content.includes("flex-1 min-w-0") && content.includes("px-2.5"),
        "Active step must expand with flex-1 min-w-0 and comfortable horizontal padding"
      );
    });

    it("verifies inactive steps shrink (shrink-0) into compact icon badges on mobile", () => {
      const content = fs.readFileSync(stepperPath, "utf-8");
      assert.ok(
        content.includes("shrink-0 px-2 sm:px-2.5 justify-center sm:justify-start"),
        "Inactive steps must use shrink-0 px-2 sm:px-2.5 justify-center sm:justify-start"
      );
    });

    it("verifies unified shortLabel is used and redundant Langkah subtitle is eliminated across all viewports", () => {
      const content = fs.readFileSync(stepperPath, "utf-8");
      assert.ok(
        content.includes("{s.shortLabel}"),
        "Stepper must use concise s.shortLabel across all viewports"
      );
      assert.ok(
        !content.includes("{s.label}"),
        "Stepper must eliminate long s.label to prevent mobile text truncation"
      );
      assert.ok(
        !content.includes("Langkah"),
        "Stepper must eliminate redundant 'Langkah {s.step}' subtitle across all viewports"
      );
      assert.ok(
        content.includes("isCurrent") &&
          content.includes('"inline text-lime-900') &&
          content.includes('"hidden sm:inline"'),
        "Stepper must display label on mobile active step and on all desktop steps"
      );
    });

    it("verifies WizardStepperHeader maintains strict file limit (<= 150 LOC)", () => {
      const content = fs.readFileSync(stepperPath, "utf-8");
      const loc = content.split("\n").length;
      assert.ok(
        loc <= 150,
        `WizardStepperHeader.tsx has ${loc} LOC, exceeding 150 LOC budget`
      );
    });
  });

  describe("Wizard Step Definition & Integrity", () => {
    it("verifies 4 distinct wizard steps exist with valid labels and step numbers", () => {
      assert.equal(WIZARD_STEPS.length, 4);
      assert.deepEqual(
        WIZARD_STEPS.map((s) => s.step),
        [1, 2, 3, 4]
      );
      assert.equal(WIZARD_STEPS[0].shortLabel, "Outlet");
      assert.equal(WIZARD_STEPS[1].shortLabel, "Materi");
      assert.equal(WIZARD_STEPS[2].shortLabel, "Foto");
      assert.equal(WIZARD_STEPS[3].shortLabel, "Lokasi");
    });
  });
});
