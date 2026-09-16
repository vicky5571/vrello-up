import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

const VALID_STATUSES = ["NOT_STARTED", "ON_PROGRESS", "DONE", "ISSUE"] as const;

const placementInclude = {
  outlet: { select: { id: true, code: true, name: true } },
  material: { select: { id: true, type: true, name: true } },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "viewer", request });
  if (authError) return authError;

  const outletId = searchParams.get("outletId");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.PlacementWhereInput = {
    workspaceId,
  };
  if (outletId && outletId !== "ALL") {
    where.outletId = outletId;
  }
  if (status && status !== "ALL") {
    where.status = status as (typeof VALID_STATUSES)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ picName: contains }, { notes: contains }, { dimensions: contains }];
  }

  const placements = await prisma.placement.findMany({
    where,
    orderBy: { id: "asc" },
    include: placementInclude,
  });
  return NextResponse.json({ total: placements.length, data: placements });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspaceId = body?.workspaceId || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const { outletId, materialId, status, date, picName, photoUrl, dimensions, cost, notes, latitude, longitude, shareLocationUrl, locationNotes } = body ?? {};
  if (!outletId || !materialId) {
    return NextResponse.json({ error: "Missing required fields: outletId, materialId" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const parsedLat = typeof latitude === "number" && !Number.isNaN(latitude) ? latitude : null;
  const parsedLng = typeof longitude === "number" && !Number.isNaN(longitude) ? longitude : null;

  try {
    const placement = await prisma.placement.create({
      data: {
        workspaceId,
        outletId,
        materialId,
        status,
        date,
        picName,
        photoUrl,
        dimensions,
        cost,
        notes,
        latitude: parsedLat,
        longitude: parsedLng,
        shareLocationUrl: typeof shareLocationUrl === "string" ? shareLocationUrl : "",
        locationNotes: typeof locationNotes === "string" ? locationNotes : "",
      },
      include: placementInclude,
    });
    return NextResponse.json(placement, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Outlet or material not found" }, { status: 400 });
    }
    throw e;
  }
}
