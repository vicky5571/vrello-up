// src/components/views/ProjectsView/createModalHelpers.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeDateInput,
  resolveInitialStatus,
  getInitialPlacementPayload,
  type CreateWorkItemRequest,
} from "./createModalHelpers";

describe("createModalHelpers: sanitizeDateInput", () => {
  it("formats valid date string to YYYY-MM-DD", () => {
    assert.equal(sanitizeDateInput("2026-11-15"), "2026-11-15");
    assert.equal(sanitizeDateInput("2026-11-15T10:00:00Z"), "2026-11-15");
  });

  it("falls back to today's date when input is null, undefined, or invalid", () => {
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(sanitizeDateInput(null), today);
    assert.equal(sanitizeDateInput(undefined), today);
    assert.equal(sanitizeDateInput("invalid-date"), today);
  });
});

describe("createModalHelpers: resolveInitialStatus", () => {
  it("maps board columns to correct entity status", () => {
    assert.equal(resolveInitialStatus("content", "To Do"), "DRAFT");
    assert.equal(resolveInitialStatus("content", "In Review"), "IN_REVIEW");
    assert.equal(resolveInitialStatus("event", "To Do"), "UPCOMING");
    assert.equal(resolveInitialStatus("event", "In Progress"), "ON_PROGRESS");
    assert.equal(resolveInitialStatus("placement", "To Do"), "NOT_STARTED");
    assert.equal(resolveInitialStatus("placement", "In Progress"), "ON_PROGRESS");
    assert.equal(resolveInitialStatus("placement", "Blocked"), "ISSUE");
  });

  it("returns default fallback when column is omitted or unsupported", () => {
    assert.equal(resolveInitialStatus("content"), "SCHEDULED");
    assert.equal(resolveInitialStatus("event"), "UPCOMING");
    assert.equal(resolveInitialStatus("placement"), "NOT_STARTED");
  });
});

describe("createModalHelpers: getInitialPlacementPayload", () => {
  it("constructs valid placement payload avoiding invalid PLANNED status", () => {
    const req: CreateWorkItemRequest = {
      type: "placement",
      date: "2026-12-01",
      status: "ON_PROGRESS",
    };
    const payload = getInitialPlacementPayload(req);
    assert.equal(payload.status, "ON_PROGRESS");
    assert.equal(payload.date, "2026-12-01");
  });

  it("defaults placement status strictly to NOT_STARTED when unmapped", () => {
    const req: CreateWorkItemRequest = { type: "placement" };
    const payload = getInitialPlacementPayload(req);
    assert.equal(payload.status, "NOT_STARTED");
    assert.ok(payload.date);
  });
});
