import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

const VALID_STATUSES = ["NOT_STARTED", "ON_PROGRESS", "DONE", "ISSUE"] as const;

const placementInclude = {
  outlet: { select: { id: true, code: true, name: true, brand: true } },
  material: { select: { id: true, type: true, name: true } },
  mou: {
    select: {
      id: true,
      partnerName: true,
      status: true,
      mouType: true,
      startDate: true,
      endDate: true,
      compensationValue: true,
    },
  },
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || "ws-main";
    const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "viewer", request });
    if (authError) return authError;

    const outletId = searchParams.get("outletId");
    const mouId = searchParams.get("mouId");
    const status = searchParams.get("status");
    const brand = searchParams.get("brand");
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
    if (mouId && mouId !== "ALL") {
      where.mouId = mouId;
    }
    if (status && status !== "ALL") {
      where.status = status as (typeof VALID_STATUSES)[number];
    }
    if (brand && brand !== "ALL") {
      const normalizedBrand = brand.toUpperCase() === "3" || brand.toUpperCase() === "TRI" ? "3" : "IM3";
      where.brand = normalizedBrand;
    }
    if (query) {
      const contains = { contains: query, mode: "insensitive" as const };
      where.OR = [
        { picName: contains },
        { notes: contains },
        { dimensions: contains },
        { locationNotes: contains },
        { outlet: { name: contains } },
        { outlet: { code: contains } },
        { material: { name: contains } },
      ];
    }

    const placements = await prisma.placement.findMany({
      where,
      orderBy: { id: "asc" },
      include: placementInclude,
    });
    return NextResponse.json({ total: placements.length, data: placements });
  } catch (err) {
    console.error("GET /api/marcom/placements error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load placements" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspaceId = body?.workspaceId || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const { outletId, materialId, mouId, status, brand, date, picName, photoUrl, dimensions, cost, notes, latitude, longitude, shareLocationUrl, locationNotes } = body ?? {};
  if (!outletId || !materialId) {
    return NextResponse.json({ error: "Missing required fields: outletId, materialId" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const parsedLat = typeof latitude === "number" && !Number.isNaN(latitude) ? latitude : null;
  const parsedLng = typeof longitude === "number" && !Number.isNaN(longitude) ? longitude : null;
  const normalizedBrand = typeof brand === "string" && (brand.toUpperCase() === "3" || brand.toUpperCase() === "TRI") ? "3" : "IM3";
  const targetMouId = typeof mouId === "string" && mouId.trim() && mouId !== "NONE" ? mouId.trim() : null;

  try {
    const placement = await prisma.placement.create({
      data: {
        workspaceId,
        outletId,
        materialId,
        mouId: targetMouId,
        status,
        brand: normalizedBrand,
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

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspaceId = body?.workspaceId || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const { ids, updates } = body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Missing or empty field: ids" }, { status: 400 });
  }
  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Missing updates object" }, { status: 400 });
  }

  const dataToUpdate: Prisma.PlacementUpdateManyMutationInput = {};
  if (updates.status !== undefined) {
    if (!VALID_STATUSES.includes(updates.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    dataToUpdate.status = updates.status;
  }
  if (typeof updates.picName === "string") {
    dataToUpdate.picName = updates.picName;
  }

  try {
    const result = await prisma.placement.updateMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
      data: dataToUpdate,
    });
    return NextResponse.json({ updatedCount: result.count });
  } catch (err) {
    console.error("PATCH /api/marcom/placements error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to bulk update placements" },
      { status: 500 },
    );
  }
}

