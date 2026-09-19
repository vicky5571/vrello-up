import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePipelineKPIs,
  filterPipelineData,
  sortPipelineData,
  DEFAULT_PIPELINE_FILTERS,
} from "@/components/views/PipelineView/pipelineTypes";
import type { OutletPipelineRow } from "@/types";

const mockRows: OutletPipelineRow[] = [
  {
    id: "out-1",
    code: "JKT-001",
    name: "Outlet Harmoni",
    type: "MODERN_RETAIL",
    tier: "TIER_1",
    city: "Jakarta Pusat",
    address: "Jl. Hayam Wuruk No. 1",
    picName: "Budi Santoso",
    picPhone: "081234567890",
    active: true,
    branch: { id: "br-1", name: "Jakarta Core", code: "JKT" },
    mouSummary: {
      total: 1,
      latestStatus: "APPROVED",
      compensationValue: 12000000,
      isHealthy: true,
    },
    placementSummary: {
      total: 4,
      doneCount: 4,
      pendingCount: 0,
      totalCost: 5000000,
      hasBlockedItems: false,
    },
    eventSummary: {
      total: 2,
      upcomingCount: 1,
      nearestEventName: "Roadshow Musik Jakarta",
      nearestEventDate: "2026-10-01T00:00:00.000Z",
      status: "UPCOMING",
    },
    contentSummary: {
      total: 3,
      publishedCount: 2,
      inReviewCount: 1,
      latestPlatform: "INSTAGRAM",
    },
  },
  {
    id: "out-2",
    code: "BDG-002",
    name: "Outlet Dago Corner",
    type: "EXCLUSIVE",
    tier: "TIER_2",
    city: "Bandung",
    address: "Jl. Ir. H. Juanda No. 10",
    picName: "Asep Sunandar",
    picPhone: "082233445566",
    active: true,
    branch: { id: "br-2", name: "Bandung Area", code: "BDG" },
    mouSummary: {
      total: 1,
      latestStatus: "DRAFT",
      compensationValue: 5000000,
      isHealthy: false,
    },
    placementSummary: {
      total: 3,
      doneCount: 1,
      pendingCount: 2,
      totalCost: 2500000,
      hasBlockedItems: true, // Bottleneck!
    },
    eventSummary: {
      total: 1,
      upcomingCount: 0,
      nearestEventName: "Bandung Launch",
      nearestEventDate: "2026-08-10T00:00:00.000Z",
      status: "COMPLETED",
    },
    contentSummary: {
      total: 1,
      publishedCount: 1,
      inReviewCount: 0,
      latestPlatform: "TIKTOK",
    },
  },
  {
    id: "out-3",
    code: "SBY-003",
    name: "Outlet Tunjungan",
    type: "CAMPUS_OUTLET",
    tier: "TIER_3",
    city: "Surabaya",
    address: "Jl. Tunjungan No. 5",
    picName: "Siti Rahma",
    picPhone: "083344556677",
    active: false,
    branch: { id: "br-3", name: "Surabaya Hub", code: "SBY" },
    mouSummary: {
      total: 0,
      latestStatus: "NONE",
      compensationValue: 0,
      isHealthy: false,
    },
    placementSummary: {
      total: 0,
      doneCount: 0,
      pendingCount: 0,
      totalCost: 0,
      hasBlockedItems: false,
    },
    eventSummary: {
      total: 0,
      upcomingCount: 0,
    },
    contentSummary: {
      total: 0,
      publishedCount: 0,
      inReviewCount: 0,
    },
  },
];

test("calculatePipelineKPIs aggregates metrics accurately", () => {
  const kpi = calculatePipelineKPIs(mockRows);

  assert.equal(kpi.totalOutlets, 3);
  // Healthy MoU: only out-1 (1 out of 3 = 33%)
  assert.equal(kpi.healthyMouCount, 1);
  assert.equal(kpi.healthyMouPercent, 33);

  // POSM: out-1 has 4/4, out-2 has 1/3, out-3 has 0/0. Total done = 5, total = 7 (5/7 = 71%)
  assert.equal(kpi.posmDoneCount, 5);
  assert.equal(kpi.posmTotalCount, 7);
  assert.equal(kpi.posmRealizationPercent, 71);

  // Active events (upcoming) = 1, published content = 3, combined = 4
  assert.equal(kpi.activeEventsCount, 1);
  assert.equal(kpi.publishedContentCount, 3);
  assert.equal(kpi.activeEventsAndContent, 4);

  // Bottleneck count = 1 (out-2)
  assert.equal(kpi.bottleneckCount, 1);
});

test("calculatePipelineKPIs handles empty rows safely", () => {
  const kpi = calculatePipelineKPIs([]);
  assert.equal(kpi.totalOutlets, 0);
  assert.equal(kpi.healthyMouPercent, 0);
  assert.equal(kpi.posmRealizationPercent, 0);
  assert.equal(kpi.bottleneckCount, 0);
});

test("filterPipelineData filters by search, branch, tier, and bottleneck", () => {
  // 1. Search filter
  const searchName = filterPipelineData(mockRows, {
    ...DEFAULT_PIPELINE_FILTERS,
    search: "Harmoni",
  });
  assert.equal(searchName.length, 1);
  assert.equal(searchName[0].id, "out-1");

  const searchPic = filterPipelineData(mockRows, {
    ...DEFAULT_PIPELINE_FILTERS,
    search: "Asep",
  });
  assert.equal(searchPic.length, 1);
  assert.equal(searchPic[0].id, "out-2");

  // 2. Branch filter
  const branchFiltered = filterPipelineData(mockRows, {
    ...DEFAULT_PIPELINE_FILTERS,
    branchId: "br-2",
  });
  assert.equal(branchFiltered.length, 1);
  assert.equal(branchFiltered[0].id, "out-2");

  // 3. Tier filter
  const tierFiltered = filterPipelineData(mockRows, {
    ...DEFAULT_PIPELINE_FILTERS,
    tier: "TIER_3",
  });
  assert.equal(tierFiltered.length, 1);
  assert.equal(tierFiltered[0].id, "out-3");

  // 4. Bottleneck filter
  const bottleneckFiltered = filterPipelineData(mockRows, {
    ...DEFAULT_PIPELINE_FILTERS,
    bottleneckOnly: true,
  });
  assert.equal(bottleneckFiltered.length, 1);
  assert.equal(bottleneckFiltered[0].id, "out-2");
});

test("sortPipelineData sorts ascending and descending correctly", () => {
  // Sort by name asc
  const sortedNameAsc = sortPipelineData(mockRows, "name", "asc");
  assert.equal(sortedNameAsc[0].name, "Outlet Dago Corner");
  assert.equal(sortedNameAsc[2].name, "Outlet Tunjungan");

  // Sort by name desc
  const sortedNameDesc = sortPipelineData(mockRows, "name", "desc");
  assert.equal(sortedNameDesc[0].name, "Outlet Tunjungan");
  assert.equal(sortedNameDesc[2].name, "Outlet Dago Corner");

  // Sort by mou compensation desc
  const sortedMouDesc = sortPipelineData(mockRows, "mou", "desc");
  assert.equal(sortedMouDesc[0].id, "out-1"); // 12jt
  assert.equal(sortedMouDesc[1].id, "out-2"); // 5jt
  assert.equal(sortedMouDesc[2].id, "out-3"); // 0
});
