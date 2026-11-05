import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("ReturnProcessModal & Compensation UI Invariants (ADR-0050)", () => {
  const root = process.cwd();

  it("ReturnProcessModal includes 4 condition breakdown inputs and sum validation", () => {
    const filePath = path.resolve(root, "src/components/views/InventoryView/ReturnProcessModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("goodUnits"), "Must support goodUnits");
    assert.ok(content.includes("minorDamageUnits"), "Must support minorDamageUnits");
    assert.ok(content.includes("majorDamageUnits"), "Must support majorDamageUnits");
    assert.ok(content.includes("lostUnits"), "Must support lostUnits");
    assert.ok(content.includes("isAnySumInvalid"), "Must calculate isAnySumInvalid");
    assert.ok(content.includes("disabled={loading || isAnySumInvalid}"), "Submit button must disable when sum is invalid");
  });

  it("ReturnProcessModal includes compensation and damage photo controls", () => {
    const filePath = path.resolve(root, "src/components/views/InventoryView/ReturnProcessModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("compensationAmount"), "Must capture compensationAmount");
    assert.ok(content.includes("compensationStatus"), "Must capture compensationStatus");
    assert.ok(content.includes("compensationNotes"), "Must capture compensationNotes");
    assert.ok(content.includes("damagePhotos"), "Must capture damagePhotos");
  });

  it("BorrowDetailModal renders compensation liability status and damage photos", () => {
    const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("record.compensationStatus"), "Must check compensationStatus");
    assert.ok(content.includes("record.damagePhotos"), "Must render damagePhotos gallery");
    assert.ok(content.includes("record.compensationAmount"), "Must display compensationAmount");
  });

  it("UserRoleSelect includes warehouse in role options", () => {
    const filePath = path.resolve(root, "src/components/views/UsersView/UserRoleSelect.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes('"warehouse"'), "Must include warehouse role option");
  });
});

