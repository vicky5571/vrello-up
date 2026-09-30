import test from "node:test";
import assert from "node:assert/strict";
import {
  filterPlacementsByCriteria,
  filterMousByCriteria,
  filterEventsByCriteria,
  filterContentByCriteria,
  isDateInQuarter,
  isAnyFilterActive,
  DEFAULT_ANALYTICS_FILTERS,
  type AnalyticsFilterState,
} from "@/lib/marcom/analyticsFilterHelpers";
import type {
  MarcomPlacement,
  MarcomMou,
  FieldEventItem,
  ContentPostItem,
} from "@/types";

test("isDateInQuarter accurately matches calendar quarters", () => {
  assert.equal(isDateInQuarter("2026-02-15", "Q1", 2026), true);
  assert.equal(isDateInQuarter("2026-05-10", "Q1", 2026), false);
  assert.equal(isDateInQuarter("2026-05-10", "Q2", 2026), true);
  assert.equal(isDateInQuarter("2026-08-20", "Q3", 2026), true);
  assert.equal(isDateInQuarter("2026-11-01", "Q4", 2026), true);
  assert.equal(isDateInQuarter("2026-11-01", "ALL", 2026), true);
  assert.equal(isDateInQuarter(null, "ALL", 2026), true);
  assert.equal(isDateInQuarter("2026-11-01", "Q4", 2025), false);
  assert.equal(isDateInQuarter("not-a-date", "Q1", 2026), false);
  assert.equal(isDateInQuarter(null, "Q1", 2026), false);
});

test("filterPlacementsByCriteria filters by branch, brand and quarter", () => {
  const mockPlacements = [
    {
      id: "p1",
      outlet: { branchId: "b-semarang" },
      brand: "IM3",
      date: "2026-02-10",
    },
    {
      id: "p2",
      outlet: { branchId: "b-solo" },
      brand: "TRI",
      date: "2026-02-15",
    },
    {
      id: "p3",
      outlet: { branchId: "b-semarang" },
      brand: "TRI",
      date: "2026-05-20",
    },
  ] as unknown as MarcomPlacement[];

  const filterSemarang: AnalyticsFilterState = {
    branchId: "b-semarang",
    brand: "ALL",
    quarter: "ALL",
    year: 2026,
  };
  const semarangOnly = filterPlacementsByCriteria(mockPlacements, filterSemarang);
  assert.equal(semarangOnly.length, 2);

  const filterSemarangIM3: AnalyticsFilterState = {
    branchId: "b-semarang",
    brand: "IM3",
    quarter: "ALL",
    year: 2026,
  };
  const semarangIM3 = filterPlacementsByCriteria(mockPlacements, filterSemarangIM3);
  assert.equal(semarangIM3.length, 1);
  assert.equal(semarangIM3[0].id, "p1");

  const filterQ1Only: AnalyticsFilterState = {
    branchId: "ALL",
    brand: "ALL",
    quarter: "Q1",
    year: 2026,
  };
  const q1Placements = filterPlacementsByCriteria(mockPlacements, filterQ1Only);
  assert.equal(q1Placements.length, 2);
});

test("filterMousByCriteria scopes by branchId and submission quarter", () => {
  const mockMous = [
    { id: "m1", branchId: "b-semarang", submissionDate: "2026-01-10", startDate: "2026-02-01" },
    { id: "m2", branchId: "b-solo", submissionDate: "2026-04-10", startDate: "2026-05-01" },
  ] as unknown as MarcomMou[];

  const semarang = filterMousByCriteria(mockMous, {
    branchId: "b-semarang",
    brand: "ALL",
    quarter: "ALL",
    year: 2026,
  });
  assert.equal(semarang.length, 1);
  assert.equal(semarang[0].id, "m1");

  const q2 = filterMousByCriteria(mockMous, {
    branchId: "ALL",
    brand: "ALL",
    quarter: "Q2",
    year: 2026,
  });
  assert.equal(q2.length, 1);
  assert.equal(q2[0].id, "m2");
});

test("filterEventsByCriteria scopes by branch name and event start date", () => {
  const mockEvents = [
    {
      id: "e1",
      name: "Semarang Roadshow",
      eventType: "Roadshow",
      status: "COMPLETED",
      budget: 1000,
      targetAttendee: 10,
      attendeeCount: 8,
      branchName: "Semarang",
      startDate: "2026-03-01",
    },
    {
      id: "e2",
      name: "Solo Expo",
      eventType: "Expo",
      status: "COMPLETED",
      budget: 2000,
      targetAttendee: 20,
      attendeeCount: 15,
      branchName: "Solo",
      startDate: "2026-08-01",
    },
  ] as unknown as FieldEventItem[];

  const semarang = filterEventsByCriteria(mockEvents, {
    branchId: "Semarang",
    brand: "ALL",
    quarter: "ALL",
    year: 2026,
  });
  assert.equal(semarang.length, 1);
  assert.equal(semarang[0].id, "e1");

  const q3 = filterEventsByCriteria(mockEvents, {
    branchId: "ALL",
    brand: "ALL",
    quarter: "Q3",
    year: 2026,
  });
  assert.equal(q3.length, 1);
  assert.equal(q3[0].id, "e2");
});

test("filterContentByCriteria scopes by publish quarter", () => {
  const mockPosts = [
    { id: "c1", platform: "instagram", status: "PUBLISHED", publishDate: "2026-02-01" },
    { id: "c2", platform: "tiktok", status: "DRAFT", publishDate: "2026-10-01" },
  ] as unknown as ContentPostItem[];

  const q1 = filterContentByCriteria(mockPosts, {
    branchId: "ALL",
    brand: "ALL",
    quarter: "Q1",
    year: 2026,
  });
  assert.equal(q1.length, 1);
  assert.equal(q1[0].id, "c1");

  const all = filterContentByCriteria(mockPosts, DEFAULT_ANALYTICS_FILTERS);
  assert.equal(all.length, 2);
});

test("isAnyFilterActive detects non-default filter dimensions", () => {
  assert.equal(isAnyFilterActive(DEFAULT_ANALYTICS_FILTERS), false);
  assert.equal(
    isAnyFilterActive({ ...DEFAULT_ANALYTICS_FILTERS, branchId: "b-semarang" }),
    true
  );
  assert.equal(
    isAnyFilterActive({ ...DEFAULT_ANALYTICS_FILTERS, brand: "IM3" }),
    true
  );
  assert.equal(
    isAnyFilterActive({ ...DEFAULT_ANALYTICS_FILTERS, quarter: "Q2" }),
    true
  );
});
