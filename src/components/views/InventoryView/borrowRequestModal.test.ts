import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Borrow Request Modal Comprehensive Polish Invariants (ADR-0042)", async (t) => {
  const filePath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/BorrowRequestModal.tsx"
  );
  assert.ok(fs.existsSync(filePath), "BorrowRequestModal.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("verifies CustomDropdown replaces native select on Field Event picker", () => {
    assert.match(
      content,
      /import\s*\{\s*CustomDropdown\s*\}\s*from\s*["']@\/components\/ui\/CustomDropdown["']/,
      "Must import CustomDropdown"
    );
    assert.doesNotMatch(
      content,
      /<select[\s>]/,
      "Must completely eliminate raw HTML <select> tags from BorrowRequestModal"
    );
    assert.match(
      content,
      /searchable=\{true\}/,
      "Field Event CustomDropdown must be searchable"
    );
  });

  await t.test("verifies borrowerDivision input is removed from form markup", () => {
    assert.doesNotMatch(
      content,
      /Division \/ Team/,
      "Must not display Division / Team label or input in form"
    );
    assert.match(
      content,
      /borrowerDivision:\s*["']["']/,
      "Payload must pass empty string for borrowerDivision to maintain backward compatibility"
    );
  });

  await t.test("verifies Category quick-filter chips and stepper buttons on Step 3", () => {
    assert.match(
      content,
      /EQUIPMENT_CATEGORIES\.map\(/,
      "Must render Category quick-filter chips from EQUIPMENT_CATEGORIES"
    );
    assert.match(
      content,
      /<Plus[\s\/>]/,
      "Must feature Plus stepper button for incrementing unit count"
    );
    assert.match(
      content,
      /<Minus[\s\/>]/,
      "Must feature Minus stepper button for decrementing unit count"
    );
  });

  await t.test("verifies submit button loading guard and spinner", () => {
    assert.match(
      content,
      /disabled=\{loading\}/,
      "Submit and navigation buttons must be disabled during loading"
    );
    assert.match(
      content,
      /Loader2/,
      "Must render Loader2 spinner when loading is true"
    );
  });
});

