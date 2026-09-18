import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { buildMarcomAnalyticsDashboard } from "@/lib/marcom/analyticsEngine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || "ws-main";

    const authError = await requireWorkspaceAccess(workspaceId, {
      requiredRole: "viewer",
      request,
    });
    if (authError) return authError;

    // Run parallel queries across all 5 operational Marcom entities
    const [mous, placements, contents, events, outlets] = await Promise.all([
      prisma.mou.findMany({
        where: { workspaceId },
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
        where: { workspaceId },
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
              tier: true,
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
        where: { workspaceId },
        select: {
          id: true,
          platform: true,
          status: true,
          publishDate: true,
        },
      }),
      prisma.fieldEvent.findMany({
        where: { workspaceId },
        select: {
          id: true,
          eventType: true,
          status: true,
          budget: true,
          targetAttendee: true,
          attendeeCount: true,
        },
      }),
      prisma.outlet.findMany({
        select: {
          id: true,
          tier: true,
          name: true,
          code: true,
        },
      }),
    ]);

    const dashboard = buildMarcomAnalyticsDashboard({
      mous,
      placements,
      contents,
      events,
      outlets,
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

