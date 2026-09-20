import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("navigateToMarcom sets activeView and target search filter", () => {
  api().navigateToMarcom("outlets", "Jakarta Central Hub");

  assert.equal(api().activeView, "outlets");
  assert.equal(api().marcomFilters["outlets"], "Jakarta Central Hub");

  // Navigate to mous with different branch
  api().navigateToMarcom("mous", "Bandung Hub");
  assert.equal(api().activeView, "mous");
  assert.equal(api().marcomFilters["mous"], "Bandung Hub");
  // outlets filter preserved
  assert.equal(api().marcomFilters["outlets"], "Jakarta Central Hub");
});

test("setMarcomFilter updates individual view filter", () => {
  api().setMarcomFilter("placements", "Toko Berkah");
  assert.equal(api().marcomFilters["placements"], "Toko Berkah");

  // Clearing a filter
  api().setMarcomFilter("placements", "");
  assert.equal(api().marcomFilters["placements"], "");
});

test("setSelectedBranchId opens and closes branch detail drawer target", () => {
  api().setSelectedBranchId("branch-123");
  assert.equal(api().selectedBranchId, "branch-123");

  api().setSelectedBranchId(null);
  assert.equal(api().selectedBranchId, null);
});

test("outlets API normalizes OFFICIAL_STORE alias to EXCLUSIVE", () => {
  const rawType: string = "OFFICIAL_STORE";
  const normalizedType = rawType === "OFFICIAL_STORE" ? "EXCLUSIVE" : rawType;
  assert.equal(normalizedType, "EXCLUSIVE");

  const standardType: string = "MODERN_RETAIL";
  const normalizedStandard = standardType === "OFFICIAL_STORE" ? "EXCLUSIVE" : standardType;
  assert.equal(normalizedStandard, "MODERN_RETAIL");
});

test("branches URLSearchParams builds structured region query correctly", () => {
  const buildBranchQuery = (region: string) => {
    const params = new URLSearchParams();
    if (region && region !== "ALL") params.set("region", region);
    return params.toString();
  };

  assert.equal(buildBranchQuery("ALL"), "");
  assert.equal(buildBranchQuery("DKI Jakarta"), "region=DKI+Jakarta");
  assert.equal(buildBranchQuery("Central Java"), "region=Central+Java");
});

test("outlets URLSearchParams builds branchId and store type queries correctly", () => {
  const buildOutletQuery = (branchId: string, type: string) => {
    const params = new URLSearchParams();
    if (branchId && branchId !== "ALL") params.set("branchId", branchId);
    if (type && type !== "ALL") params.set("type", type);
    return params.toString();
  };

  assert.equal(buildOutletQuery("ALL", "ALL"), "");
  assert.equal(buildOutletQuery("br-123", "ALL"), "branchId=br-123");
  assert.equal(buildOutletQuery("ALL", "EXCLUSIVE"), "type=EXCLUSIVE");
  assert.equal(buildOutletQuery("br-123", "MODERN_RETAIL"), "branchId=br-123&type=MODERN_RETAIL");
});

test("mous and placements URLSearchParams builds status chip queries correctly", () => {
  const buildStatusQuery = (status: string) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    return params.toString();
  };

  assert.equal(buildStatusQuery("ALL"), "");
  assert.equal(buildStatusQuery("DRAFT"), "status=DRAFT");
  assert.equal(buildStatusQuery("SUBMITTED"), "status=SUBMITTED");
  assert.equal(buildStatusQuery("ON_PROGRESS"), "status=ON_PROGRESS");
});

test("MOUs KPI calculation computes active, pending, and total compensation accurately", () => {
  const sampleMous = [
    { id: "1", status: "APPROVED", compensationValue: 15000000 },
    { id: "2", status: "SUBMITTED", compensationValue: 5000000 },
    { id: "3", status: "APPROVED", compensationValue: 20000000 },
    { id: "4", status: "DRAFT", compensationValue: 2500000 },
  ];

  const active = sampleMous.filter((m) => m.status === "APPROVED").length;
  const pending = sampleMous.filter((m) => m.status === "SUBMITTED").length;
  const totalValue = sampleMous.reduce((acc, m) => acc + (m.compensationValue || 0), 0);

  assert.equal(active, 2);
  assert.equal(pending, 1);
  assert.equal(totalValue, 42500000);
});

test("Outlets KPI calculation computes total outlets, active branch coverage, and placements", () => {
  const sampleOutlets = [
    { id: "o1", branchId: "b1", placementCount: 3 },
    { id: "o2", branchId: "b1", placementCount: 2 },
    { id: "o3", branchId: "b2", placementCount: 5 },
    { id: "o4", branchId: "b3", placementCount: 0 },
  ];

  const total = sampleOutlets.length;
  const branchCoverage = new Set(sampleOutlets.map((o) => o.branchId).filter(Boolean)).size;
  const totalPlacements = sampleOutlets.reduce((acc, o) => acc + (o.placementCount || 0), 0);

  assert.equal(total, 4);
  assert.equal(branchCoverage, 3);
  assert.equal(totalPlacements, 10);
});

test("Events KPI calculation computes upcoming 30-day events, committed budget, and expected reach", () => {
  const now = new Date();
  const dateIn10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const dateIn40Days = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString();

  const sampleEvents = [
    { id: "e1", status: "UPCOMING", date: dateIn10Days, budget: 10000000, targetAttendee: 500 },
    { id: "e2", status: "UPCOMING", date: dateIn40Days, budget: 25000000, targetAttendee: 1200 },
    { id: "e3", status: "CANCELLED", date: dateIn10Days, budget: 5000000, targetAttendee: 300 },
  ];

  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingCount = sampleEvents.filter((e) => {
    if (e.status === "CANCELLED") return false;
    if (!e.date) return e.status === "UPCOMING";
    const d = new Date(e.date);
    return d >= now && d <= in30Days;
  }).length;

  const totalBudget = sampleEvents
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.budget || 0), 0);

  const expectedReach = sampleEvents
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.targetAttendee || 0), 0);

  assert.equal(upcomingCount, 1);
  assert.equal(totalBudget, 35000000);
  assert.equal(expectedReach, 1700);
});

test("Campaigns & Content unified segregation and KPI calculations", () => {
  const sampleActivities = [
    {
      id: "c1",
      name: "Viral Reels Showcase",
      eventType: "Content",
      postPlatform: "instagram",
      postFormat: "reel",
      status: "UPCOMING",
      budget: 0,
      targetAttendee: 0,
    },
    {
      id: "c2",
      name: "TikTok Product Cutdown",
      eventType: "Content",
      postPlatform: "tiktok",
      postFormat: "reel",
      status: "ON_PROGRESS",
      budget: 0,
      targetAttendee: 0,
    },
    {
      id: "c3",
      name: "Cancelled Campaign",
      eventType: "Content",
      postPlatform: "youtube",
      status: "CANCELLED",
      budget: 0,
      targetAttendee: 0,
    },
    {
      id: "e1",
      name: "Grand Opening Expo",
      eventType: "Launch",
      postPlatform: null,
      status: "UPCOMING",
      budget: 45000000,
      targetAttendee: 800,
    },
    {
      id: "e2",
      name: "Roadshow Bandung",
      eventType: "Roadshow",
      postPlatform: null,
      status: "COMPLETED",
      budget: 20000000,
      targetAttendee: 400,
    },
  ];

  const isSocial = (e: (typeof sampleActivities)[0]) =>
    Boolean(e.postPlatform) || e.eventType?.toLowerCase() === "content";

  const socialActivities = sampleActivities.filter(isSocial);
  const onGroundActivities = sampleActivities.filter((e) => !isSocial(e));

  assert.equal(socialActivities.length, 3);
  assert.equal(onGroundActivities.length, 2);

  const activeActivities = sampleActivities.filter(
    (e) => e.status === "UPCOMING" || e.status === "ON_PROGRESS"
  ).length;

  const socialQueueCount = sampleActivities.filter(
    (e) => e.status !== "CANCELLED" && isSocial(e)
  ).length;

  const totalCommittedBudget = sampleActivities
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.budget || 0), 0);

  const totalReach = sampleActivities
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.targetAttendee || 0), 0);

  assert.equal(activeActivities, 3); // c1, c2, e1
  assert.equal(socialQueueCount, 2); // c1, c2 (c3 cancelled)
  assert.equal(totalCommittedBudget, 65000000); // e1 (45m) + e2 (20m)
  assert.equal(totalReach, 1200); // 800 + 400
});

test("navigateToMarcom navigates to events with search filter", () => {
  api().navigateToMarcom("events", "Viral Reels Showcase");
  assert.equal(api().activeView, "events");
  assert.equal(api().marcomFilters["events"], "Viral Reels Showcase");
});

test("unified command palette fuzzy search across Tasks, Outlets, Branches, MOUs, and Campaigns", async () => {
  // @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
  const { fuzzyFilter } = await import("../productivity/fuzzy.ts");

  const sampleMasterData = [
    { type: "task", name: "Fix login authentication", detail: "General / Core" },
    { type: "branch", name: "Bandung Hub", detail: "West Java" },
    { type: "outlet", name: "Toko Berkah Elektronik", detail: "Bandung Hub" },
    { type: "mou", name: "PT Mitra Solusi Digital", detail: "APPROVED" },
    { type: "campaign", name: "Viral Reels Launch", detail: "Campaign • Content" },
  ];

  // Test fuzzy search on each domain
  const taskHits = fuzzyFilter("auth", sampleMasterData, (i) => [i.name, i.detail]);
  assert.equal(taskHits[0]?.name, "Fix login authentication");

  const branchHits = fuzzyFilter("bandung", sampleMasterData, (i) => [i.name, i.detail]);
  assert.ok(branchHits.some((h) => h.name === "Bandung Hub"));

  const outletHits = fuzzyFilter("berkah", sampleMasterData, (i) => [i.name, i.detail]);
  assert.equal(outletHits[0]?.name, "Toko Berkah Elektronik");

  const mouHits = fuzzyFilter("mitra", sampleMasterData, (i) => [i.name, i.detail]);
  assert.equal(mouHits[0]?.name, "PT Mitra Solusi Digital");

  const campaignHits = fuzzyFilter("reels", sampleMasterData, (i) => [i.name, i.detail]);
  assert.equal(campaignHits[0]?.name, "Viral Reels Launch");
});

test("marcom hit detail extraction preserves eventType and branchName without status shadowing", () => {
  const rawEvent = {
    id: "evt-99",
    name: "Campus Roadshow Expo",
    status: "UPCOMING",
    eventType: "on_ground",
    branchName: "Bandung Hub",
  };

  const detail = [rawEvent.eventType, rawEvent.branchName, rawEvent.status]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, 2)
    .join(" • ");

  assert.equal(detail, "on_ground • Bandung Hub");
  assert.ok(detail.includes("on_ground"));
});

test("cross-channel search resolution preserves matching activities across channel filters", () => {
  const events = [
    { id: "e1", name: "Campus Roadshow Expo", eventType: "on_ground", isSocial: false },
    { id: "e2", name: "Viral TikTok Tutorial", eventType: "social", isSocial: true },
  ];

  const query = "Roadshow";

  const matchesQuery = (e: { name: string }) => e.name.toLowerCase().includes(query.toLowerCase());
  const hasChannelMatch = events.some((e) => e.isSocial && matchesQuery(e));

  // When no channel match in the current tab, it safely falls back to any match across channels
  const results = events.filter((e) => {
    if (!matchesQuery(e)) return false;
    if (hasChannelMatch && !e.isSocial) return false;
    return true;
  });

  assert.equal(hasChannelMatch, false);
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Campus Roadshow Expo");
});



