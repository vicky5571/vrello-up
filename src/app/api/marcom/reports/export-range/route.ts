import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  enumerateReportPeriods,
  syncMonthlyReport,
} from "@/lib/marcom/monthlyReportSync";
import { MONTH_OPTIONS } from "@/lib/marcom/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { startMonth, startYear, endMonth, endYear } = body ?? {};

    const periods = enumerateReportPeriods(
      String(startMonth || ""),
      Number(startYear),
      String(endMonth || ""),
      Number(endYear),
    );

    if (periods.length === 0) {
      return NextResponse.json(
        { error: "Periode awal tidak boleh melebihi periode akhir atau format tidak valid" },
        { status: 400 },
      );
    }

    if (periods.length > 12) {
      return NextResponse.json(
        { error: "Rentang ekspor maksimal 12 bulan" },
        { status: 400 },
      );
    }

    // 1. Always auto-sync/update current calendar month
    const now = new Date();
    const currentMonth = MONTH_OPTIONS[now.getMonth()];
    const currentYear = now.getFullYear();
    await syncMonthlyReport({ month: currentMonth, year: currentYear });

    // 2. Perilaku A: Auto-sync any period in range that is missing in database
    // ponytail: ADR-0095 Perilaku A — auto-sync missing months in range. Switch to Perilaku B (skip syncMonthlyReport for non-current missing months) if historical gaps should remain unsaved.
    const resolvedReports = [];
    for (const p of periods) {
      let row = await prisma.monthlyReport.findFirst({
        where: {
          month: { equals: p.month, mode: "insensitive" },
          year: p.year,
        },
      });

      if (!row) {
        await syncMonthlyReport({ month: p.month, year: p.year });
        row = await prisma.monthlyReport.findFirst({
          where: {
            month: { equals: p.month, mode: "insensitive" },
            year: p.year,
          },
        });
      }

      if (row) {
        resolvedReports.push(row);
      }
    }

    return NextResponse.json({
      ok: true,
      count: resolvedReports.length,
      reports: resolvedReports,
    });
  } catch (error) {
    console.error("POST /api/marcom/reports/export-range error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memproses ekspor rentang laporan" },
      { status: 500 },
    );
  }
}
