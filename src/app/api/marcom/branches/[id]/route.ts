import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_STATUSES = ["DONE", "ON_PROGRESS", "PENDING"] as const;
const PATCHABLE_FIELDS = ["code", "name", "region", "city", "status", "picName", "picPhone", "address"] as const;

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: { select: { outlets: true, mous: true } },
        outlets: { select: { id: true, code: true, name: true, type: true, city: true, active: true }, orderBy: { code: "asc" } },
        mous: { select: { id: true, partnerName: true, mouType: true, status: true, compensationValue: true }, orderBy: { id: "desc" } },
      },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        ...branch,
        outletCount: branch._count.outlets,
        mouCount: branch._count.mous,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to fetch branch" }, { status: 500 });
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
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const branch = await prisma.branch.update({ where: { id }, data });
    return NextResponse.json(branch);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 409 });
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
    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    throw e;
  }
}
