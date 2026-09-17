import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_TYPES = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
const VALID_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const rawType = searchParams.get("type");
  const type = rawType === "OFFICIAL_STORE" ? "EXCLUSIVE" : rawType;
  const tier = searchParams.get("tier");
  const query = searchParams.get("q")?.toLowerCase();

  if (type && type !== "ALL" && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (tier && tier !== "ALL" && !VALID_TIERS.includes(tier as (typeof VALID_TIERS)[number])) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const where: Prisma.OutletWhereInput = {};
  if (branchId && branchId !== "ALL") {
    where.branchId = branchId;
  }
  if (type && type !== "ALL") {
    where.type = type as (typeof VALID_TYPES)[number];
  }
  if (tier && tier !== "ALL") {
    where.tier = tier as (typeof VALID_TIERS)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { city: contains }, { code: contains }, { picName: contains }];
  }

  const outlets = await prisma.outlet.findMany({
    where,
    orderBy: { code: "asc" },
    include: {
      branch: { select: { id: true, code: true, name: true, city: true, region: true, picName: true, picPhone: true, address: true } },
      _count: { select: { placements: true, mous: true } },
    },
  });
  const data = outlets.map((o) => ({
    ...o,
    placementCount: o._count?.placements ?? 0,
    mouCount: o._count?.mous ?? 0,
  }));
  return NextResponse.json({ total: data.length, data });
}

export async function POST(request: Request) {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!hasPermission(role, "MANAGE_MASTER_DATA")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, type, tier, branchId, address, city, picName, picPhone, active, latitude, longitude } = body ?? {};
  if (!code || !name || !type || !tier || !branchId) {
    return NextResponse.json({ error: "Missing required fields: code, name, type, tier, branchId" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const parsedLat = typeof latitude === "number" && !Number.isNaN(latitude) ? latitude : null;
  const parsedLng = typeof longitude === "number" && !Number.isNaN(longitude) ? longitude : null;

  try {
    const outlet = await prisma.outlet.create({
      data: {
        code,
        name,
        type,
        tier,
        branchId,
        address,
        city,
        picName,
        picPhone,
        active,
        latitude: parsedLat,
        longitude: parsedLng,
      },
    });
    return NextResponse.json(outlet, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Outlet code already exists" }, { status: 409 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
    throw e;
  }
}
