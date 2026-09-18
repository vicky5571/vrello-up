import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateMouSlaAndAging,
  calculatePosmMaterialEconomics,
  calculateContentPlatformMetrics,
  calculateEventEfficiency,
  calculateOutletTierCoverage,
  calculateExecutiveKpis,
  buildMarcomAnalyticsDashboard,
  type MouAnalyticsInput,
  type PlacementAnalyticsInput,
  type ContentPostAnalyticsInput,
  type FieldEventAnalyticsInput,
  type OutletAnalyticsInput,
} from "@/lib/marcom/analyticsEngine";

describe("analyticsEngine", () => {
  describe("calculateMouSlaAndAging", () => {
    it("handles empty MOU list gracefully with zeros", () => {
      const result = calculateMouSlaAndAging([]);
      assert.equal(result.totalMous, 0);
      assert.equal(result.submittedCount, 0);
      assert.equal(result.avgSlaDays, 0);
      assert.equal(result.stuckCount, 0);
      assert.equal(result.agingBuckets.length, 3);
      assert.equal(result.agingBuckets[0].count, 0);
    });

    it("calculates average SLA turnaround for APPROVED and DONE MOUs", () => {
      const mous: MouAnalyticsInput[] = [
        {
          id: "mou-1",
          status: "APPROVED",
          submissionDate: "2026-09-01T00:00:00Z",
          startDate: "2026-09-05T00:00:00Z", // 4 days
        },
        {
          id: "mou-2",
          status: "DONE",
          submissionDate: "2026-09-01T00:00:00Z",
          startDate: "2026-09-11T00:00:00Z", // 10 days
        },
        {
          id: "mou-3",
          status: "DRAFT",
          submissionDate: null,
        },
      ];

      const result = calculateMouSlaAndAging(mous);
      assert.equal(result.totalMous, 3);
      assert.equal(result.approvedOrDoneCount, 2);
      // Average: (4 + 10) / 2 = 7 days
      assert.equal(result.avgSlaDays, 7);
    });

    it("categorizes SUBMITTED MOUs into aging buckets correctly", () => {
      const now = new Date("2026-09-20T00:00:00Z");
      const mous: MouAnalyticsInput[] = [
        {
          id: "mou-fresh",
          status: "SUBMITTED",
          submissionDate: "2026-09-18T00:00:00Z", // 2 days old -> <7d
        },
        {
          id: "mou-mid",
          status: "SUBMITTED",
          submissionDate: "2026-09-10T00:00:00Z", // 10 days old -> 7-14d
        },
        {
          id: "mou-stuck",
          status: "SUBMITTED",
          submissionDate: "2026-09-01T00:00:00Z", // 19 days old -> >14d
        },
      ];

      const result = calculateMouSlaAndAging(mous, now);
      assert.equal(result.submittedCount, 3);
      assert.equal(result.stuckCount, 1);

      const under7 = result.agingBuckets.find((b) => b.bucket === "under_7");
      const mid = result.agingBuckets.find((b) => b.bucket === "7_to_14");
      const over14 = result.agingBuckets.find((b) => b.bucket === "over_14");

      assert.equal(under7?.count, 1);
      assert.equal(mid?.count, 1);
      assert.equal(over14?.count, 1);
    });
  });

  describe("calculatePosmMaterialEconomics", () => {
    it("handles empty placements without division by zero", () => {
      const result = calculatePosmMaterialEconomics([]);
      assert.equal(result.totalPlacements, 0);
      assert.equal(result.donePlacements, 0);
      assert.equal(result.deploymentRate, 0);
      assert.equal(result.totalInvestment, 0);
      assert.equal(result.materials.length, 0);
    });

    it("aggregates material done rate and unit economics correctly", () => {
      const placements: PlacementAnalyticsInput[] = [
        {
          id: "p1",
          status: "DONE",
          cost: 2500000,
          material: { id: "m1", name: "Signboard" },
        },
        {
          id: "p2",
          status: "DONE",
          cost: 3500000,
          material: { id: "m1", name: "Signboard" },
        },
        {
          id: "p3",
          status: "ON_PROGRESS",
          cost: 3000000,
          material: { id: "m1", name: "Signboard" },
        },
        {
          id: "p4",
          status: "DONE",
          cost: 500000,
          material: { id: "m2", name: "Banner" },
        },
      ];

      const result = calculatePosmMaterialEconomics(placements);
      assert.equal(result.totalPlacements, 4);
      assert.equal(result.donePlacements, 3);
      assert.equal(result.inProgressPlacements, 1);
      assert.equal(result.deploymentRate, 75); // 3 of 4 = 75%
      assert.equal(result.totalInvestment, 9500000);

      const signboard = result.materials.find((m) => m.materialName === "Signboard");
      assert.ok(signboard);
      assert.equal(signboard.total, 3);
      assert.equal(signboard.done, 2);
      assert.equal(signboard.doneRate, 67); // 2/3 = 67%
      assert.equal(signboard.totalCost, 9000000);
      assert.equal(signboard.avgCost, 3000000); // 9000000 / 3
    });
  });

  describe("calculateContentPlatformMetrics", () => {
    it("handles empty content posts", () => {
      const result = calculateContentPlatformMetrics([]);
      assert.equal(result.totalPosts, 0);
      assert.equal(result.publishedPosts, 0);
      assert.equal(result.overallPublishedRate, 0);
      assert.equal(result.platforms.length, 0);
    });

    it("groups content by platform and computes published rate", () => {
      const posts: ContentPostAnalyticsInput[] = [
        { id: "c1", platform: "instagram", status: "PUBLISHED" },
        { id: "c2", platform: "Instagram", status: "SCHEDULED" },
        { id: "c3", platform: "tiktok", status: "PUBLISHED" },
      ];

      const result = calculateContentPlatformMetrics(posts);
      assert.equal(result.totalPosts, 3);
      assert.equal(result.publishedPosts, 2);
      assert.equal(result.overallPublishedRate, 67);

      const ig = result.platforms.find((p) => p.platform === "Instagram");
      assert.ok(ig);
      assert.equal(ig.total, 2);
      assert.equal(ig.published, 1);
      assert.equal(ig.scheduled, 1);
      assert.equal(ig.publishedRate, 50);

      const tt = result.platforms.find((p) => p.platform === "TikTok");
      assert.ok(tt);
      assert.equal(tt.total, 1);
      assert.equal(tt.published, 1);
      assert.equal(tt.publishedRate, 100);
    });
  });

  describe("calculateEventEfficiency", () => {
    it("handles empty events safely", () => {
      const result = calculateEventEfficiency([]);
      assert.equal(result.totalEvents, 0);
      assert.equal(result.totalBudget, 0);
      assert.equal(result.totalAttendees, 0);
      assert.equal(result.avgCostPerAttendee, 0);
    });

    it("calculates cost per attendee and target attendance rate", () => {
      const events: FieldEventAnalyticsInput[] = [
        {
          id: "e1",
          eventType: "Campus Roadshow",
          status: "COMPLETED",
          budget: 10000000,
          targetAttendee: 1000,
          attendeeCount: 1250,
        },
        {
          id: "e2",
          eventType: "Campus Roadshow",
          status: "COMPLETED",
          budget: 20000000,
          targetAttendee: 2000,
          attendeeCount: 1750,
        },
        {
          id: "e3",
          eventType: "Car Free Day",
          status: "COMPLETED",
          budget: 5000000,
          targetAttendee: 500,
          attendeeCount: 500,
        },
      ];

      const result = calculateEventEfficiency(events);
      assert.equal(result.totalEvents, 3);
      assert.equal(result.totalBudget, 35000000);
      assert.equal(result.totalAttendees, 3500);
      // Overall avg cost: 35,000,000 / 3,500 = 10,000
      assert.equal(result.avgCostPerAttendee, 10000);

      const campus = result.eventsByType.find((e) => e.eventType === "Campus Roadshow");
      assert.ok(campus);
      assert.equal(campus.totalBudget, 30000000);
      assert.equal(campus.totalAttendees, 3000);
      assert.equal(campus.costPerAttendee, 10000);
      assert.equal(campus.attendanceRate, 100); // 3000 / 3000 = 100%
    });
  });

  describe("calculateOutletTierCoverage", () => {
    it("determines outlet penetration rate accurately across tiers", () => {
      const outlets: OutletAnalyticsInput[] = [
        { id: "o1", tier: "TIER_1", name: "Outlet 1" },
        { id: "o2", tier: "TIER_1", name: "Outlet 2" },
        { id: "o3", tier: "TIER_2", name: "Outlet 3" },
        { id: "o4", tier: "TIER_3", name: "Outlet 4" },
      ];

      const placements: PlacementAnalyticsInput[] = [
        { id: "p1", outletId: "o1", status: "DONE" },
        { id: "p2", outletId: "o2", status: "ON_PROGRESS" },
        { id: "p3", outletId: "o3", status: "DONE" },
      ];

      const result = calculateOutletTierCoverage(outlets, placements);
      assert.equal(result.totalOutlets, 4);

      const tier1 = result.tiers.find((t) => t.tier === "TIER_1");
      assert.ok(tier1);
      assert.equal(tier1.totalOutlets, 2);
      assert.equal(tier1.brandedOutlets, 1);
      assert.equal(tier1.inProgressOutlets, 1);
      assert.equal(tier1.unbrandedOutlets, 0);
      assert.equal(tier1.penetrationRate, 50); // 1 of 2 = 50%
      assert.equal(result.tier1PenetrationRate, 50);

      const tier3 = result.tiers.find((t) => t.tier === "TIER_3");
      assert.ok(tier3);
      assert.equal(tier3.totalOutlets, 1);
      assert.equal(tier3.brandedOutlets, 0);
      assert.equal(tier3.unbrandedOutlets, 1);
      assert.equal(tier3.penetrationRate, 0);
    });
  });

  describe("buildMarcomAnalyticsDashboard", () => {
    it("builds the complete aggregate dashboard structure without error", () => {
      const data = buildMarcomAnalyticsDashboard({
        mous: [],
        placements: [],
        contents: [],
        events: [],
        outlets: [],
      });

      assert.ok(data.kpis);
      assert.ok(data.mouSlaAndAging);
      assert.ok(data.posmDeployment);
      assert.ok(data.contentMetrics);
      assert.ok(data.eventEfficiency);
      assert.ok(data.outletTierCoverage);
    });
  });
});
