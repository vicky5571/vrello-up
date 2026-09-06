import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_STATUSES = ["NOT_STARTED", "ON_PROGRESS", "DONE", "ISSUE"] as const;

const placementInclude = {
  outlet: { select: { id: true, code: true, name: true } },
  material: { select: { id: true, type: true, name: true } },
} as const;

async function requirePlacementWriter() {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw e;
  }
  if (!hasPermission(role, "UPDATE_PLACEMENT")) {
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const outletId = searchParams.get("outletId");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.PlacementWhereInput = {};
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
  try {
    await requirePlacementWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
  const { outletId, materialId, status, date, picName, photoUrl, dimensions, cost, notes } = body ?? {};
  if (!outletId || !materialId) {
    return NextResponse.json({ error: "Missing required fields: outletId, materialId" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const placement = await prisma.placement.create({
      data: { outletId, materialId, status, date, picName, photoUrl, dimensions, cost, notes },
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
