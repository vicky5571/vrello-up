import { NextResponse } from "next/server";
import { z } from "zod";
import type { DbUserRole, DbUserStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toAppUser } from "@/lib/server/auth-helpers";
import {
  canAccessUserManagement,
  canManageUserTarget,
  canAssignUserRole,
} from "@/lib/marcom/guards";
import { canAssignBranchToUser } from "@/lib/marcom/branchAssignmentHelpers";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/server/mailer";
import type { UserRole } from "@/types";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  role: z.enum(["admin", "supervisor", "staff", "viewer"]).optional(),
  assignedBranchIds: z.array(z.string()).optional(),
  reason: z.string().optional(),
});

function roleToDbRole(role: UserRole): DbUserRole {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "supervisor":
      return "SUPERVISOR";
    case "staff":
      return "STAFF";
    case "viewer":
      return "VIEWER";
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!canAccessUserManagement(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden. Admin or Supervisor role required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent users from demoting or deactivating themselves through this
    // endpoint (they would lose access to the admin panel immediately).
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Tidak dapat mengubah akun Anda sendiri melalui panel ini." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, role, assignedBranchIds, reason } = parsed.data;

    if (!status && !role && !assignedBranchIds) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Guard: Prevent supervisors from modifying admin accounts
    if (!canManageUserTarget(session.user.role, targetUser.role)) {
      return NextResponse.json(
        { error: "Supervisor tidak diizinkan mengubah akun Administrator." },
        { status: 403 }
      );
    }

    // Guard: Prevent supervisors from assigning admin role
    if (role && !canAssignUserRole(session.user.role, role)) {
      return NextResponse.json(
        { error: "Supervisor tidak diizinkan memberikan role Administrator." },
        { status: 403 }
      );
    }

    // Guard: Prevent supervisors from assigning branches outside their scope
    if (
      assignedBranchIds &&
      !canAssignBranchToUser(
        session.user.role,
        session.user.assignedBranchIds,
        assignedBranchIds
      )
    ) {
      return NextResponse.json(
        { error: "Supervisor hanya dapat menugaskan cabang dalam wilayah binaannya." },
        { status: 403 }
      );
    }

    const updateData: {
      status?: DbUserStatus;
      role?: DbUserRole;
      assignedBranchIds?: string[];
    } = {};

    if (status) {
      updateData.status = status;
    }

    if (role) {
      updateData.role = roleToDbRole(role);
    }

    if (assignedBranchIds) {
      updateData.assignedBranchIds = assignedBranchIds;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (status === "APPROVED") {
      void sendApprovalEmail(targetUser.email, targetUser.name);
    } else if (status === "REJECTED" && reason) {
      void sendRejectionEmail(targetUser.email, targetUser.name, reason);
    }

    return NextResponse.json({ user: toAppUser(updated) });
  } catch (error) {
    console.error("[admin-users-id] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!canAccessUserManagement(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden. Admin or Supervisor role required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Guard: Prevent supervisors from deleting admin accounts
    if (!canManageUserTarget(session.user.role, targetUser.role)) {
      return NextResponse.json(
        { error: "Supervisor tidak diizinkan menghapus akun Administrator." },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted." });
  } catch (error) {
    console.error("[admin-users-id] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

