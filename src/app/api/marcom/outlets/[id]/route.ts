import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_TYPES = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
const VALID_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;
const PATCHABLE_FIELDS = ["code", "name", "type", "tier", "branchId", "address", "city", "picName", "picPhone", "active", "latitude", "longitude"] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, code: true, name: true, city: true, region: true, picName: true, picPhone: true, address: true } },
      placements: {
        orderBy: { id: "desc" },
        include: {
          material: { select: { id: true, name: true, type: true } },
          mou: { select: { id: true, partnerName: true, status: true, compensationValue: true } },
        },
      },
      mous: {
        orderBy: { id: "desc" },
        include: {
          branch: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  const eventOr: Prisma.FieldEventWhereInput[] = [];
  if (outlet.branch?.name) {
    eventOr.push({ branchName: { equals: outlet.branch.name, mode: "insensitive" } });
  }
  if (outlet.name) {
    eventOr.push({ location: { contains: outlet.name, mode: "insensitive" } });
    eventOr.push({ name: { contains: outlet.name, mode: "insensitive" } });
  }

  const [events, contents] = await Promise.all([
    eventOr.length > 0
      ? prisma.fieldEvent.findMany({
          where: { OR: eventOr },
          orderBy: { startDate: "desc" },
          take: 50,
          include: { footage: true },
        })
      : Promise.resolve([]),
    outlet.branch?.name
      ? prisma.contentPost.findMany({
          where: {
            branchName: { equals: outlet.branch.name, mode: "insensitive" },
          },
          orderBy: { publishDate: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ...outlet,
    events,
    contents,
  });
}

async function requireMasterData() {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw e;
  }
  if (!hasPermission(role, "MANAGE_MASTER_DATA")) {
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMasterData();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) data[field] = body[field];
  }
  if (data.type !== undefined && !VALID_TYPES.includes(data.type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (data.tier !== undefined && !VALID_TIERS.includes(data.tier as (typeof VALID_TIERS)[number])) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const outlet = await prisma.outlet.update({ where: { id }, data });
    return NextResponse.json(outlet);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Outlet code already exists" }, { status: 409 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMasterData();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  try {
    await prisma.outlet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }
    throw e;
  }
}
