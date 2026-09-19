import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import {
  buildOutletPipelineRows,
  filterPipelineRows,
} from "@/lib/marcom/pipelineEngine";

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

  const [outlets, events, contents] = await Promise.all([
    prisma.outlet.findMany({
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
    name: e.name,
    branchName: e.branchName,
    location: e.location,
    startDate: e.startDate ? e.startDate.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    status: e.status,
  }));

  const normalizedContents = contents.map((c) => ({
    id: c.id,
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
