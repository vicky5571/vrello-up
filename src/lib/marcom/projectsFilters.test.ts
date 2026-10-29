import test from "node:test";
import assert from "node:assert/strict";
import { applyProjectsFilters, DEFAULT_PROJECTS_FILTERS } from "./projectsFilters";
import type { MarcomWorkItem } from "@/types";

const mockItems: MarcomWorkItem[] = [
  {
    _type: "content",
    id: "c1",
    title: "Summer Promo Reel",
    platform: "instagram",
    format: "reel",
    publishDate: "2026-06-15",
    status: "DRAFT", // To Do column
    picName: "Alice",
    branchName: "Jakarta",
  },
  {
    _type: "event",
    id: "e1",
    name: "Campus Activation Fair",
    eventType: "ACTIVATION",
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    status: "UPCOMING", // To Do column
    picName: "Bob",
    branchName: "Bandung",
    budget: 5000000,
    targetAttendee: 200,
    attendeeCount: 0,
  },
  {
    _type: "placement",
    id: "p1",
    outletId: "o1",
    materialId: "m1",
    date: "2026-06-20",
    status: "ON_PROGRESS", // In Progress column
    picName: "Charlie",
    dimensions: "2x3m",
    cost: 500000,
    photoUrl: "",
    notes: "",
    outlet: {
      id: "o1",
      code: "OUT-01",
      name: "Toko Sentosa",
      branchId: "Jakarta",
    },
  },
];

test("projectsFilters: returns all items when filters are default", () => {
  const result = applyProjectsFilters(mockItems, DEFAULT_PROJECTS_FILTERS);
  assert.equal(result.length, 3);
});

test("projectsFilters: search filters by title or name case-insensitively", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    search: "summer",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "c1");
});

test("projectsFilters: type filter hides non-matching items", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    types: ["event"],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "e1");
});

test("projectsFilters: column filter shows only items in selected columns", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    columns: ["In Progress"],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "p1");

  const resultMultiple = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    columns: ["To Do"],
  });
  assert.equal(resultMultiple.length, 2);
  const ids = resultMultiple.map((r) => r.id);
  assert.ok(ids.includes("c1"));
  assert.ok(ids.includes("e1"));
});

test("projectsFilters: branch filter matches branchName or branchId", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    branches: ["Jakarta"],
  });
  assert.equal(result.length, 2);
  const ids = result.map((r) => r.id);
  assert.ok(ids.includes("c1"));
  assert.ok(ids.includes("p1"));
});

test("projectsFilters: PIC filter matches picName", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    pics: ["Bob"],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "e1");
});

test("projectsFilters: dateFrom excludes items before range", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    dateFrom: "2026-06-18",
  });
  assert.equal(result.length, 2);
  const ids = result.map((r) => r.id);
  assert.ok(ids.includes("p1"));
  assert.ok(ids.includes("e1"));
});

test("projectsFilters: dateTo excludes items after range", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    dateTo: "2026-06-18",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "c1");
});

test("projectsFilters: combined filters are AND-ed together", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    types: ["content"],
    branches: ["Jakarta"],
    pics: ["Alice"],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "c1");
});

test("projectsFilters: empty result when no items match", () => {
  const result = applyProjectsFilters(mockItems, {
    ...DEFAULT_PROJECTS_FILTERS,
    search: "Nonexistent keyword",
  });
  assert.equal(result.length, 0);
});

