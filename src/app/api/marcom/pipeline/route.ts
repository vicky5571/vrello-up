import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import {
  buildOutletPipelineRows,
  filterPipelineRows,
} from "@/lib/marcom/pipelineEngine";

const VALID_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;

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
  const tier = searchParams.get("tier");
  const q = searchParams.get("q");
  const bottleneckOnly = searchParams.get("bottleneckOnly");
  const activeOnly = searchParams.get("activeOnly");

  const outletWhere: Prisma.OutletWhereInput = {};

  if (branchId && branchId.trim() !== "" && branchId.trim().toUpperCase() !== "ALL") {
    outletWhere.branchId = branchId.trim();
  }

  if (tier && tier.trim() !== "" && tier.trim().toUpperCase() !== "ALL") {
    const upperTier = tier.trim().toUpperCase();
    if (VALID_TIERS.includes(upperTier as (typeof VALID_TIERS)[number])) {
      outletWhere.tier = upperTier as (typeof VALID_TIERS)[number];
    }
  }

  if (q && q.trim().length > 0) {
    const query = q.trim();
    const searchConditions: Prisma.OutletWhereInput[] = [
      { name: { contains: query, mode: "insensitive" } },
      { code: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
      { picName: { contains: query, mode: "insensitive" } },
      { branch: { name: { contains: query, mode: "insensitive" } } },
    ];
    outletWhere.OR = searchConditions;
  }

  if (activeOnly === "true" || activeOnly === "1") {
    const activityConditions: Prisma.OutletWhereInput[] = [
      { placements: { some: { workspaceId } } },
      { mous: { some: { workspaceId } } },
      { events: { some: { workspaceId } } },
    ];
    if (outletWhere.OR) {
      outletWhere.AND = [{ OR: outletWhere.OR }, { OR: activityConditions }];
      delete outletWhere.OR;
    } else {
      outletWhere.OR = activityConditions;
    }
  }

  const [outlets, events, contents] = await Promise.all([
    prisma.outlet.findMany({
      where: outletWhere,
      orderBy: { code: "asc" },
      include: {
        branch: true,
        placements: {
          where: { workspaceId },
          include: {
            material: true,
            mou: true,
          },
        },
        mous: {
          where: { workspaceId },
          include: {
            branch: true,
          },
        },
      },
    }),
    prisma.fieldEvent.findMany({
      where: { workspaceId },
      orderBy: { startDate: "asc" },
      include: { footage: true },
    }),
    prisma.contentPost.findMany({
      where: { workspaceId },
      orderBy: { publishDate: "desc" },
    }),
  ]);

  const normalizedOutlets = outlets.map((o) => ({
    ...o,
    mous: o.mous.map((m) => ({
      ...m,
      submissionDate: m.submissionDate ? m.submissionDate.toISOString() : null,
      startDate: m.startDate ? m.startDate.toISOString() : null,
      endDate: m.endDate ? m.endDate.toISOString() : null,
    })),
    placements: o.placements.map((p) => ({
      ...p,
      date: p.date ? p.date.toISOString() : null,
    })),
  }));

  const normalizedEvents = events.map((e) => ({
    id: e.id,
    outletId: e.outletId ?? undefined,
    name: e.name,
    branchName: e.branchName,
    location: e.location,
    startDate: e.startDate ? e.startDate.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    status: e.status,
  }));

  const normalizedContents = contents.map((c) => ({
    id: c.id,
    outletId: c.outletId ?? undefined,
    title: c.title,
    branchName: c.branchName,
    platform: c.platform,
    status: c.status,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null,
    caption: c.caption,
  }));

  const allRows = buildOutletPipelineRows(normalizedOutlets, normalizedEvents, normalizedContents);
  const data = filterPipelineRows(allRows, {
    q,
    branchId,
    tier,
    bottleneckOnly,
  });

  return Response.json({ total: data.length, data });
}
