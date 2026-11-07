import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Field Event Checklist Readability (ADR-0072)", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src/components/views/EventsView/EventChecklistSection.tsx"
  );

  it("verifies header implements responsive 2-row layout on mobile and 1-row inline on desktop", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("flex flex-col sm:flex-row"),
      "Header must stack vertically on mobile (flex-col) and become horizontal on desktop (sm:flex-row)"
    );
    assert.ok(
      content.includes("sm:items-center sm:justify-between"),
      "Header must maintain desktop horizontal alignment invariants"
    );
    assert.ok(
      content.includes("justify-between sm:justify-end"),
      "Header status strip must span full width on mobile and right-align on desktop"
    );
  });

  it("verifies subtask items do NOT use truncate and support multi-line text wrapping", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.strictEqual(
      content.includes('truncate text-slate-800'),
      false,
      "Subtask item text must not use single-line truncate"
    );
    assert.ok(
      content.includes("break-words text-xs leading-snug"),
      "Subtask item text must use break-words text-xs leading-snug for readable multi-line wrapping"
    );
  });

  it("verifies checkbox and task item containers align to top on multi-line text", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("items-start justify-between"),
      "Task item container must use items-start to anchor checkbox on multi-line wrap"
    );
    assert.ok(
      content.includes("mt-0.5 shrink-0"),
      "Checkbox must use mt-0.5 shrink-0 to prevent vertical squishing"
    );
  });

  it("verifies add-item input uses concise non-clipping placeholder", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes('placeholder="Tambah item checklist baru..."'),
      "Add-item input must use concise placeholder to avoid mobile clipping"
    );
  });

  it("verifies EventChecklistSection coordinator remains strictly <= 250 LOC", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    const loc = content.split("\n").length;
    assert.ok(
      loc <= 250,
      `EventChecklistSection.tsx is ${loc} LOC, exceeding 250 LOC coordinator limit`
    );
  });
});
