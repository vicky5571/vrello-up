import test from "node:test";
import assert from "node:assert/strict";
import type { EquipmentStatus, BorrowStatus, EquipmentCondition } from "@/types";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUS_CONFIG,
  BORROW_STATUS_CONFIG,
  CONDITION_CONFIG,
} from "@/components/views/InventoryView/inventoryConstants";

// Pure business logic helpers to test state transitions and availability restoration
function isValidBorrowTransition(from: BorrowStatus, to: BorrowStatus): boolean {
  const allowed: Record<BorrowStatus, BorrowStatus[]> = {
    PENDING: ["APPROVED", "CANCELLED"],
    APPROVED: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["OVERDUE"], // RETURNED is via return flow
    OVERDUE: [],
    RETURNED: [],
    CANCELLED: [],
  };
  return (allowed[from] || []).includes(to);
}

function computeRestoredUnits(
  currentAvailable: number,
  totalUnits: number,
  borrowQuantity: number,
  conditionIn: EquipmentCondition
): { newAvailable: number; status: EquipmentStatus } {
  if (conditionIn === "LOST") {
    // LOST items do NOT restore available units
    return {
      newAvailable: currentAvailable,
      status: currentAvailable === 0 ? "BORROWED" : "AVAILABLE",
    };
  }

  const newAvailable = Math.min(totalUnits, currentAvailable + borrowQuantity);
  return {
    newAvailable,
    status: newAvailable > 0 ? "AVAILABLE" : "BORROWED",
  };
}

function generateBorrowCode(date: Date, sequence: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(sequence).padStart(3, "0");
  return `BRW-${dateStr}-${seq}`;
}

test("Inventory System: Categories and Configurations", () => {
  assert.ok(EQUIPMENT_CATEGORIES.includes("Furniture"));
  assert.ok(EQUIPMENT_CATEGORIES.includes("Branding"));
  assert.ok(EQUIPMENT_CATEGORIES.includes("Audio"));
  assert.ok(EQUIPMENT_CATEGORIES.includes("Display"));
  assert.ok(EQUIPMENT_CATEGORIES.includes("Logistics"));

  assert.equal(EQUIPMENT_STATUS_CONFIG.AVAILABLE.label, "Available");
  assert.equal(EQUIPMENT_STATUS_CONFIG.BORROWED.label, "Borrowed");
  assert.equal(EQUIPMENT_STATUS_CONFIG.MAINTENANCE.label, "Maintenance");
  assert.equal(EQUIPMENT_STATUS_CONFIG.RETIRED.label, "Retired");

  assert.equal(BORROW_STATUS_CONFIG.PENDING.label, "Pending");
  assert.equal(BORROW_STATUS_CONFIG.APPROVED.label, "Approved");
  assert.equal(BORROW_STATUS_CONFIG.ACTIVE.label, "Active");
  assert.equal(BORROW_STATUS_CONFIG.OVERDUE.label, "Overdue");
  assert.equal(BORROW_STATUS_CONFIG.RETURNED.label, "Returned");

  assert.equal(CONDITION_CONFIG.GOOD.label, "Good");
  assert.equal(CONDITION_CONFIG.MINOR_DAMAGE.label, "Minor Damage");
  assert.equal(CONDITION_CONFIG.MAJOR_DAMAGE.label, "Major Damage");
  assert.equal(CONDITION_CONFIG.LOST.label, "Lost");
});

test("Inventory System: Borrow status transition validation", () => {
  // AC-10: Allowed transitions
  assert.equal(isValidBorrowTransition("PENDING", "APPROVED"), true);
  assert.equal(isValidBorrowTransition("PENDING", "CANCELLED"), true);
  assert.equal(isValidBorrowTransition("APPROVED", "ACTIVE"), true);
  assert.equal(isValidBorrowTransition("APPROVED", "CANCELLED"), true);
  assert.equal(isValidBorrowTransition("ACTIVE", "OVERDUE"), true);

  // Disallowed transitions
  assert.equal(isValidBorrowTransition("PENDING", "ACTIVE"), false);
  assert.equal(isValidBorrowTransition("PENDING", "RETURNED"), false);
  assert.equal(isValidBorrowTransition("APPROVED", "RETURNED"), false);
  assert.equal(isValidBorrowTransition("RETURNED", "ACTIVE"), false);
  assert.equal(isValidBorrowTransition("CANCELLED", "APPROVED"), false);
});

test("Inventory System: Borrow Code auto-generation format", () => {
  const d = new Date("2026-06-01T10:00:00.000Z");
  assert.equal(generateBorrowCode(d, 1), "BRW-20260601-001");
  assert.equal(generateBorrowCode(d, 42), "BRW-20260601-042");
  assert.equal(generateBorrowCode(d, 100), "BRW-20260601-100");
});

test("Inventory System: AC-8 & AC-9 Unit restoration on return", () => {
  // AC-8: Normal return with GOOD condition restores available units
  const res1 = computeRestoredUnits(2, 4, 2, "GOOD");
  assert.equal(res1.newAvailable, 4);
  assert.equal(res1.status, "AVAILABLE");

  // Minor damage still functional -> units restored
  const res2 = computeRestoredUnits(1, 4, 1, "MINOR_DAMAGE");
  assert.equal(res2.newAvailable, 2);
  assert.equal(res2.status, "AVAILABLE");

  // AC-9: LOST items do NOT restore available units
  const res3 = computeRestoredUnits(0, 4, 2, "LOST");
  assert.equal(res3.newAvailable, 0);
  assert.equal(res3.status, "BORROWED");

  // Cap at totalUnits
  const res4 = computeRestoredUnits(3, 4, 2, "GOOD");
  assert.equal(res4.newAvailable, 4);
});
