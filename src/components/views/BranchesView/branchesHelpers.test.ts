import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateBranchKpis,
  getBranchProgressColor,
  getBranchStatusBadge,
} from "./branchesHelpers";
import type { MarcomBranch } from "@/types";

describe("branchesHelpers", () => {
  const sampleBranches: MarcomBranch[] = [
    {
      id: "br-1",
      code: "BR-JKT-01",
      name: "Jakarta Hub",
      region: "DKI Jakarta",
      city: "Jakarta",
      status: "DONE",
      picName: "Budi",
      picPhone: "0812",
      address: "Jl. Sudirman",
      outletCount: 120,
      mouCount: 15,
      progress: 100,
    },
    {
      id: "br-2",
      code: "BR-SBY-01",
      name: "Surabaya Hub",
      region: "East Java",
      city: "Surabaya",
      status: "ON_PROGRESS",
      picName: "Siti",
      picPhone: "0813",
      address: "Jl. Basuki",
      outletCount: 80,
      mouCount: 5,
      progress: 60,
    },
    {
      id: "br-3",
      code: "BR-BDG-01",
      name: "Bandung Hub",
      region: "West Java",
      city: "Bandung",
      status: "PENDING",
      picName: "Agus",
      picPhone: "0814",
      address: "Jl. Asia Afrika",
      outletCount: 0,
      mouCount: 0,
      progress: 0,
    },
  ];

  describe("calculateBranchKpis", () => {
    it("returns correct aggregate KPIs for populated branches", () => {
      const kpis = calculateBranchKpis(sampleBranches);
      assert.equal(kpis.length, 4);

      // Total Branches
      assert.equal(kpis[0].value, 3);
      assert.match(kpis[0].helper || "", /Active/);

      // Outlets Network (120 + 80 + 0 = 200)
      assert.equal(kpis[1].value, 200);

      // Active Partnerships (15 + 5 + 0 = 20)
      assert.equal(kpis[2].value, 20);

      // Avg Progress ((100 + 60 + 0) / 3 = 53%)
      assert.equal(kpis[3].value, "53%");
    });

    it("handles empty branch list gracefully without division by zero", () => {
      const kpis = calculateBranchKpis([]);
      assert.equal(kpis.length, 4);
      assert.equal(kpis[0].value, 0);
      assert.equal(kpis[1].value, 0);
      assert.equal(kpis[2].value, 0);
      assert.equal(kpis[3].value, "0%");
    });

    it("handles branches with missing numeric values safely", () => {
      const incomplete: MarcomBranch[] = [
        {
          id: "br-x",
          code: "BR-X",
          name: "Unknown Hub",
          region: "Central Java",
          city: "Solo",
          picName: "",
          picPhone: "",
          address: "",
        },
      ];
      const kpis = calculateBranchKpis(incomplete);
      assert.equal(kpis[0].value, 1);
      assert.equal(kpis[1].value, 0);
      assert.equal(kpis[2].value, 0);
      assert.equal(kpis[3].value, "0%");
    });
  });

  describe("getBranchProgressColor", () => {
    it("returns emerald for 100%", () => {
      const colors = getBranchProgressColor(100);
      assert.match(colors.barClass, /bg-emerald-500/);
      assert.match(colors.textClass, /text-emerald-600/);
    });

    it("returns cyan for 50-99%", () => {
      const colors = getBranchProgressColor(75);
      assert.match(colors.barClass, /bg-cyan-500/);
      assert.match(colors.textClass, /text-cyan-600/);
    });

    it("returns amber for 1-49%", () => {
      const colors = getBranchProgressColor(30);
      assert.match(colors.barClass, /bg-amber-500/);
      assert.match(colors.textClass, /text-amber-600/);
    });

    it("returns slate for 0 or null", () => {
      const colorsZero = getBranchProgressColor(0);
      assert.match(colorsZero.barClass, /bg-slate-300/);
      const colorsNull = getBranchProgressColor(null);
      assert.match(colorsNull.barClass, /bg-slate-300/);
    });
  });

  describe("getBranchStatusBadge", () => {
    it("returns correct badge config for DONE", () => {
      const badge = getBranchStatusBadge("DONE");
      assert.equal(badge.label, "Done");
      assert.match(badge.badgeClass, /text-emerald-600/);
    });

    it("returns correct badge config for ON_PROGRESS", () => {
      const badge = getBranchStatusBadge("ON_PROGRESS");
      assert.equal(badge.label, "In Progress");
      assert.match(badge.badgeClass, /text-amber-600/);
    });

    it("returns correct badge config for PENDING or undefined", () => {
      const badge = getBranchStatusBadge("PENDING");
      assert.equal(badge.label, "Pending");
      assert.match(badge.badgeClass, /text-slate-500/);

      const badgeDefault = getBranchStatusBadge(undefined);
      assert.equal(badgeDefault.label, "Pending");
    });
  });
});
