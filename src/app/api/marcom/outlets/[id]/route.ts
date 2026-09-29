import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import { buildOutletEventWhere, buildOutletContentWhere } from "@/lib/marcom/outletRelations";

const VALID_TYPES = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
const VALID_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;
const VALID_BRANDS = ["IM3", "TRI"] as const;
const PATCHABLE_FIELDS = ["code", "name", "type", "tier", "brand", "branchId", "address", "city", "picName", "picPhone", "active", "latitude", "longitude"] as const;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";

  try {
    await requireMember(workspaceId);
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
        where: { workspaceId },
        orderBy: { id: "desc" },
        include: {
          material: { select: { id: true, name: true, type: true, requiresMou: true } },
          mou: { select: { id: true, partnerName: true, status: true, compensationValue: true, docPath: true } },
        },
      },
      mous: {
        where: { workspaceId },
        orderBy: { id: "desc" },
        include: {
          branch: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  if (!outlet) {
    return Response.json({ error: "Outlet not found" }, { status: 404 });
  }

  const [events, contents] = await Promise.all([
    prisma.fieldEvent.findMany({
      where: buildOutletEventWhere(workspaceId, outlet.id),
      orderBy: { startDate: "desc" },
      take: 50,
      include: { footage: true },
    }),
    prisma.contentPost.findMany({
      where: buildOutletContentWhere(workspaceId, outlet.id, outlet.code),
      orderBy: { publishDate: "desc" },
      take: 50,
    }),
  ]);

  return Response.json({
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
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (data.tier !== undefined && !VALID_TIERS.includes(data.tier as (typeof VALID_TIERS)[number])) {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }
  if (data.brand !== undefined && !VALID_BRANDS.includes(data.brand as (typeof VALID_BRANDS)[number])) {
    return Response.json({ error: "Invalid brand" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const outlet = await prisma.outlet.update({ where: { id }, data });
    return Response.json(outlet);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return Response.json({ error: "Outlet not found" }, { status: 404 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "Outlet code already exists" }, { status: 409 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return Response.json({ error: "Branch not found" }, { status: 400 });
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
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return Response.json({ error: "Outlet not found" }, { status: 404 });
    }
    throw e;
  }
}
