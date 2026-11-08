import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  parseActivityDisplay,
  type ParsedActivityItem,
} from "./monthlyReportExpandedRowHelpers";

describe("MonthlyReportExpandedRow & parseActivityDisplay (ADR-0035)", () => {
  describe("parseActivityDisplay pure logic", () => {
    it("handles null or undefined input gracefully", () => {
      const resNull = parseActivityDisplay(null);
      assert.strictEqual(resNull.category, "GENERAL");
      assert.strictEqual(resNull.title, "—");

      const resUndef = parseActivityDisplay(undefined);
      assert.strictEqual(resUndef.category, "GENERAL");
      assert.strictEqual(resUndef.title, "—");
    });

    it("parses string with [POSM] prefix and detail separator", () => {
      const res = parseActivityDisplay(
        "[POSM] Pemasangan Neon Box di Outlet Utama · Biaya: Rp 2.500.000"
      );
      assert.strictEqual(res.category, "POSM");
      assert.strictEqual(res.title, "Pemasangan Neon Box di Outlet Utama");
      assert.strictEqual(res.detail, "Biaya: Rp 2.500.000");
    });

    it("parses string with [MOU] prefix without detail", () => {
      const res = parseActivityDisplay("[MOU] Penandatanganan Kerjasama Mitra Baru");
      assert.strictEqual(res.category, "MOU");
      assert.strictEqual(res.title, "Penandatanganan Kerjasama Mitra Baru");
      assert.strictEqual(res.detail, undefined);
    });

    it("parses string with [KONTEN] prefix into CONTENT category", () => {
      const res = parseActivityDisplay("[KONTEN] Publikasi Reel Promo Mingguan");
      assert.strictEqual(res.category, "CONTENT");
      assert.strictEqual(res.title, "Publikasi Reel Promo Mingguan");
    });

    it("parses string with [EVENT] prefix into EVENT category", () => {
      const res = parseActivityDisplay("[EVENT] Partisipasi Expo UMKM Lokal · Stan B4");
      assert.strictEqual(res.category, "EVENT");
      assert.strictEqual(res.title, "Partisipasi Expo UMKM Lokal");
      assert.strictEqual(res.detail, "Stan B4");
    });

    it("handles object input with type and detail fields", () => {
      const item = {
        type: "PLACEMENT_INSTALLATION",
        title: "[POSM] Banner Booth Promosi",
        detail: "Selesai 100%",
      };
      const res = parseActivityDisplay(item);
      assert.strictEqual(res.category, "POSM");
      assert.strictEqual(res.title, "Banner Booth Promosi");
      assert.strictEqual(res.detail, "Selesai 100%");
    });
  });

  describe("File architecture & coordinator invariants", () => {
    const subcomponentPath = path.resolve(
      process.cwd(),
      "src/components/views/ReportsView/MonthlyReportExpandedRow.tsx"
    );
    const coordinatorPath = path.resolve(
      process.cwd(),
      "src/components/views/ReportsView/ReportsView.tsx"
    );

    it("MonthlyReportExpandedRow.tsx exists and contains 4 card section headers", () => {
      assert.strictEqual(fs.existsSync(subcomponentPath), true);
      const code = fs.readFileSync(subcomponentPath, "utf-8");

      assert.match(code, /Aktivitas Operasional/);
      assert.match(code, /Capaian Utama/);
      assert.match(code, /Kendala & Isu Lapangan/);
      assert.match(code, /Rencana Tindak Lanjut/);
      assert.match(code, /Dokumen Pendukung/);
      assert.match(code, /Layers/);
      assert.match(code, /CheckCircle2/);
      assert.match(code, /AlertTriangle/);
      assert.match(code, /ArrowUpRight/);
    });

    it("ReportsView.tsx mounts MonthlyReportExpandedRow and eliminates legacy ReportSection", () => {
      const coordCode = fs.readFileSync(coordinatorPath, "utf-8");

      assert.match(coordCode, /MonthlyReportExpandedRow/);
      assert.strictEqual(
        coordCode.includes("function ReportSection"),
        false,
        "Expected obsolete ReportSection function to be eliminated"
      );
    });

    it("verifies duplicate Cetak Dokumen Resmi and manual Tarik Data Otomatis buttons are removed and POST route upserts by period (ADR-0094)", () => {
      const expandedCode = fs.readFileSync(subcomponentPath, "utf-8");
      const coordCode = fs.readFileSync(coordinatorPath, "utf-8");
      const routePath = path.resolve(
        process.cwd(),
        "src/app/api/marcom/reports/route.ts"
      );
      const routeCode = fs.readFileSync(routePath, "utf-8");

      assert.ok(
        !expandedCode.includes("Cetak Dokumen Resmi (Save as PDF)"),
        "MonthlyReportExpandedRow must not render duplicate Cetak Dokumen Resmi (Save as PDF) button"
      );
      assert.ok(
        coordCode.includes("Export PDF") &&
          !coordCode.includes("Tarik Data Otomatis (Auto-Draft)"),
        "ReportsView must retain Export PDF button on row and remove manual Tarik Data Otomatis (Auto-Draft) button"
      );
      assert.ok(
        routeCode.includes("prisma.monthlyReport.findFirst") &&
          routeCode.includes("prisma.monthlyReport.update"),
        "POST /api/marcom/reports must check findFirst and update existing (month, year) report row"
      );
    });
  });
});
