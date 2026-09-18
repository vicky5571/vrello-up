import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { generateReportDraft, getMonthDateRange } from "@/lib/marcom/reportDraftEngine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || "ws-main";
    const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "viewer", request });
    if (authError) return authError;

    const month = searchParams.get("month")?.trim();
    const yearParam = searchParams.get("year");

    if (!month) {
      return NextResponse.json({ error: "Query parameter 'month' is required" }, { status: 400 });
    }

    const year = Number(yearParam ?? new Date().getFullYear());
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Query parameter 'year' must be a valid integer year" }, { status: 400 });
    }

    const { start, end } = getMonthDateRange(month, year);

    const [placements, mous, contents, events] = await Promise.all([
      prisma.placement.findMany({
        where: {
          workspaceId,
          date: { gte: start, lte: end },
        },
        include: {
          outlet: { select: { name: true, code: true } },
          material: { select: { name: true, type: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.mou.findMany({
        where: {
          workspaceId,
          OR: [
            { startDate: { gte: start, lte: end } },
            { submissionDate: { gte: start, lte: end } },
            {
              AND: [
                { startDate: { lte: end } },
                { OR: [{ endDate: null }, { endDate: { gte: start } }] },
                { status: { in: ["APPROVED", "DONE"] } },
              ],
            },
          ],
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.contentPost.findMany({
        where: {
          workspaceId,
          publishDate: { gte: start, lte: end },
        },
        orderBy: { publishDate: "asc" },
      }),
      prisma.fieldEvent.findMany({
        where: {
          workspaceId,
          startDate: { gte: start, lte: end },
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    const draft = generateReportDraft({
      month,
      year,
      placements,
      mous,
      contents,
      events,
    });

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    console.error("GET /api/marcom/reports/draft error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report draft" },
      { status: 500 },
    );
  }
}
