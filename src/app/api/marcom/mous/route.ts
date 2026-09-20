import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { MOU_STATUSES } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;
// Creation is clamped to the entry of the approval flow: omitting status
// yields the Prisma DRAFT default; only DRAFT/SUBMITTED are accepted so
// callers cannot mint APPROVED/DONE rows and bypass the approval gate.
const CREATABLE_STATUSES = ["DRAFT", "SUBMITTED"] as const;

const mouInclude = {
  branch: { select: { id: true, code: true, name: true } },
  outlet: { select: { id: true, code: true, name: true } },
  placements: {
    select: {
      id: true,
      mouId: true,
      status: true,
      cost: true,
      photoUrl: true,
      material: { select: { id: true, name: true, type: true, requiresMou: true } },
    },
  },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "viewer", request });
  if (authError) return authError;

  const branchId = searchParams.get("branchId") ?? searchParams.get("branch");
  const outletId = searchParams.get("outletId");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.MouWhereInput = {
    workspaceId,
  };
  if (branchId && branchId !== "ALL") {
    where.branchId = branchId;
  }
  if (outletId && outletId !== "ALL") {
    where.outletId = outletId;
  }
  if (status && status !== "ALL") {
    where.status = status as (typeof VALID_STATUSES)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ partnerName: contains }, { mouType: contains }, { outletName: contains }, { picName: contains }, { picPhone: contains }, { notes: contains }];
  }

  const mous = await prisma.mou.findMany({
    where,
    orderBy: { id: "asc" },
    include: mouInclude,
  });
  return NextResponse.json({ total: mous.length, data: mous });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspaceId = body?.workspaceId || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const { branchId, outletId, outletName, partnerName, mouType, submissionDate, startDate, endDate, status, picName, picPhone, docPath, compensationValue, notes } = body ?? {};
  if (!branchId || !partnerName || !mouType) {
    return NextResponse.json({ error: "Missing required fields: branchId, partnerName, mouType" }, { status: 400 });
  }
  if (status !== undefined && !(CREATABLE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status: only DRAFT or SUBMITTED can be set on creation" }, { status: 400 });
  }

  const targetOutletId = typeof outletId === "string" && outletId.trim() && outletId !== "NONE" ? outletId.trim() : null;
  const targetOutletName = typeof outletName === "string" ? outletName : "";

  try {
    const mou = await prisma.mou.create({
      data: {
        workspaceId,
        branchId,
        outletId: targetOutletId,
        outletName: targetOutletName,
        partnerName,
        mouType,
        submissionDate: submissionDate ? new Date(submissionDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        picName: picName ?? "",
        picPhone: picPhone ?? "",
        docPath,
        compensationValue,
        notes,
      },
      include: mouInclude,
    });
    return NextResponse.json(mou, { status: 201 });
  } catch (e) {
    console.error("[MOU POST] failed", e, { branchId, partnerName, mouType });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch or Outlet not found" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Server Error" }, { status: 500 });
  }
}
