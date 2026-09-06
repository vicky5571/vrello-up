import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";

const VALID_STATUSES = ["DONE", "ON_PROGRESS", "PENDING"] as const;

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.BranchWhereInput = {};
  if (region && region !== "ALL") {
    where.region = { equals: region, mode: "insensitive" };
  }
  if (status && status !== "ALL") {
    where.status = status as (typeof VALID_STATUSES)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { city: contains }, { code: contains }, { picName: contains }];
  }

  const branches = await prisma.branch.findMany({ where, orderBy: { code: "asc" } });
  return NextResponse.json({ total: branches.length, data: branches });
}

export async function POST(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
  const { code, name, region, city, status, picName, picPhone, address } = body ?? {};
  if (!code || !name || !region || !city) {
    return NextResponse.json({ error: "Missing required fields: code, name, region, city" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const branch = await prisma.branch.create({
      data: { code, name, region, city, status, picName, picPhone, address },
    });
    return NextResponse.json(branch, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 409 });
    }
    throw e;
  }
}
