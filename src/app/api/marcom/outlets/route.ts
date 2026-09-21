import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import {
  buildOutletSearchWhere,
  parseOutletSearchLimit,
  VALID_TYPES,
  VALID_TIERS,
} from "@/app/api/marcom/outlets/outletsSearchFilter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";

  try {
    await requireMember(workspaceId);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const branchId = searchParams.get("branchId");
  const rawType = searchParams.get("type");
  const type = rawType === "OFFICIAL_STORE" ? "EXCLUSIVE" : rawType;
  const tier = searchParams.get("tier");
  const query = searchParams.get("q");
  const rawLimit = searchParams.get("limit");

  if (type && type !== "ALL" && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (tier && tier !== "ALL" && !VALID_TIERS.includes(tier as (typeof VALID_TIERS)[number])) {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  const where = buildOutletSearchWhere({
    q: query,
    branchId,
    type,
    tier,
  });

  const take = parseOutletSearchLimit(rawLimit, query);

  const outlets = await prisma.outlet.findMany({
    where,
    orderBy: { code: "asc" },
    ...(take !== undefined ? { take } : {}),
    include: {
      branch: { select: { id: true, code: true, name: true, city: true, region: true, picName: true, picPhone: true, address: true } },
      _count: { select: { placements: true, mous: true } },
      placements: {
        where: { workspaceId },
        take: 5,
        orderBy: { id: "desc" },
        include: {
          material: { select: { id: true, name: true, type: true, requiresMou: true } },
        },
      },
    },
  });
  const data = outlets.map((o) => ({
    ...o,
    placementCount: o._count?.placements ?? 0,
    mouCount: o._count?.mous ?? 0,
  }));
  return Response.json({ total: data.length, data });
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
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, type, tier, branchId, address, city, picName, picPhone, active, latitude, longitude } = body ?? {};
  if (!code || !name || !type || !tier || !branchId) {
    return Response.json({ error: "Missing required fields: code, name, type, tier, branchId" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!VALID_TIERS.includes(tier)) {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
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
    return Response.json(outlet, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "Outlet code already exists" }, { status: 409 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return Response.json({ error: "Branch not found" }, { status: 400 });
    }
    throw e;
  }
}
