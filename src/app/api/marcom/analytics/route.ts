import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildMarcomAnalyticsDashboard } from "@/lib/marcom/analyticsEngine";

export async function GET() {
  try {
    // Run parallel queries across all operational Marcom entities.
    // NOTE: `Outlet` is global master data (~25k rows). We NEVER load full
    // outlet records; we only need a lightweight SQL COUNT aggregation.
    const [mous, placements, contents, events, activeOutletCount] = await Promise.all([
      prisma.mou.findMany({
        select: {
          id: true,
          status: true,
          submissionDate: true,
          startDate: true,
          endDate: true,
          compensationValue: true,
        },
      }),
      prisma.placement.findMany({
        select: {
          id: true,
          status: true,
          cost: true,
          outletId: true,
          material: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          outlet: {
            select: {
              id: true,
              branchId: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.contentPost.findMany({
        select: {
          id: true,
          platform: true,
          status: true,
          publishDate: true,
        },
      }),
      prisma.fieldEvent.findMany({
        select: {
          id: true,
          eventType: true,
          status: true,
          budget: true,
          targetAttendee: true,
          attendeeCount: true,
        },
      }),
      prisma.outlet.count({
        where: { active: true },
      }),
    ]);

    const dashboard = buildMarcomAnalyticsDashboard({
      mous,
      placements,
      contents,
      events,
      activeOutletCount,
    });

    return NextResponse.json({ ok: true, data: dashboard });
  } catch (error) {
    console.error("Failed to compile marcom analytics:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to compile marcom analytics" },
      { status: 500 }
    );
  }
}
