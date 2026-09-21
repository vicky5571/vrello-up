import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatQuarterlyPosmCsv } from "@/components/views/ReportsView/quarterlyPosmReportHelpers";
import type { PosmQuarterlyMatrix, PosmBranchBreakdown } from "@/types";

describe("quarterlyPosmReportHelpers", () => {
  it("generates structured CSV containing branch breakdown and 2D matrix", () => {
    const mockMatrix: PosmQuarterlyMatrix = {
      quarter: "Q3 2026",
      materials: [
        { id: "mat-1", name: "Poster" },
        { id: "mat-2", name: "Shop Blind" },
      ],
      rows: [
        {
          theme: "Product Hero",
          cells: {
            "mat-1": { materialId: "mat-1", materialName: "Poster", actual: 100, target: 120, percentage: 83 },
            "mat-2": { materialId: "mat-2", materialName: "Shop Blind", actual: 50, target: 50, percentage: 100 },
          },
          totalActual: 150,
          totalTarget: 170,
          totalPercentage: 88,
        },
      ],
      columnTotals: {
        "mat-1": { actual: 100, target: 120, percentage: 83 },
        "mat-2": { actual: 50, target: 50, percentage: 100 },
      },
      grandTotalActual: 150,
      grandTotalTarget: 170,
      grandTotalPercentage: 88,
    };

    const mockBreakdown: PosmBranchBreakdown[] = [
      {
        branchId: "br-smg",
        branchName: "Semarang",
        totalPlacements: 100,
        targetPlacements: 100,
        percentage: 100,
        validGpsCount: 98,
        gpsIntegrityRate: 98,
        topTheme: "Product Hero",
      },
    ];

    const csv = formatQuarterlyPosmCsv("Q3 2026", mockBreakdown, mockMatrix);

    assert.ok(csv.includes("LAPORAN REKAPITULASI POSM KUARTAL Q3 2026"));
    assert.ok(csv.includes('"Semarang",100,100,100%,98%,Product Hero'));
    assert.ok(csv.includes("Product Hero"));
    assert.ok(csv.includes("TOTAL REALISASI"));
  });
});
