import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  normalizeRole,
  normalizeStatus,
} from "@/lib/server/auth-helpers";
import { updateProfileSchema } from "@/lib/server/profileValidators";
import type { UserProfileResponse } from "@/types";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Sesi telah berakhir." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        assignedBranchIds: true,
        googleId: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    const response: UserProfileResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status),
      assignedBranchIds: user.assignedBranchIds ?? [],
      isGoogleAccount: Boolean(user.googleId),
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[profile] Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Sesi telah berakhir." },
        { status: 401 },
      );
    }

    const body: unknown = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Input tidak valid." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        password: true,
        googleId: true,
        role: true,
        status: true,
        assignedBranchIds: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    // Handle password change if requested
    let updatedPasswordHash: string | undefined;

    if (parsed.data.newPassword) {
      if (existing.googleId && !existing.password) {
        return NextResponse.json(
          {
            error:
              "Akun Anda terhubung dengan Google Identity. Kata sandi dikelola secara terpusat oleh akun Google Anda.",
          },
          { status: 400 },
        );
      }

      if (!parsed.data.currentPassword || !existing.password) {
        return NextResponse.json(
          { error: "Password saat ini wajib diisi untuk verifikasi." },
          { status: 400 },
        );
      }

      const isCurrentValid = await verifyPassword(
        parsed.data.currentPassword,
        existing.password,
      );

      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Password saat ini tidak sesuai." },
          { status: 400 },
        );
      }

      updatedPasswordHash = await hashPassword(parsed.data.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.avatar !== undefined ? { avatar: parsed.data.avatar ?? "" } : {}),
        ...(updatedPasswordHash ? { password: updatedPasswordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        assignedBranchIds: true,
        googleId: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const response: UserProfileResponse = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: normalizeRole(updated.role),
      status: normalizeStatus(updated.status),
      assignedBranchIds: updated.assignedBranchIds ?? [],
      isGoogleAccount: Boolean(updated.googleId),
      createdAt: updated.createdAt.toISOString(),
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[profile] Failed to update profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 },
    );
  }
}
