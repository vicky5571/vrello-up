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

  await t.test("verifies getBorrowStepCompletionStatus computes cumulative sequential statuses and never marks Step 4 Review as completed (ADR-0088 & ADR-0089)", () => {
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

    const missingStep2DatesStatuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "",
      returnDueDate: "",
      selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }],
    });
    assert.equal(missingStep2DatesStatuses[1], true);
    assert.equal(missingStep2DatesStatuses[2], false);
    assert.equal(
      missingStep2DatesStatuses[3],
      false,
      "Step 3 must not be marked completed or clickable when Step 2 dates are missing"
    );
    assert.equal(missingStep2DatesStatuses[4], false);

    const allDataFilledStatuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }],
    });
    assert.equal(allDataFilledStatuses[1], true);
    assert.equal(allDataFilledStatuses[2], true);
    assert.equal(allDataFilledStatuses[3], true);
    assert.equal(
      allDataFilledStatuses[4],
      false,
      "Step 4 (Review & Submit) must remain false in completionStatus so it never shows a premature green checkmark before submission"
    );
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

  await t.test("verifies all React hooks are called before early return if (!isOpen) return null", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    const earlyReturnIdx = modalContent.indexOf("if (!isOpen) return null;");
    const useMemoIdx = modalContent.indexOf("useMemo(");

    assert.ok(earlyReturnIdx !== -1, "BorrowRequestModal must have an early return guard for !isOpen");
    assert.ok(useMemoIdx !== -1, "BorrowRequestModal must memoize completionStatus with useMemo");
    assert.ok(
      useMemoIdx < earlyReturnIdx,
      "useMemo must be called before `if (!isOpen) return null;` to obey Rules of Hooks"
    );

    const codeAfterEarlyReturn = modalContent.slice(earlyReturnIdx);
    assert.doesNotMatch(
      codeAfterEarlyReturn,
      /\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|SyncExternalStore|Session|MarcomDataStore)\s*\(/,
      "No React hooks may be called after `if (!isOpen) return null;`"
    );
  });

  await t.test("verifies borrowDate and returnDueDate initialize to empty string so Step 2 is not prematurely completed (ADR-0087)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /const\s*\[borrowDate,\s*setBorrowDate\]\s*=\s*useState\(["']["']\);/,
      "borrowDate must initialize to empty string"
    );
    assert.match(
      modalContent,
      /const\s*\[returnDueDate,\s*setReturnDueDate\]\s*=\s*useState\(["']["']\);/,
      "returnDueDate must initialize to empty string"
    );
    assert.match(
      modalContent,
      /setBorrowDate\(["']["']\);/,
      "useEffect must reset borrowDate to empty string when modal opens"
    );
    assert.match(
      modalContent,
      /setReturnDueDate\(["']["']\);/,
      "useEffect must reset returnDueDate to empty string when modal opens"
    );
  });

  await t.test("verifies Step 3 mobile catalog readability and 3-layer item card layout (ADR-0087)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /flex-1\s+overflow-y-auto\s+p-4\s+sm:p-6\s+text-xs/,
      "Modal body must use responsive p-4 sm:p-6 padding"
    );
    assert.match(
      modalContent,
      /overflow-x-auto\s+pb-1\s+no-scrollbar/,
      "Step 3 category filter rail must use no-scrollbar"
    );
    assert.match(
      modalContent,
      /p-3\s+flex\s+flex-col\s+gap-2\s+transition-colors/,
      "Step 3 catalog item row must use 3-layer vertical flex-col card layout"
    );
    assert.match(
      modalContent,
      /shrink-0\s+whitespace-nowrap\s+font-mono\s+text-\[10px\]/,
      "Item code badge must use shrink-0 whitespace-nowrap so codes never fracture across lines"
    );
    assert.match(
      modalContent,
      /line-clamp-2\s+break-words/,
      "Item name must span full card width with line-clamp-2 break-words"
    );
  });

  await t.test("verifies BorrowStepperHeader separates Step 4 clickability from Step 1-3 completion checkmarks (ADR-0088)", () => {
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    assert.match(
      headerContent,
      /const\s+isCompleted\s*=\s*s\.step\s*<\s*4\s*&&\s*completionStatus\[s\.step\];/,
      "isCompleted must be restricted to s.step < 4 so Step 4 never renders a green checkmark"
    );
    assert.match(
      headerContent,
      /isStep4Ready/,
      "BorrowStepperHeader must compute isStep4Ready so Step 4 unlocks once Steps 1-3 are complete"
    );
    assert.match(
      headerContent,
      /const\s+isClickable\s*=\s*isCompleted\s*\|\|\s*isStep4Ready\s*\|\|\s*s\.step\s*<=\s*currentStep;/,
      "isClickable must include isStep4Ready alongside isCompleted and s.step <= currentStep"
    );
  });

  await t.test("verifies smart draft cache on close (X) and full resetForm on Submit and Cancel (ADR-0089)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /const\s+resetForm\s*=\s*\(\)\s*=>\s*\{/,
      "BorrowRequestModal must define a resetForm helper"
    );
    assert.match(
      modalContent,
      /setSelectedItems\(\[\]\);/,
      "resetForm must clear selectedItems to an empty array"
    );
    assert.match(
      modalContent,
      /const\s+handleCancel\s*=\s*\(\)\s*=>\s*\{\s*resetForm\(\);\s*onClose\(\);\s*\};/,
      "handleCancel must invoke resetForm() and onClose()"
    );
    assert.match(
      modalContent,
      /onClick=\{handleCancel\}/,
      "Footer Cancel button must be wired to handleCancel"
    );
    assert.match(
      modalContent,
      /resetForm\(\);\s*onSaved\(data\);\s*onClose\(\);/,
      "handleSubmit must invoke resetForm() before onSaved(data) and onClose()"
    );
  });
});

