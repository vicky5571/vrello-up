import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import { MOU_STATUSES } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;
// Creation is clamped to the entry of the approval flow: omitting status
// yields the Prisma DRAFT default; only DRAFT/SUBMITTED are accepted so
// callers cannot mint APPROVED/DONE rows and bypass the approval gate.
const CREATABLE_STATUSES = ["DRAFT", "SUBMITTED"] as const;

const mouInclude = {
  branch: { select: { id: true, code: true, name: true } },
} as const;

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") ?? searchParams.get("branch");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.MouWhereInput = {};
  if (branchId && branchId !== "ALL") {
    where.branchId = branchId;
  }
  if (status && status !== "ALL") {
    where.status = status as (typeof VALID_STATUSES)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ partnerName: contains }, { mouType: contains }, { outletName: contains }, { picName: contains }, { notes: contains }];
  }

  const mous = await prisma.mou.findMany({
    where,
    orderBy: { id: "asc" },
    include: mouInclude,
  });
  return NextResponse.json({ total: mous.length, data: mous });
}

export async function POST(request: Request) {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!hasPermission(role, "CREATE_MOU")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { branchId, outletName, partnerName, mouType, submissionDate, startDate, endDate, status, picName, docPath, compensationValue, notes } = body ?? {};
  if (!branchId || !partnerName || !mouType) {
    return NextResponse.json({ error: "Missing required fields: branchId, partnerName, mouType" }, { status: 400 });
  }
  if (status !== undefined && !(CREATABLE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status: only DRAFT or SUBMITTED can be set on creation" }, { status: 400 });
  }

  try {
    const mou = await prisma.mou.create({
      data: { branchId, outletName, partnerName, mouType, submissionDate, startDate, endDate, status, picName, docPath, compensationValue, notes },
      include: mouInclude,
    });
    return NextResponse.json(mou, { status: 201 });
  } catch (e) {
    console.error("[MOU POST] failed", e, { branchId, partnerName, mouType });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Server Error" }, { status: 500 });
  }
}
