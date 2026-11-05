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

test("Borrow Request Modal Stepper Header Invariants (ADR-0055 smoke)", async (t) => {
  const helpersPath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/wizard/borrowWizardHelpers.ts"
  );
  const headerPath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx"
  );
  const modalPath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/BorrowRequestModal.tsx"
  );

  assert.ok(fs.existsSync(helpersPath), "borrowWizardHelpers.ts must exist");
  assert.ok(fs.existsSync(headerPath), "BorrowStepperHeader.tsx must exist");

  const {
    BORROW_WIZARD_STEPS,
    canAdvanceFromBorrowStep,
    getBorrowStepCompletionStatus,
  } = await import("@/components/views/InventoryView/wizard/borrowWizardHelpers");

  await t.test("verifies 4 distinct borrow wizard steps metadata", () => {
    assert.equal(BORROW_WIZARD_STEPS.length, 4);
    assert.deepEqual(
      BORROW_WIZARD_STEPS.map((s: { step: number; shortLabel: string }) => ({ step: s.step, shortLabel: s.shortLabel })),
      [
        { step: 1, shortLabel: "Peminjam" },
        { step: 2, shortLabel: "Jadwal" },
        { step: 3, shortLabel: "Alat" },
        { step: 4, shortLabel: "Review" },
      ]
    );
  });

  await t.test("verifies canAdvanceFromBorrowStep validation guards", () => {
    // Step 1: Requester name guard
    assert.equal(canAdvanceFromBorrowStep(1, {}), false);
    assert.equal(canAdvanceFromBorrowStep(1, { borrowerName: "   " }), false);
    assert.equal(canAdvanceFromBorrowStep(1, { borrowerName: "Budi Pratama" }), true);

    // Step 2: Schedule dates guard
    assert.equal(canAdvanceFromBorrowStep(2, {}), false);
    assert.equal(
      canAdvanceFromBorrowStep(2, { borrowDate: "2026-11-10", returnDueDate: "2026-11-09" }),
      false
    );
    assert.equal(
      canAdvanceFromBorrowStep(2, { borrowDate: "2026-11-10", returnDueDate: "2026-11-12" }),
      true
    );

    // Step 3: Equipment items guard
    assert.equal(canAdvanceFromBorrowStep(3, {}), false);
    assert.equal(canAdvanceFromBorrowStep(3, { selectedItems: [] }), false);
    assert.equal(
      canAdvanceFromBorrowStep(3, { selectedItems: [{ inventoryItemId: "it-1", quantity: 0 }] }),
      false
    );
    assert.equal(
      canAdvanceFromBorrowStep(3, { selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }] }),
      true
    );

    // Step 4: Overall completion guard
    assert.equal(canAdvanceFromBorrowStep(4, { borrowerName: "Budi" }), false);
    assert.equal(
      canAdvanceFromBorrowStep(4, {
        borrowerName: "Budi",
        borrowDate: "2026-11-10",
        returnDueDate: "2026-11-12",
        selectedItems: [{ inventoryItemId: "it-1", quantity: 1 }],
      }),
      true
    );
  });

  await t.test("verifies getBorrowStepCompletionStatus computes statuses correctly", () => {
    const statuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      selectedItems: [],
    });
    assert.equal(statuses[1], true);
    assert.equal(statuses[2], true);
    assert.equal(statuses[3], false);
    assert.equal(statuses[4], false);
  });

  await t.test("verifies BorrowRequestModal imports and mounts BorrowStepperHeader", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /import\s*\{\s*BorrowStepperHeader\s*\}\s*from\s*["']\.\/wizard\/BorrowStepperHeader["']/,
      "BorrowRequestModal must import BorrowStepperHeader"
    );
    assert.match(
      modalContent,
      /<BorrowStepperHeader/,
      "BorrowRequestModal must mount BorrowStepperHeader in header"
    );
    assert.match(
      modalContent,
      /getBorrowStepCompletionStatus/,
      "BorrowRequestModal must compute reactive completionStatus"
    );
  });
});

