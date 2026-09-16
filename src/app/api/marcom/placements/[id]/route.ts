import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { canTransitionPlacement, type PlacementStatus } from "@/lib/marcom/placementMachine";

const VALID_STATUSES = ["NOT_STARTED", "ON_PROGRESS", "DONE", "ISSUE"] as const;
const PATCHABLE_FIELDS = [
  "outletId",
  "materialId",
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
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (data.brand !== undefined && typeof data.brand === "string") {
    data.brand = data.brand.toUpperCase() === "3" || data.brand.toUpperCase() === "TRI" ? "3" : "IM3";
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  if (
    typeof data.status === "string" &&
    data.status !== existing.status &&
    !canTransitionPlacement(existing.status as PlacementStatus, data.status as PlacementStatus)
  ) {
    return NextResponse.json(
      { error: `Illegal status transition: ${existing.status} → ${data.status}` },
      { status: 400 },
    );
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
