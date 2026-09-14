import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { canTransitionMou, MOU_STATUSES, type MouStatus } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;
const PATCHABLE_FIELDS = ["branchId", "outletName", "partnerName", "mouType", "submissionDate", "startDate", "endDate", "status", "picName", "picPhone", "docPath", "compensationValue", "notes"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.mou.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) {
      if ((field === "startDate" || field === "endDate" || field === "submissionDate") && typeof body[field] === "string") {
        data[field] = body[field] ? new Date(body[field] as string) : null;
      } else {
        data[field] = body[field];
      }
    }
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  if (typeof data.status === "string" && data.status !== existing.status) {
    if (!canTransitionMou(existing.status as MouStatus, data.status as MouStatus)) {
      return NextResponse.json(
        { error: `Illegal status transition: ${existing.status} → ${data.status}` },
        { status: 400 },
      );
    }
    if (existing.status === "SUBMITTED") {
      const adminAuthError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "admin", request });
      if (adminAuthError) return adminAuthError;
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.mou.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

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
