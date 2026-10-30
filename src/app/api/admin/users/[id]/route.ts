import { NextResponse } from "next/server";
import { z } from "zod";
import type { DbUserRole, DbUserStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toAppUser } from "@/lib/server/auth-helpers";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/server/mailer";
import type { UserRole, UserStatus } from "@/types";

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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent admins from demoting or deactivating themselves through this
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin role required." },
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

