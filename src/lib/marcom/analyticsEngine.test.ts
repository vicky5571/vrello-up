import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateMouSlaAndAging,
  calculatePosmMaterialEconomics,
  calculateContentPlatformMetrics,
  calculateEventEfficiency,
  calculateExecutiveKpis,
  buildMarcomAnalyticsDashboard,
  type MouAnalyticsInput,
  type PlacementAnalyticsInput,
  type ContentPostAnalyticsInput,
  type FieldEventAnalyticsInput,
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

  describe("POSM notStarted & Executive KPI invariants", () => {
    it("calculatePosmMaterialEconomics preserves notStarted count and totals correctly", () => {
      const placements: PlacementAnalyticsInput[] = [
        { id: "p1", status: "DONE", cost: 100000, material: { id: "m1", name: "Neon Box" } },
        { id: "p2", status: "ON_PROGRESS", cost: 100000, material: { id: "m1", name: "Neon Box" } },
        { id: "p3", status: "ISSUE", cost: 100000, material: { id: "m1", name: "Neon Box" } },
        { id: "p4", status: "NOT_STARTED", cost: 100000, material: { id: "m1", name: "Neon Box" } },
        { id: "p5", status: "NOT_STARTED", cost: 100000, material: { id: "m1", name: "Neon Box" } },
      ];

      const result = calculatePosmMaterialEconomics(placements);
      assert.equal(result.totalPlacements, 5);
      assert.equal(result.donePlacements, 1);
      assert.equal(result.inProgressPlacements, 1);
      assert.equal(result.issuePlacements, 1);
      assert.equal(result.notStartedPlacements, 2);

      const mat = result.materials[0];
      assert.equal(mat.total, 5);
      assert.equal(mat.notStarted, 2);
      assert.equal(mat.done + mat.inProgress + mat.issue + mat.notStarted, mat.total);
    });

    it("calculateExecutiveKpis handles empty datasets with neutral status rather than false-positive SLA Prima", () => {
      const emptyMou = calculateMouSlaAndAging([]);
      const emptyPosm = calculatePosmMaterialEconomics([]);
      const emptyEvent = calculateEventEfficiency([]);

      const kpis = calculateExecutiveKpis(emptyMou, emptyPosm, emptyEvent);
      assert.equal(kpis.mouSla.avgSlaDays, 0);
      assert.equal(kpis.mouSla.stuckCount, 0);
      assert.equal(kpis.mouSla.label, "Belum Ada Pengajuan");
      assert.equal(kpis.mouSla.healthStatus, "HEALTHY");
    });

    it("calculateExecutiveKpis still flags real bottlenecks when proposals exist", () => {
      const now = new Date("2026-09-30T00:00:00Z");
      const mous: MouAnalyticsInput[] = [
        { id: "m1", status: "SUBMITTED", submissionDate: "2026-09-01T00:00:00Z" }, // 29d stuck
        { id: "m2", status: "SUBMITTED", submissionDate: "2026-09-02T00:00:00Z" },
        { id: "m3", status: "SUBMITTED", submissionDate: "2026-09-03T00:00:00Z" },
        { id: "m4", status: "SUBMITTED", submissionDate: "2026-09-04T00:00:00Z" },
        { id: "m5", status: "SUBMITTED", submissionDate: "2026-09-05T00:00:00Z" },
        { id: "m6", status: "SUBMITTED", submissionDate: "2026-09-06T00:00:00Z" },
      ];

      const mouResult = calculateMouSlaAndAging(mous, now);
      const kpis = calculateExecutiveKpis(
        mouResult,
        calculatePosmMaterialEconomics([]),
        calculateEventEfficiency([])
      );
      assert.equal(kpis.mouSla.stuckCount, 6);
      assert.equal(kpis.mouSla.healthStatus, "CRITICAL");
    });

    it("calculateEventEfficiency returns projected target rates for upcoming events with 0 attendees", () => {
      const events: FieldEventAnalyticsInput[] = [
        {
          id: "e1",
          eventType: "Youth Festival",
          status: "PLANNED",
          budget: 50000000,
          targetAttendee: 1000,
          attendeeCount: 0,
        },
      ];

      const result = calculateEventEfficiency(events);
      const metric = result.eventsByType[0];
      assert.equal(metric.costPerAttendee, 0);
      assert.equal(metric.attendanceRate, 0);
      // Projected cost using target audience (fallback for upcoming events)
      assert.equal(metric.projectedCostPerAttendee, 50000);
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
      assert.ok(data.kpis.mouSla);
      assert.ok(data.kpis.posmDeployment);
      assert.ok(data.kpis.eventEfficiency);
      assert.equal("tier1Penetration" in data.kpis, false);
      assert.equal((data.kpis as unknown as Record<string, unknown>).tier1Penetration, undefined);
      assert.ok(data.mouSlaAndAging);
      assert.ok(data.posmDeployment);
      assert.ok(data.contentMetrics);
      assert.ok(data.eventEfficiency);
      assert.equal("outletTierCoverage" in data, false);
      assert.equal((data as unknown as Record<string, unknown>).outletTierCoverage, undefined);
      assert.ok(data.actionable);
      assert.equal(typeof data.actionable.costPerOutlet.avgCostPerOutlet, "number");
      assert.equal(typeof data.actionable.eventEfficiency.costPerAttendee, "number");
    });
  });
});
