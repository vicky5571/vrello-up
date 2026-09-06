import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { MOU_STATUSES } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;

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
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
  const { branchId, outletName, partnerName, mouType, submissionDate, startDate, endDate, status, picName, docPath, compensationValue, notes } = body ?? {};
  if (!branchId || !partnerName || !mouType) {
    return NextResponse.json({ error: "Missing required fields: branchId, partnerName, mouType" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const mou = await prisma.mou.create({
      data: { branchId, outletName, partnerName, mouType, submissionDate, startDate, endDate, status, picName, docPath, compensationValue, notes },
      include: mouInclude,
    });
    return NextResponse.json(mou, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
    throw e;
  }
}
