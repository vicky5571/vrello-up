import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import { canTransitionMou, type MouStatus } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = ["DRAFT", "SUBMITTED", "ON_PROGRESS", "DONE", "REJECTED", "APPROVED"] as const;
const PATCHABLE_FIELDS = ["branchId", "outletName", "partnerName", "mouType", "submissionDate", "startDate", "endDate", "status", "picName", "docPath", "compensationValue", "notes"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let role;
  try {
    role = await requireMember("ws-main");
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

  const existing = await prisma.mou.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }
  if (typeof data.status === "string" && data.status !== existing.status) {
    if (!canTransitionMou(existing.status as MouStatus, data.status as MouStatus)) {
      return NextResponse.json(
        { error: `Illegal status transition: ${existing.status} → ${data.status}` },
        { status: 400 },
      );
    }
    if (existing.status === "SUBMITTED" && !hasPermission(role, "APPROVE_MOU")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const mou = await prisma.mou.update({ where: { id }, data });
    return NextResponse.json(mou);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!hasPermission(role, "DELETE_MOU")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.mou.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "MOU not found" }, { status: 404 });
    }
    throw e;
  }
}
