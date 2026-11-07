import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Step 2 Material Selector Unification and Emoji Sanitization (ADR-0078)", () => {
  const step2Path = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx"
  );

  describe("CustomDropdown Integration & Redundancy Elimination", () => {
    it("verifies Step2MaterialTheme imports CustomDropdown from @/components/ui/CustomDropdown", () => {
      const content = fs.readFileSync(step2Path, "utf-8");
      assert.ok(
        content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"') ||
          content.includes("import { CustomDropdown } from '@/components/ui/CustomDropdown'"),
        "Step2MaterialTheme must import CustomDropdown"
      );
    });

    it("verifies Step2MaterialTheme renders CustomDropdown with live search for material selection", () => {
      const content = fs.readFileSync(step2Path, "utf-8");
      assert.ok(
        content.includes('<CustomDropdown') &&
          content.includes('id="wizard-step2-material-select"') &&
          content.includes("searchable") &&
          content.includes('searchPlaceholder="Cari material POSM..."'),
        "Step2MaterialTheme must render searchable CustomDropdown with id wizard-step2-material-select"
      );
    });

    it("verifies native <select> for material selection is completely eliminated", () => {
      const content = fs.readFileSync(step2Path, "utf-8");
      assert.ok(
        !content.includes("Pilih Material Katalog Master Data...</option>"),
        "Step2MaterialTheme must eliminate raw HTML <select> options for material selection"
      );
      assert.ok(
        !content.includes("<select required"),
        "Step2MaterialTheme must eliminate required native select for materials"
      );
    });

    it("verifies redundant POSM_MATERIALS chip container is completely removed", () => {
      const content = fs.readFileSync(step2Path, "utf-8");
      assert.ok(
        !content.includes("POSM_MATERIALS.map"),
        "Step2MaterialTheme must eliminate redundant POSM_MATERIALS.map chip container"
      );
      assert.ok(
        !content.includes("handleSelectPosmChip"),
        "Step2MaterialTheme must eliminate handleSelectPosmChip dead handler"
      );
    });
  });

  describe("Costing Scheme Emoji Sanitization", () => {
    it("verifies raw Unicode emojis 🏷️ and 💰 are completely eliminated from Step 2", () => {
      const content = fs.readFileSync(step2Path, "utf-8");
      assert.ok(
        !content.includes("🏷️"),
        "Step 2 must not contain raw label tag emoji 🏷️"
      );
      assert.ok(
        !content.includes("💰"),
        "Step 2 must not contain raw money bag emoji 💰"
      );
    });

    it("verifies costing buttons render Lucide Tag and CreditCard SVG icons", () => {
      const content = fs.readFileSync(step2Path, "utf-8");
      assert.ok(
        content.includes("<Tag") && content.includes("<CreditCard"),
        "Costing buttons must render Tag and CreditCard icons"
      );
    });
  });
});
