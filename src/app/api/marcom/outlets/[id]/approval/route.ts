import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasScopedPermission, resolveMarcomRole } from "@/lib/marcom/guards";
import {
  validateApprovalActionPayload,
  buildApprovalTransitionData,
  type ApprovalActionPayload,
} from "@/app/api/marcom/outlets/outletApprovalHelpers";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";

  let role;
  try {
    role = await requireMember(workspaceId);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const existing = await prisma.outlet.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, code: true, name: true } },
    },
  });

  if (!existing) {
    return Response.json({ error: "Outlet not found" }, { status: 404 });
  }

  // Enforce branch-scoped permission (Four-Eyes Principle)
  const userBranchIds = searchParams.get("userBranches")?.split(",").filter(Boolean) || [];
  const canApprove = hasScopedPermission({
    role,
    action: "APPROVE_OUTLET",
    userBranchIds,
    targetBranchId: existing.branchId,
  });

  if (!canApprove) {
    return Response.json(
      { error: "Forbidden: You do not have permission to approve outlets for this branch" },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as ApprovalActionPayload;
  const validation = validateApprovalActionPayload(body);
  if (!validation.isValid) {
    return Response.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
  }

  const approverName = searchParams.get("approver") || "manager@jateng.indosat.com";

  let transitionResult;
  try {
    transitionResult = buildApprovalTransitionData({
      action: body.action!,
      currentStatus: existing.status,
      newCode: body.code,
      rejectionReason: body.rejectionReason,
      approverName,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Invalid status transition" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.outlet.update({
      where: { id },
      data: transitionResult.data,
      include: {
        branch: { select: { id: true, code: true, name: true, city: true } },
      },
    });

    return Response.json(updated, { status: 200 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json(
        { error: `Outlet code '${body.code}' is already in use by another outlet` },
        { status: 409 }
      );
    }
    throw e;
  }
}
