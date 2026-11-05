import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Inventory Item Form Modal CustomDropdown Invariants (ADR-0041)", async (t) => {
  const filePath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/InventoryItemFormModal.tsx"
  );
  assert.ok(fs.existsSync(filePath), "InventoryItemFormModal.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("verifies CustomDropdown import exists and native select is eliminated", () => {
    assert.match(
      content,
      /import\s*\{\s*CustomDropdown\s*\}\s*from\s*["']@\/components\/ui\/CustomDropdown["']/,
      "Must import canonical CustomDropdown"
    );
    assert.doesNotMatch(
      content,
      /<select[\s>]/,
      "Must completely eliminate raw HTML <select> tags from InventoryItemFormModal"
    );
  });

  await t.test("verifies Category dropdown maps EQUIPMENT_CATEGORIES with size='md'", () => {
    assert.match(
      content,
      /options=\{EQUIPMENT_CATEGORIES\.map\(/,
      "Category CustomDropdown must map EQUIPMENT_CATEGORIES options"
    );
    assert.match(
      content,
      /size="md"/,
      "Category CustomDropdown must use size='md' to match sibling inputs"
    );
  });

  await t.test("verifies Equipment Status dropdown maps EQUIPMENT_STATUS_CONFIG with size='md'", () => {
    assert.match(
      content,
      /EQUIPMENT_STATUS_CONFIG\[st\]\.label/,
      "Status CustomDropdown must map EQUIPMENT_STATUS_CONFIG labels"
    );
    assert.match(
      content,
      /<CustomDropdown<EquipmentStatus>/,
      "Status CustomDropdown must be strongly typed with EquipmentStatus"
    );
  });
});

