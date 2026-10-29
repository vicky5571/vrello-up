import test from "node:test";
import assert from "node:assert/strict";
import {
  getWorkItemColumn,
  mapColumnToStatus,
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
  PROJECTS_COLUMN_ORDER,
} from "./workItems";
import type { MarcomWorkItem } from "@/types";

test("workItems: column mapping for ContentPost", () => {
  const draftPost: MarcomWorkItem = {
    _type: "content",
    id: "p1",
    title: "Post 1",
    platform: "instagram",
    format: "reel",
    status: "DRAFT",
  };
  assert.equal(getWorkItemColumn(draftPost), "In Progress");

  const approvedPost: MarcomWorkItem = {
    _type: "content",
    id: "p1",
    title: "Post 1",
    platform: "instagram",
    format: "reel",
    status: "APPROVED",
  };
  assert.equal(getWorkItemColumn(approvedPost), "Ready");

  const publishedPost: MarcomWorkItem = {
    _type: "content",
    id: "p1",
    title: "Post 1",
    platform: "instagram",
    format: "reel",
    status: "PUBLISHED",
  };
  assert.equal(getWorkItemColumn(publishedPost), "Done");
});

test("workItems: column mapping for FieldEvent", () => {
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
  assert.equal(getWorkItemColumn(event), "Upcoming");

  assert.equal(getWorkItemColumn({ ...event, status: "ON_PROGRESS" }), "In Progress");
  assert.equal(getWorkItemColumn({ ...event, status: "COMPLETED" }), "Done");
  assert.equal(getWorkItemColumn({ ...event, status: "CANCELLED" }), "Cancelled");
});

test("workItems: column mapping for Placement", () => {
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
  assert.equal(mapColumnToStatus("content", "In Progress"), "IN_REVIEW");
  assert.equal(mapColumnToStatus("content", "Ready"), "APPROVED");
  assert.equal(mapColumnToStatus("content", "Done"), "PUBLISHED");
  assert.equal(mapColumnToStatus("event", "Upcoming"), "UPCOMING");
  assert.equal(mapColumnToStatus("event", "In Progress"), "ON_PROGRESS");
  assert.equal(mapColumnToStatus("placement", "To Do"), "NOT_STARTED");
  assert.equal(mapColumnToStatus("placement", "Blocked"), "ISSUE");
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
  assert.ok(PROJECTS_COLUMN_ORDER.length > 0);
});
