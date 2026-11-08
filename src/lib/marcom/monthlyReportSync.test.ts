import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  enumerateReportPeriods,
  hasCustomNarratives,
  resolvePreviousMonthPeriod,
  syncMonthlyReport,
} from "./monthlyReportSync";

describe("monthlyReportSync domain engine (ADR-0036)", () => {
  describe("enumerateReportPeriods helper (ADR-0095)", () => {
    it("returns single period when start and end are identical", () => {
      const periods = enumerateReportPeriods("November", 2026, "November", 2026);
      assert.deepStrictEqual(periods, [{ month: "November", year: 2026 }]);
    });

    it("returns chronologically ordered periods within same year", () => {
      const periods = enumerateReportPeriods("August", 2026, "October", 2026);
      assert.deepStrictEqual(periods, [
        { month: "August", year: 2026 },
        { month: "September", year: 2026 },
        { month: "October", year: 2026 },
      ]);
    });

    it("returns chronologically ordered periods across year boundary", () => {
      const periods = enumerateReportPeriods("November", 2025, "February", 2026);
      assert.deepStrictEqual(periods, [
        { month: "November", year: 2025 },
        { month: "December", year: 2025 },
        { month: "January", year: 2026 },
        { month: "February", year: 2026 },
      ]);
    });

    it("returns empty array when start is after end", () => {
      const periods = enumerateReportPeriods("November", 2026, "August", 2026);
      assert.deepStrictEqual(periods, []);
    });
  });

  describe("resolvePreviousMonthPeriod helper (ADR-0094)", () => {
    it("resolves previous month within the same year (e.g. 1 December 2026 -> November 2026)", () => {
      const res = resolvePreviousMonthPeriod(new Date(2026, 11, 1));
      assert.deepStrictEqual(res, { month: "November", year: 2026 });
    });

    it("resolves previous month across year boundary (e.g. 1 January 2027 -> December 2026)", () => {
      const res = resolvePreviousMonthPeriod(new Date(2027, 0, 1));
      assert.deepStrictEqual(res, { month: "December", year: 2026 });
    });
  });

  describe("hasCustomNarratives helper", () => {
    it("returns false for non-array, null, or empty array", () => {
      assert.strictEqual(hasCustomNarratives(null, ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives(undefined, ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives([], ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives("not-array", ["A", "B"]), false);
    });

    it("returns false when existing narratives match default synthesized bullets exactly", () => {
      const defaults = [
        "Distribusi POSM: Sebanyak 5 titik penempatan materi dalam persiapan operasional.",
        "Publikasi Konten: 2 postingan telah tayang di kanal digital resmi.",
      ];
      assert.strictEqual(hasCustomNarratives([...defaults], defaults), false);
    });

    it("returns true when item count differs from default synthesized bullets", () => {
      const defaults = ["Bullet 1", "Bullet 2"];
      const existing = ["Bullet 1", "Bullet 2", "Extra note by admin"];
      assert.strictEqual(hasCustomNarratives(existing, defaults), true);
    });

    it("returns true when any bullet text has been modified by an admin", () => {
      const defaults = ["Default synthesized text", "Second point"];
      const existing = ["Customized text edited by operational head", "Second point"];
      assert.strictEqual(hasCustomNarratives(existing, defaults), true);
    });
  });

  describe("syncMonthlyReport execution", () => {
    it("creates new monthly report on start-of-month kickoff when report does not exist", async () => {
      let createdData: Record<string, unknown> | null = null;

      const mockPrisma = {
        placement: { findMany: async () => [] },
        mou: { findMany: async () => [] },
        contentPost: { findMany: async () => [] },
        fieldEvent: { findMany: async () => [] },
        monthlyReport: {
          findFirst: async () => null,
          create: async ({ data }: { data: Record<string, unknown> }) => {
            createdData = data;
            return { id: "rep-new-123", ...data };
          },
        },
      };

      const result = await syncMonthlyReport({
        month: "November",
        year: 2026,
        prismaClient: mockPrisma,
      });

      assert.strictEqual(result.action, "created");
      assert.strictEqual(result.reportId, "rep-new-123");
      assert.strictEqual(result.month, "November");
      assert.strictEqual(result.year, 2026);
      assert.strictEqual(result.preservedCustomNarratives, false);
      assert.ok(createdData);
      assert.strictEqual(createdData.month, "November");
      assert.strictEqual(createdData.year, 2026);
      assert.ok(Array.isArray(createdData.activities));
    });

    it("updates existing monthly report while strictly preserving user-authored custom narratives", async () => {
      let updatedData: Record<string, unknown> | null = null;

      const existingReport = {
        id: "rep-existing-456",
        month: "November",
        year: 2026,
        summary: { totalActivities: 0, completionRate: 0 },
        activities: [],
        achievements: ["Custom manual achievement documented by Marcom Lead"],
        keyIssues: ["Kendala suplai material di depo utama"],
        actionPlans: ["Eskalasi pengiriman batch 2 minggu depan"],
      };

      const mockPrisma = {
        placement: {
          findMany: async () => [
            {
              id: "plc-1",
              date: new Date("2026-11-10"),
              outlet: { name: "Outlet Beta", code: "OUT-02" },
              material: { name: "Neon Box", type: "STORE_SIGN", requiresMou: true },
              status: "DONE",
              cost: 1500000,
            },
          ],
        },
        mou: { findMany: async () => [] },
        contentPost: { findMany: async () => [] },
        fieldEvent: { findMany: async () => [] },
        monthlyReport: {
          findFirst: async () => existingReport,
          update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            updatedData = data;
            return { id: where.id, ...data };
          },
        },
      };

      const result = await syncMonthlyReport({
        month: "November",
        year: 2026,
        prismaClient: mockPrisma,
      });

      assert.strictEqual(result.action, "updated");
      assert.strictEqual(result.reportId, "rep-existing-456");
      assert.strictEqual(result.preservedCustomNarratives, true);
      assert.ok(updatedData);

      // Verify activities and summary refreshed with operational data
      assert.strictEqual(updatedData.activities.length, 1);
      assert.strictEqual(updatedData.summary.totalActivities, 1);

      // Verify custom narratives were NOT overwritten with default synthesis
      assert.deepStrictEqual(
        updatedData.achievements,
        existingReport.achievements
      );
      assert.deepStrictEqual(
        updatedData.keyIssues,
        existingReport.keyIssues
      );
      assert.deepStrictEqual(
        updatedData.actionPlans,
        existingReport.actionPlans
      );
    });
  });
});

