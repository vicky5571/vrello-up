import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { canTransitionPlacement, validatePlacementUpdate, type PlacementStatus } from "@/lib/marcom/placementMachine";

const VALID_STATUSES = ["NOT_STARTED", "ON_PROGRESS", "DONE", "ISSUE"] as const;
const PATCHABLE_FIELDS = [
  "outletId",
  "materialId",
  "mouId",
  "status",
  "brand",
  "date",
  "picName",
  "photoUrl",
  "dimensions",
  "cost",
  "notes",
  "latitude",
  "longitude",
  "shareLocationUrl",
  "locationNotes",
] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.placement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) data[field] = body[field];
  }
  if (data.mouId !== undefined) {
    data.mouId =
      typeof data.mouId === "string" && data.mouId.trim() && data.mouId !== "NONE"
        ? data.mouId.trim()
        : null;
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (data.brand !== undefined && typeof data.brand === "string") {
    data.brand = data.brand.toUpperCase() === "3" || data.brand.toUpperCase() === "TRI" ? "3" : "IM3";
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const targetStatus = (data.status as PlacementStatus) || (existing.status as PlacementStatus);
  const validation = validatePlacementUpdate(
    existing.status as PlacementStatus,
    targetStatus,
    {
      photoUrl: (data.photoUrl !== undefined ? data.photoUrl : existing.photoUrl) as string | null,
      notes: (data.notes !== undefined ? data.notes : existing.notes) as string | null,
      latitude: (data.latitude !== undefined ? data.latitude : existing.latitude) as number | null,
      longitude: (data.longitude !== undefined ? data.longitude : existing.longitude) as number | null,
      shareLocationUrl: (data.shareLocationUrl !== undefined ? data.shareLocationUrl : existing.shareLocationUrl) as string | null,
    },
  );

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const placement = await prisma.placement.update({ where: { id }, data });
    return NextResponse.json(placement);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Outlet or material not found" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.placement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  try {
    await prisma.placement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 });
    }
    throw e;
  }
}
