import { NextResponse } from "next/server";
import { syncMonthlyReport } from "@/lib/marcom/monthlyReportSync";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, enforce CRON_SECRET authorization header
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized cron execution" },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;

    const result = await syncMonthlyReport({ month, year });

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("GET /api/cron/reports-sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute reports cron sync" },
      { status: 500 }
    );
  }
}

