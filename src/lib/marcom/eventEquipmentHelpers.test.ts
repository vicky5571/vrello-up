import test from "node:test";
import assert from "node:assert/strict";
import type { BorrowRecord } from "@/types";
// @ts-expect-error Node strip-types requires explicit .ts extension
import { getEventEquipmentSummary } from "./eventEquipmentHelpers.ts";

test("getEventEquipmentSummary returns null for empty/undefined borrow records or empty eventId", () => {
  assert.equal(getEventEquipmentSummary([], "event-1"), null);
  assert.equal(getEventEquipmentSummary(undefined, "event-1"), null);
  assert.equal(getEventEquipmentSummary([], ""), null);
});

test("getEventEquipmentSummary returns null when no borrow records match the eventId", () => {
  const records: BorrowRecord[] = [
    {
      id: "brw-1",
      borrowCode: "BRW-20261031-001",
      borrowerName: "Budi",
      eventId: "event-999",
      borrowDate: "2026-11-01",
      returnDueDate: "2026-11-05",
      status: "APPROVED",
      items: [
        {
          id: "bi-1",
          borrowRecordId: "brw-1",
          inventoryItemId: "item-1",
          quantity: 2,
          conditionOut: "GOOD",
        },
      ],
    },
  ];

  assert.equal(getEventEquipmentSummary(records, "event-1"), null);
});

test("getEventEquipmentSummary accurately aggregates units and records count", () => {
  const records: BorrowRecord[] = [
    {
      id: "brw-1",
      borrowCode: "BRW-20261031-001",
      borrowerName: "Budi",
      eventId: "event-1",
      borrowDate: "2026-11-01",
      returnDueDate: "2026-11-05",
      status: "ACTIVE",
      items: [
        {
          id: "bi-1",
          borrowRecordId: "brw-1",
          inventoryItemId: "item-1",
          quantity: 2,
          conditionOut: "GOOD",
        },
        {
          id: "bi-2",
          borrowRecordId: "brw-1",
          inventoryItemId: "item-2",
          quantity: 1,
          conditionOut: "GOOD",
        },
      ],
    },
    {
      id: "brw-2",
      borrowCode: "BRW-20261031-002",
      borrowerName: "Siti",
      eventId: "event-1",
      borrowDate: "2026-11-02",
      returnDueDate: "2026-11-06",
      status: "APPROVED",
      items: [
        {
          id: "bi-3",
          borrowRecordId: "brw-2",
          inventoryItemId: "item-3",
          quantity: 3,
          conditionOut: "GOOD",
        },
      ],
    },
  ];

  const summary = getEventEquipmentSummary(records, "event-1");
  assert.ok(summary);
  assert.equal(summary.recordCount, 2);
  assert.equal(summary.totalUnits, 6);
  assert.equal(summary.hasActive, true);
  assert.equal(summary.hasOverdue, false);
  assert.equal(summary.statusText, "6 Unit Alat");
});

test("getEventEquipmentSummary flags overdue loans correctly", () => {
  const records: BorrowRecord[] = [
    {
      id: "brw-1",
      borrowCode: "BRW-20261031-001",
      borrowerName: "Budi",
      eventId: "event-1",
      borrowDate: "2026-10-20",
      returnDueDate: "2026-10-25",
      status: "OVERDUE",
      items: [
        {
          id: "bi-1",
          borrowRecordId: "brw-1",
          inventoryItemId: "item-1",
          quantity: 2,
          conditionOut: "GOOD",
        },
      ],
    },
  ];

  const summary = getEventEquipmentSummary(records, "event-1");
  assert.ok(summary);
  assert.equal(summary.totalUnits, 2);
  assert.equal(summary.hasOverdue, true);
  assert.equal(summary.statusText, "2 Unit (Overdue)");
});
