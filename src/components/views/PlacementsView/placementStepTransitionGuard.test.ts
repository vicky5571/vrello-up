import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Wizard Step Transition Submission Guard (ADR-0080)", async (t) => {
  await t.test("WizardFooter isolates next and submit buttons with unique key attributes", () => {
    const footerPath = path.join(
      process.cwd(),
      "src/components/views/PlacementsView/wizard/WizardFooter.tsx"
    );
    const content = fs.readFileSync(footerPath, "utf-8");

    assert.match(
      content,
      /key="wizard-btn-next"/,
      "WizardFooter must assign key='wizard-btn-next' to the Lanjut button to force React unmount on step change"
    );
    assert.match(
      content,
      /key="wizard-btn-submit"/,
      "WizardFooter must assign key='wizard-btn-submit' to the final submission button"
    );
  });

  await t.test("PlacementFormModal enforces step 4 submission guard", () => {
    const modalPath = path.join(
      process.cwd(),
      "src/components/views/PlacementsView/PlacementFormModal.tsx"
    );
    const content = fs.readFileSync(modalPath, "utf-8");

    assert.match(
      content,
      /const\s+handleFormSubmit\s*=\s*\(e:\s*React\.FormEvent\)\s*=>\s*\{[\s\S]*?if\s*\(\s*currentStep\s*!==\s*4\s*\)\s*\{?\s*return;?[\s\S]*?onSave\(e\);?/,
      "PlacementFormModal must define handleFormSubmit guard blocking onSave when currentStep !== 4"
    );

    assert.match(
      content,
      /<form\s+onSubmit=\{handleFormSubmit\}/,
      "PlacementFormModal must attach handleFormSubmit to the form onSubmit event"
    );
  });

  await t.test("PlacementFormModal maintains safe coordinator file limit (<= 350 LOC)", () => {
    const modalPath = path.join(
      process.cwd(),
      "src/components/views/PlacementsView/PlacementFormModal.tsx"
    );
    const lines = fs.readFileSync(modalPath, "utf-8").split("\n").length;
    assert.ok(
      lines <= 350,
      `PlacementFormModal.tsx exceeds limit: ${lines} lines (max 350)`
    );
  });
});
