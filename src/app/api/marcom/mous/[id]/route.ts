import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess, validateWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { canTransitionMou, MOU_STATUSES, type MouStatus } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;
const PATCHABLE_FIELDS = ["branchId", "outletId", "outletName", "partnerName", "mouType", "submissionDate", "startDate", "endDate", "status", "picName", "picPhone", "docPath", "compensationValue", "notes"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.mou.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }

  const auth = await validateWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
  }

  // Branch scope check for staff: cannot modify MOU outside assigned branch(es)
  if (auth.role !== "admin" && auth.assignedBranchIds && auth.assignedBranchIds.length > 0) {
    if (!auth.assignedBranchIds.includes(existing.branchId)) {
      return NextResponse.json(
        { error: "Forbidden: Cannot modify MOU outside assigned branch" },
        { status: 403 },
      );
    }
  }

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
  if (data.outletId !== undefined) {
    data.outletId =
      typeof data.outletId === "string" && data.outletId.trim() && data.outletId !== "NONE"
        ? data.outletId.trim()
        : null;
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  // If moving MOU to another branch, verify staff has access to the target branch as well
  if (data.branchId && typeof data.branchId === "string" && data.branchId !== existing.branchId) {
    if (auth.role !== "admin" && auth.assignedBranchIds && auth.assignedBranchIds.length > 0) {
      if (!auth.assignedBranchIds.includes(data.branchId)) {
        return NextResponse.json(
          { error: "Forbidden: Cannot reassign MOU to an unassigned branch" },
          { status: 403 },
        );
      }
    }
  }

  if (typeof data.status === "string" && data.status !== existing.status) {
    if (!canTransitionMou(existing.status as MouStatus, data.status as MouStatus)) {
      return NextResponse.json(
        { error: `Illegal status transition: ${existing.status} → ${data.status}` },
        { status: 400 },
      );
    }
    if (existing.status === "SUBMITTED" && (data.status === "APPROVED" || data.status === "REJECTED")) {
      // Admin can approve/reject any branch; staff can only approve/reject within their assigned branches
      if (auth.role !== "admin") {
        const userBranchIds = auth.assignedBranchIds ?? [];
        if (!userBranchIds.includes(existing.branchId)) {
          return NextResponse.json(
            {
              error:
                "Forbidden: Persetujuan MOU memerlukan wewenang Admin atau PIC resmi Cabang terkait (hubungi Admin untuk penugasan cabang)",
            },
            { status: 403 },
          );
        }
      }
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

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "admin", request });
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
