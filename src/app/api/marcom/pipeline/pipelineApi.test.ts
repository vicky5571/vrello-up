import test from "node:test";
import assert from "node:assert/strict";
import type { OutletPipelineRow } from "@/lib/marcom/pipelineEngine";
import { filterPipelineRows } from "@/app/api/marcom/pipeline/route";

const mockRows: OutletPipelineRow[] = [
  {
    id: "outlet-1",
    code: "OUT-001",
    name: "Toko Sinar Jaya",
    type: "MODERN_RETAIL",
    tier: "TIER_1",
    city: "Semarang",
    address: "Jl. Pemuda No. 1",
    picName: "Budi Santoso",
    picPhone: "081234567890",
    active: true,
    branch: { id: "branch-smg", name: "Semarang", code: "SMG" },
    mouSummary: { total: 1, latestStatus: "APPROVED", compensationValue: 10000000, isHealthy: true },
    placementSummary: { total: 2, doneCount: 2, pendingCount: 0, totalCost: 5000000, hasBlockedItems: false },
    eventSummary: { total: 1, upcomingCount: 1, nearestEventName: "Expo 2026" },
    contentSummary: { total: 2, publishedCount: 2, inReviewCount: 0, latestPlatform: "instagram" },
  },
  {
    id: "outlet-2",
    code: "OUT-002",
    name: "Warung Berkah Abadi",
    type: "TRADITIONAL",
    tier: "TIER_2",
    city: "Solo",
    address: "Jl. Slamet Riyadi No. 50",
    picName: "Agus Prabowo",
    picPhone: "089876543210",
    active: true,
    branch: { id: "branch-slo", name: "Solo", code: "SLO" },
    mouSummary: { total: 1, latestStatus: "SUBMITTED", compensationValue: 4000000, isHealthy: false },
    placementSummary: { total: 1, doneCount: 0, pendingCount: 1, totalCost: 2000000, hasBlockedItems: true },
    eventSummary: { total: 0, upcomingCount: 0 },
    contentSummary: { total: 0, publishedCount: 0, inReviewCount: 0 },
  },
  {
    id: "outlet-3",
    code: "OUT-003",
    name: "Cellular Express",
    type: "EXCLUSIVE",
    tier: "TIER_1",
    city: "Yogyakarta",
    address: "Jl. Malioboro No. 100",
    picName: "Dewi Lestari",
    picPhone: "081122334455",
    active: true,
    branch: { id: "branch-yog", name: "Yogyakarta", code: "YOG" },
    mouSummary: { total: 2, latestStatus: "APPROVED", compensationValue: 15000000, isHealthy: true },
    placementSummary: { total: 3, doneCount: 1, pendingCount: 2, totalCost: 7500000, hasBlockedItems: true },
    eventSummary: { total: 2, upcomingCount: 1, nearestEventName: "Campus Roadshow" },
    contentSummary: { total: 3, publishedCount: 1, inReviewCount: 2, latestPlatform: "tiktok" },
  },
  {
    id: "outlet-4",
    code: "OUT-004",
    name: "Kios Pulsa Murah",
    type: "TRADITIONAL",
    tier: "TIER_3",
    city: "Magelang",
    address: "Jl. Pahlawan No. 12",
    picName: "Siti Rahma",
    picPhone: "087711223344",
    active: false,
    branch: { id: "branch-smg", name: "Semarang", code: "SMG" },
    mouSummary: { total: 0, latestStatus: "NONE", compensationValue: 0, isHealthy: false },
    placementSummary: { total: 0, doneCount: 0, pendingCount: 0, totalCost: 0, hasBlockedItems: false },
    eventSummary: { total: 0, upcomingCount: 0 },
    contentSummary: { total: 0, publishedCount: 0, inReviewCount: 0 },
  },
];

test("filterPipelineRows: filters by branchId and ignores 'ALL' or empty", () => {
  const smgOnly = filterPipelineRows(mockRows, { branchId: "branch-smg" });
  assert.equal(smgOnly.length, 2);
  assert.deepEqual(smgOnly.map((r) => r.id), ["outlet-1", "outlet-4"]);

  const allBranches = filterPipelineRows(mockRows, { branchId: "ALL" });
  assert.equal(allBranches.length, 4);

  const emptyBranch = filterPipelineRows(mockRows, { branchId: "" });
  assert.equal(emptyBranch.length, 4);
});

test("filterPipelineRows: filters by tier and ignores 'ALL' or empty", () => {
  const tier1 = filterPipelineRows(mockRows, { tier: "TIER_1" });
  assert.equal(tier1.length, 2);
  assert.deepEqual(tier1.map((r) => r.id), ["outlet-1", "outlet-3"]);

  const tier2 = filterPipelineRows(mockRows, { tier: "TIER_2" });
  assert.equal(tier2.length, 1);
  assert.equal(tier2[0].id, "outlet-2");

  const allTiers = filterPipelineRows(mockRows, { tier: "ALL" });
  assert.equal(allTiers.length, 4);
});

test("filterPipelineRows: search query q matches name, code, city, or picName case-insensitively", () => {
  // By name substring
  const byName = filterPipelineRows(mockRows, { q: "sinar" });
  assert.equal(byName.length, 1);
  assert.equal(byName[0].id, "outlet-1");

  // By code
  const byCode = filterPipelineRows(mockRows, { q: "OUT-003" });
  assert.equal(byCode.length, 1);
  assert.equal(byCode[0].id, "outlet-3");

  // By city
  const byCity = filterPipelineRows(mockRows, { q: "solo" });
  assert.equal(byCity.length, 1);
  assert.equal(byCity[0].id, "outlet-2");

  // By PIC name
  const byPic = filterPipelineRows(mockRows, { q: "dewi" });
  assert.equal(byPic.length, 1);
  assert.equal(byPic[0].id, "outlet-3");

  // No match
  const noMatch = filterPipelineRows(mockRows, { q: "nonexistent" });
  assert.equal(noMatch.length, 0);

  // Whitespace only
  const emptyQ = filterPipelineRows(mockRows, { q: "   " });
  assert.equal(emptyQ.length, 4);
});

test("filterPipelineRows: bottleneckOnly flag filters outlets with blocked placement items", () => {
  // Boolean true
  const blockedBool = filterPipelineRows(mockRows, { bottleneckOnly: true });
  assert.equal(blockedBool.length, 2);
  assert.deepEqual(blockedBool.map((r) => r.id), ["outlet-2", "outlet-3"]);

  // String "true"
  const blockedStr = filterPipelineRows(mockRows, { bottleneckOnly: "true" });
  assert.equal(blockedStr.length, 2);

  // String "1"
  const blockedOne = filterPipelineRows(mockRows, { bottleneckOnly: "1" });
  assert.equal(blockedOne.length, 2);

  // Boolean false or undefined
  const notBlocked = filterPipelineRows(mockRows, { bottleneckOnly: false });
  assert.equal(notBlocked.length, 4);

  const omitted = filterPipelineRows(mockRows, {});
  assert.equal(omitted.length, 4);
});

test("filterPipelineRows: combined multi-criteria filters apply conjunction (AND) correctly", () => {
  // TIER_1 in Yogyakarta with bottleneckOnly = true
  const filtered = filterPipelineRows(mockRows, {
    branchId: "branch-yog",
    tier: "TIER_1",
    bottleneckOnly: true,
    q: "Cellular",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "outlet-3");

  // TIER_1 in Semarang with bottleneckOnly = true (Semarang has no bottleneck)
  const noBottleneckInSmg = filterPipelineRows(mockRows, {
    branchId: "branch-smg",
    tier: "TIER_1",
    bottleneckOnly: true,
  });
  assert.equal(noBottleneckInSmg.length, 0);
});

test("filterPipelineRows: handles edge cases like empty rows, undefined fields gracefully", () => {
  const emptyResult = filterPipelineRows([], { q: "test", branchId: "b1", bottleneckOnly: true });
  assert.deepEqual(emptyResult, []);

  // Row with missing optional string properties
  const sparseRows: OutletPipelineRow[] = [
    {
      id: "sparse-1",
      code: "",
      name: "Sparse Name",
      type: "TRADITIONAL",
      tier: "TIER_1",
      city: "",
      address: "",
      picName: "",
      picPhone: "",
      active: true,
      branch: { id: "b-sparse", name: "", code: "" },
      mouSummary: { total: 0, latestStatus: "NONE", compensationValue: 0, isHealthy: false },
      placementSummary: { total: 0, doneCount: 0, pendingCount: 0, totalCost: 0, hasBlockedItems: false },
      eventSummary: { total: 0, upcomingCount: 0 },
      contentSummary: { total: 0, publishedCount: 0, inReviewCount: 0 },
    },
  ];

  const matchName = filterPipelineRows(sparseRows, { q: "sparse" });
  assert.equal(matchName.length, 1);

  const matchCity = filterPipelineRows(sparseRows, { q: "jakarta" });
  assert.equal(matchCity.length, 0);
});
