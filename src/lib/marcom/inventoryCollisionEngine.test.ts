import test from "node:test";
import assert from "node:assert/strict";
import {
  checkBookingCollision,
  getDatesInRange,
  calculateItemRemainingCapacity,
  type ExistingBookingItem,
  type ItemMasterCapacity,
} from "./inventoryCollisionEngine";

test("getDatesInRange generates inclusive ISO date strings", () => {
  const dates = getDatesInRange("2026-11-10", "2026-11-14");
  assert.deepEqual(dates, [
    "2026-11-10",
    "2026-11-11",
    "2026-11-12",
    "2026-11-13",
    "2026-11-14",
  ]);

  // Single day range
  assert.deepEqual(getDatesInRange("2026-11-10", "2026-11-10"), ["2026-11-10"]);

  // Invalid inverted range
  assert.deepEqual(getDatesInRange("2026-11-15", "2026-11-10"), []);
});

test("checkBookingCollision: non-overlapping bookings evaluate hasConflict = false (AC-1)", () => {
  const itemCapacities = new Map<string, ItemMasterCapacity>([
    ["item-1", { id: "item-1", name: "Tenda Lipat 3x3", totalUnits: 1 }],
  ]);

  const existingBookings: ExistingBookingItem[] = [
    {
      inventoryItemId: "item-1",
      quantity: 1,
      borrowCode: "BRW-20261110-001",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      status: "APPROVED",
    },
  ];

  // Request for 2026-11-15 to 2026-11-18 (well after Nov 12)
  const result = checkBookingCollision({
    requestedItems: [{ inventoryItemId: "item-1", quantity: 1 }],
    borrowDate: "2026-11-15",
    returnDueDate: "2026-11-18",
    existingBookings,
    itemCapacities,
  });

  assert.equal(result.hasConflict, false);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.isTightSchedule, false);
});

test("checkBookingCollision: overlapping bookings exceeding capacity evaluate hasConflict = true (AC-2)", () => {
  const itemCapacities = new Map<string, ItemMasterCapacity>([
    ["item-1", { id: "item-1", name: "Sound System Portable", totalUnits: 1 }],
  ]);

  const existingBookings: ExistingBookingItem[] = [
    {
      inventoryItemId: "item-1",
      quantity: 1,
      borrowCode: "BRW-20261110-001",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-14",
      status: "APPROVED",
    },
  ];

  // Request for 2026-11-12 to 2026-11-16 (overlaps Nov 12, 13, 14)
  const result = checkBookingCollision({
    requestedItems: [{ inventoryItemId: "item-1", quantity: 1 }],
    borrowDate: "2026-11-12",
    returnDueDate: "2026-11-16",
    existingBookings,
    itemCapacities,
  });

  assert.equal(result.hasConflict, true);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].itemName, "Sound System Portable");
  assert.deepEqual(result.conflicts[0].conflictingDates, ["2026-11-12", "2026-11-13", "2026-11-14"]);
  assert.deepEqual(result.conflicts[0].conflictingBorrowCodes, ["BRW-20261110-001"]);
  assert.equal(result.conflicts[0].availableCapacity, 0);
});

test("checkBookingCollision: tight schedule detection flags T+0 and T+1 (AC-4)", () => {
  const itemCapacities = new Map<string, ItemMasterCapacity>([
    ["item-1", { id: "item-1", name: "Genset Silent 5kVA", totalUnits: 2 }],
  ]);

  const existingBookings: ExistingBookingItem[] = [
    {
      inventoryItemId: "item-1",
      quantity: 1,
      borrowCode: "BRW-20261110-001",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-13",
      status: "APPROVED",
    },
  ];

  // Scenario A: T+1 next day (starts 2026-11-14)
  const resultTPlus1 = checkBookingCollision({
    requestedItems: [{ inventoryItemId: "item-1", quantity: 1 }],
    borrowDate: "2026-11-14",
    returnDueDate: "2026-11-16",
    existingBookings,
    itemCapacities,
  });

  assert.equal(resultTPlus1.hasConflict, false);
  assert.equal(resultTPlus1.isTightSchedule, true);
  assert.equal(resultTPlus1.tightScheduleDetails.length, 1);
  assert.equal(resultTPlus1.tightScheduleDetails[0].gapDays, 1);
  assert.equal(resultTPlus1.tightScheduleDetails[0].precedingReturnDueDate, "2026-11-13");

  // Scenario B: T+0 same day (starts 2026-11-13) with capacity = 2, quantity = 1 (no conflict, but tight)
  const resultTPlus0 = checkBookingCollision({
    requestedItems: [{ inventoryItemId: "item-1", quantity: 1 }],
    borrowDate: "2026-11-13",
    returnDueDate: "2026-11-15",
    existingBookings,
    itemCapacities,
  });

  assert.equal(resultTPlus0.hasConflict, false);
  assert.equal(resultTPlus0.isTightSchedule, true);
  assert.equal(resultTPlus0.tightScheduleDetails[0].gapDays, 0);
});

test("checkBookingCollision: multi-item basket isolates specific bottleneck item", () => {
  const itemCapacities = new Map<string, ItemMasterCapacity>([
    ["item-1", { id: "item-1", name: "Tenda 3x3", totalUnits: 5 }],
    ["item-2", { id: "item-2", name: "Kamera Mirrorless", totalUnits: 1 }],
  ]);

  const existingBookings: ExistingBookingItem[] = [
    {
      inventoryItemId: "item-1",
      quantity: 1,
      borrowCode: "BRW-A",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-20",
      status: "APPROVED",
    },
    {
      inventoryItemId: "item-2",
      quantity: 1,
      borrowCode: "BRW-B",
      borrowDate: "2026-11-12",
      returnDueDate: "2026-11-15",
      status: "ACTIVE",
    },
  ];

  // Requesting 2 tents (available 4) and 1 camera (available 0 during Nov 12-15)
  const result = checkBookingCollision({
    requestedItems: [
      { inventoryItemId: "item-1", quantity: 2 },
      { inventoryItemId: "item-2", quantity: 1 },
    ],
    borrowDate: "2026-11-14",
    returnDueDate: "2026-11-16",
    existingBookings,
    itemCapacities,
  });

  assert.equal(result.hasConflict, true);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].inventoryItemId, "item-2");
  assert.equal(result.conflicts[0].itemName, "Kamera Mirrorless");
  assert.deepEqual(result.conflicts[0].conflictingBorrowCodes, ["BRW-B"]);
});

test("calculateItemRemainingCapacity finds minimum remaining units across dates", () => {
  const existingBookings: ExistingBookingItem[] = [
    {
      inventoryItemId: "item-1",
      quantity: 2,
      borrowCode: "BRW-1",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      status: "APPROVED",
    },
    {
      inventoryItemId: "item-1",
      quantity: 1,
      borrowCode: "BRW-2",
      borrowDate: "2026-11-12",
      returnDueDate: "2026-11-15",
      status: "ACTIVE",
    },
  ];

  // Total units: 3
  // On Nov 11: 2 allocated -> 1 remaining
  // On Nov 12: 2 + 1 = 3 allocated -> 0 remaining
  // On Nov 13: 1 allocated -> 2 remaining
  const capacityRange = calculateItemRemainingCapacity({
    inventoryItemId: "item-1",
    totalUnits: 3,
    borrowDate: "2026-11-10",
    returnDueDate: "2026-11-14",
    existingBookings,
  });

  assert.equal(capacityRange, 0); // bottleneck on Nov 12

  const capacityAfter = calculateItemRemainingCapacity({
    inventoryItemId: "item-1",
    totalUnits: 3,
    borrowDate: "2026-11-16",
    returnDueDate: "2026-11-18",
    existingBookings,
  });

  assert.equal(capacityAfter, 3); // all free
});
