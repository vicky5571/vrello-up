import test from "node:test";
import assert from "node:assert/strict";
import {
  getWorkItemColumn,
  mapColumnToStatus,
  getWorkItemSubStatus,
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
  PROJECTS_COLUMN_ORDER,
  PROJECTS_COLUMN_ORDER_WITH_ARCHIVED,
  VALID_COLUMNS_BY_TYPE,
} from "./workItems";
import type { MarcomWorkItem } from "@/types";

test("workItems: column mapping for ContentPost covers all 7 DB statuses", () => {
  const baseContent: MarcomWorkItem = {
    _type: "content",
    id: "p1",
    title: "Post 1",
    platform: "instagram",
    format: "reel",
    status: "DRAFT",
  };
  assert.equal(getWorkItemColumn({ ...baseContent, status: "DRAFT" }), "To Do");
  assert.equal(getWorkItemColumn({ ...baseContent, status: "IN_REVIEW" }), "In Review");
  assert.equal(getWorkItemColumn({ ...baseContent, status: "REVISION" }), "In Progress");
  assert.equal(getWorkItemColumn({ ...baseContent, status: "APPROVED" }), "In Review");
  assert.equal(getWorkItemColumn({ ...baseContent, status: "SCHEDULED" }), "In Review");
  assert.equal(getWorkItemColumn({ ...baseContent, status: "PUBLISHED" }), "Done");
  assert.equal(getWorkItemColumn({ ...baseContent, status: "ARCHIVED" }), "Archived");
});

test("workItems: column mapping for FieldEvent covers all 4 DB statuses", () => {
  const event: MarcomWorkItem = {
    _type: "event",
    id: "e1",
    name: "Campus Fair",
    eventType: "ACTIVATION",
    status: "UPCOMING",
    budget: 1000,
    targetAttendee: 50,
    attendeeCount: 0,
  };
  assert.equal(getWorkItemColumn(event), "To Do");
  assert.equal(getWorkItemColumn({ ...event, status: "ON_PROGRESS" }), "In Progress");
  assert.equal(getWorkItemColumn({ ...event, status: "COMPLETED" }), "Done");
  assert.equal(getWorkItemColumn({ ...event, status: "CANCELLED" }), "Cancelled");
});

test("workItems: column mapping for Placement covers all 4 DB statuses", () => {
  const placement: MarcomWorkItem = {
    _type: "placement",
    id: "pl1",
    outletId: "o1",
    materialId: "m1",
    status: "NOT_STARTED",
    date: "2026-11-01",
    picName: "Budi",
    photoUrl: "",
    dimensions: "2x3m",
    cost: 500000,
    notes: "",
  };
  assert.equal(getWorkItemColumn(placement), "To Do");
  assert.equal(getWorkItemColumn({ ...placement, status: "ON_PROGRESS" }), "In Progress");
  assert.equal(getWorkItemColumn({ ...placement, status: "DONE" }), "Done");
  assert.equal(getWorkItemColumn({ ...placement, status: "ISSUE" }), "Blocked");
});

test("workItems: mapColumnToStatus maps correctly for each type", () => {
  // Content mappings
  assert.equal(mapColumnToStatus("content", "To Do"), "DRAFT");
  assert.equal(mapColumnToStatus("content", "In Progress"), "REVISION");
  assert.equal(mapColumnToStatus("content", "In Review"), "IN_REVIEW");
  assert.equal(mapColumnToStatus("content", "Done"), "PUBLISHED");
  assert.equal(mapColumnToStatus("content", "Archived"), "ARCHIVED");
  assert.equal(mapColumnToStatus("content", "Blocked"), null);
  assert.equal(mapColumnToStatus("content", "Cancelled"), null);

  // Event mappings
  assert.equal(mapColumnToStatus("event", "To Do"), "UPCOMING");
  assert.equal(mapColumnToStatus("event", "In Progress"), "ON_PROGRESS");
  assert.equal(mapColumnToStatus("event", "Done"), "COMPLETED");
  assert.equal(mapColumnToStatus("event", "Cancelled"), "CANCELLED");
  assert.equal(mapColumnToStatus("event", "Blocked"), null);
  assert.equal(mapColumnToStatus("event", "In Review"), null);
  assert.equal(mapColumnToStatus("event", "Archived"), null);

  // Placement mappings
  assert.equal(mapColumnToStatus("placement", "To Do"), "NOT_STARTED");
  assert.equal(mapColumnToStatus("placement", "In Progress"), "ON_PROGRESS");
  assert.equal(mapColumnToStatus("placement", "Done"), "DONE");
  assert.equal(mapColumnToStatus("placement", "Blocked"), "ISSUE");
  assert.equal(mapColumnToStatus("placement", "In Review"), null);
  assert.equal(mapColumnToStatus("placement", "Cancelled"), null);
  assert.equal(mapColumnToStatus("placement", "Archived"), null);
});

test("workItems: getWorkItemSubStatus returns correct label and color", () => {
  const content: MarcomWorkItem = {
    _type: "content",
    id: "c1",
    title: "Post",
    platform: "instagram",
    format: "reel",
    status: "IN_REVIEW",
  };
  assert.deepEqual(getWorkItemSubStatus(content), {
    label: "Menunggu Review",
    color: "#F59E0B",
  });
  assert.equal(getWorkItemSubStatus({ ...content, status: "REVISION" }).label, "Perlu Revisi");
  assert.equal(getWorkItemSubStatus({ ...content, status: "APPROVED" }).label, "Approved");
  assert.equal(getWorkItemSubStatus({ ...content, status: "SCHEDULED" }).label, "Terjadwal");

  const event: MarcomWorkItem = {
    _type: "event",
    id: "e1",
    name: "Event",
    eventType: "ACTIVATION",
    status: "UPCOMING",
    budget: 0,
    targetAttendee: 0,
    attendeeCount: 0,
  };
  assert.deepEqual(getWorkItemSubStatus(event), {
    label: "Akan Datang",
    color: "#3B82F6",
  });
  assert.equal(getWorkItemSubStatus({ ...event, status: "CANCELLED" }).label, "Dibatalkan");

  const placement: MarcomWorkItem = {
    _type: "placement",
    id: "pl1",
    outletId: "o1",
    materialId: "m1",
    status: "ISSUE",
    date: "2026-11-01",
    picName: "Budi",
    photoUrl: "",
    dimensions: "2x3m",
    cost: 500000,
    notes: "",
  };
  assert.deepEqual(getWorkItemSubStatus(placement), {
    label: "Ada Kendala",
    color: "#EF4444",
  });
  assert.equal(getWorkItemSubStatus({ ...placement, status: "DONE" }).label, "Terpasang");
});

test("workItems: column order constants and valid column definitions", () => {
  assert.deepEqual(PROJECTS_COLUMN_ORDER, [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
    "Blocked",
    "Cancelled",
  ]);
  assert.deepEqual(PROJECTS_COLUMN_ORDER_WITH_ARCHIVED, [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
    "Blocked",
    "Cancelled",
    "Archived",
  ]);
  assert.deepEqual(VALID_COLUMNS_BY_TYPE.content, [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
    "Archived",
  ]);
  assert.deepEqual(VALID_COLUMNS_BY_TYPE.event, [
    "To Do",
    "In Progress",
    "Done",
    "Cancelled",
  ]);
  assert.deepEqual(VALID_COLUMNS_BY_TYPE.placement, [
    "To Do",
    "In Progress",
    "Done",
    "Blocked",
  ]);
});

test("workItems: metadata helpers return title, date, and pic", () => {
  const content: MarcomWorkItem = {
    _type: "content",
    id: "c1",
    title: "Summer Promo",
    platform: "tiktok",
    format: "reel",
    publishDate: "2026-06-01",
    picName: "Sari",
    status: "DRAFT",
  };
  assert.equal(getWorkItemTitle(content), "Summer Promo");
  assert.equal(getWorkItemDate(content), "2026-06-01");
  assert.equal(getWorkItemPic(content), "Sari");
});
