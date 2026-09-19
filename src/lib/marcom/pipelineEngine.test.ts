import test from "node:test";
import assert from "node:assert/strict";
import { buildOutletPipelineRows } from "@/lib/marcom/pipelineEngine";

test("pipelineEngine: transforms outlet with approved MoU, completed placements, event and content", () => {
  const outlets = [
    {
      id: "outlet-1",
      code: "OUT-001",
      name: "Toko Berkah",
      type: "MODERN_RETAIL",
      tier: "TIER_1",
      city: "Semarang",
      address: "Jl. Pemuda 10",
      picName: "Budi",
      picPhone: "08123456789",
      active: true,
      branchId: "branch-1",
      branch: { id: "branch-1", name: "Semarang", code: "SMG" },
      mous: [
        { id: "mou-1", status: "APPROVED", compensationValue: 12000000, outletId: "outlet-1" },
      ],
      placements: [
        { id: "plc-1", status: "DONE", cost: 2500000, material: { name: "Signboard", type: "PERMANENT" } },
        { id: "plc-2", status: "DONE", cost: 1500000, material: { name: "Neon Box", type: "PERMANENT" } },
      ],
    },
  ];

  const events = [
    {
      id: "evt-1",
      name: "Semarang Expo",
      branchName: "Semarang",
      location: "Toko Berkah",
      startDate: new Date("2026-10-15").toISOString(),
      status: "UPCOMING",
    },
  ];

  const contents = [
    {
      id: "cnt-1",
      title: "Reel Promo Berkah",
      branchName: "Semarang",
      platform: "instagram",
      status: "PUBLISHED",
      publishDate: new Date("2026-10-01").toISOString(),
    },
  ];

  const result = buildOutletPipelineRows(outlets, events, contents);
  assert.equal(result.length, 1);
  const row = result[0];
  assert.equal(row.id, "outlet-1");
  assert.equal(row.mouSummary.latestStatus, "APPROVED");
  assert.equal(row.mouSummary.isHealthy, true);
  assert.equal(row.placementSummary.total, 2);
  assert.equal(row.placementSummary.doneCount, 2);
  assert.equal(row.placementSummary.hasBlockedItems, false);
  assert.equal(row.eventSummary.total, 1);
  assert.equal(row.eventSummary.nearestEventName, "Semarang Expo");
  assert.equal(row.contentSummary.publishedCount, 1);
});

test("pipelineEngine: detects bottleneck when permanent placement lacks approved MoU", () => {
  const outlets = [
    {
      id: "outlet-2",
      code: "OUT-002",
      name: "Minimarket Surya",
      type: "TRADITIONAL",
      tier: "TIER_2",
      city: "Solo",
      address: "Jl. Slamet Riyadi",
      picName: "Agus",
      picPhone: "08987654321",
      active: true,
      branchId: "branch-2",
      branch: { id: "branch-2", name: "Solo", code: "SLO" },
      mous: [
        { id: "mou-2", status: "SUBMITTED", compensationValue: 5000000, outletId: "outlet-2" },
      ],
      placements: [
        { id: "plc-3", status: "PENDING", cost: 3000000, material: { name: "Shopblind", type: "PERMANENT" } },
      ],
    },
  ];

  const result = buildOutletPipelineRows(outlets, [], []);
  assert.equal(result.length, 1);
  const row = result[0];
  assert.equal(row.mouSummary.latestStatus, "SUBMITTED");
  assert.equal(row.mouSummary.isHealthy, false);
  assert.equal(row.placementSummary.hasBlockedItems, true);
});

test("pipelineEngine: handles empty state for outlet with zero relations", () => {
  const outlets = [
    {
      id: "outlet-3",
      code: "OUT-003",
      name: "Outlet Kosong",
      type: "TRADITIONAL",
      tier: "TIER_3",
      city: "Yogyakarta",
      address: "Jl. Malioboro",
      picName: "Siti",
      picPhone: "081111111",
      active: true,
      branchId: "branch-3",
      branch: { id: "branch-3", name: "Yogyakarta", code: "YOG" },
      mous: [],
      placements: [],
    },
  ];

  const result = buildOutletPipelineRows(outlets, [], []);
  assert.equal(result.length, 1);
  const row = result[0];
  assert.equal(row.id, "outlet-3");
  assert.equal(row.mouSummary.total, 0);
  assert.equal(row.mouSummary.latestStatus, "NONE");
  assert.equal(row.mouSummary.compensationValue, 0);
  assert.equal(row.mouSummary.isHealthy, false);
  assert.equal(row.placementSummary.total, 0);
  assert.equal(row.placementSummary.doneCount, 0);
  assert.equal(row.placementSummary.pendingCount, 0);
  assert.equal(row.placementSummary.totalCost, 0);
  assert.equal(row.placementSummary.hasBlockedItems, false);
  assert.equal(row.eventSummary.total, 0);
  assert.equal(row.eventSummary.upcomingCount, 0);
  assert.equal(row.eventSummary.nearestEventName, undefined);
  assert.equal(row.contentSummary.total, 0);
  assert.equal(row.contentSummary.publishedCount, 0);
  assert.equal(row.contentSummary.inReviewCount, 0);
  assert.equal(row.contentSummary.latestPlatform, undefined);
});

test("pipelineEngine: aggregates branch-level events and contents across multiple outlets in the branch", () => {
  const outlets = [
    {
      id: "outlet-a",
      code: "OUT-A",
      name: "Toko A",
      branchId: "branch-smg",
      branch: { id: "branch-smg", name: "Semarang", code: "SMG" },
      city: "Semarang",
    },
    {
      id: "outlet-b",
      code: "OUT-B",
      name: "Toko B",
      branchId: "branch-slo",
      branch: { id: "branch-slo", name: "Solo", code: "SLO" },
      city: "Solo",
    },
  ];

  const events = [
    {
      id: "evt-smg",
      name: "Semarang Fest",
      branchName: "Semarang",
      status: "UPCOMING",
      startDate: "2026-11-01T00:00:00Z",
    },
  ];

  const contents = [
    {
      id: "cnt-smg-1",
      title: "Reel Semarang 1",
      branchName: "Semarang",
      platform: "instagram",
      status: "PUBLISHED",
      publishDate: "2026-10-01T00:00:00Z",
    },
    {
      id: "cnt-smg-2",
      title: "TikTok Semarang 2",
      branchName: "Semarang",
      platform: "tiktok",
      status: "IN_REVIEW",
      publishDate: "2026-10-05T00:00:00Z",
    },
  ];

  const result = buildOutletPipelineRows(outlets, events, contents);
  assert.equal(result.length, 2);

  // Outlet A in Semarang should have 1 event and 2 contents
  const rowA = result.find((r) => r.id === "outlet-a")!;
  assert.equal(rowA.eventSummary.total, 1);
  assert.equal(rowA.eventSummary.nearestEventName, "Semarang Fest");
  assert.equal(rowA.contentSummary.total, 2);
  assert.equal(rowA.contentSummary.publishedCount, 1);
  assert.equal(rowA.contentSummary.inReviewCount, 1);

  // Outlet B in Solo should have 0 events and 0 contents
  const rowB = result.find((r) => r.id === "outlet-b")!;
  assert.equal(rowB.eventSummary.total, 0);
  assert.equal(rowB.contentSummary.total, 0);
});

test("pipelineEngine: handles invalid date string in events without throwing RangeError", () => {
  const outlets = [
    {
      id: "outlet-inv-date",
      name: "Toko Tangguh",
      branch: { id: "b1", name: "Malang", code: "MLG" },
      branchId: "b1",
    },
  ];
  const events = [
    {
      id: "evt-inv",
      name: "Event TBD",
      branchName: "Malang",
      startDate: "invalid-date-string",
      status: "UPCOMING",
    },
  ];

  // Must not throw RangeError: Invalid time value
  const result = buildOutletPipelineRows(outlets, events, []);
  assert.equal(result.length, 1);
  assert.equal(result[0].eventSummary.total, 1);
  assert.equal(result[0].eventSummary.nearestEventName, "Event TBD");
  assert.equal(result[0].eventSummary.nearestEventDate, undefined);
});

test("pipelineEngine: completed permanent placement (status: DONE) does not trigger bottleneck even without approved MoU", () => {
  const outlets = [
    {
      id: "outlet-done-perm",
      name: "Toko Selesai",
      branch: { id: "b2", name: "Kediri", code: "KDR" },
      branchId: "b2",
      mous: [
        { id: "mou-draft", status: "DRAFT", compensationValue: 0 },
      ],
      placements: [
        { id: "p1", status: "DONE", cost: 1000000, material: { name: "Neon Box", type: "PERMANENT" } },
      ],
    },
  ];

  const result = buildOutletPipelineRows(outlets, [], []);
  assert.equal(result.length, 1);
  const row = result[0];
  assert.equal(row.mouSummary.isHealthy, false);
  assert.equal(row.placementSummary.doneCount, 1);
  // Completed item is NOT blocked
  assert.equal(row.placementSummary.hasBlockedItems, false);
});

test("pipelineEngine: stably prioritizes items with timestamps before items without timestamps", () => {
  const outlets = [
    {
      id: "outlet-sort",
      name: "Toko Sort",
      branch: { id: "b3", name: "Surabaya", code: "SBY" },
      branchId: "b3",
      mous: [
        { id: "mou-no-date", status: "DRAFT" }, // no timestamp
        { id: "mou-with-date", status: "APPROVED", startDate: "2026-05-01T00:00:00Z" },
      ],
    },
  ];
  const contents = [
    { id: "c-no-date", title: "Promo", branchName: "Surabaya", platform: "tiktok" }, // no timestamp
    { id: "c-with-date", title: "Promo Reel", branchName: "Surabaya", platform: "instagram", publishDate: "2026-06-01T00:00:00Z" },
  ];

  const result = buildOutletPipelineRows(outlets, [], contents);
  assert.equal(result.length, 1);
  const row = result[0];
  // Latest MoU is the one with date (APPROVED)
  assert.equal(row.mouSummary.latestStatus, "APPROVED");
  assert.equal(row.mouSummary.isHealthy, true);
  // Latest platform is the one with date (instagram)
  assert.equal(row.contentSummary.latestPlatform, "instagram");
});

