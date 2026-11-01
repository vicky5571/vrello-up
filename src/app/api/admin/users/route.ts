import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toAppUser } from "@/lib/server/auth-helpers";
import { canAccessUserManagement } from "@/lib/marcom/guards";
import type { DbUserStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));

    const validStatuses: DbUserStatus[] = ["PENDING", "APPROVED", "REJECTED"];
    const status = validStatuses.includes(statusParam as DbUserStatus)
      ? (statusParam as DbUserStatus)
      : undefined;

    const where = status ? { status } : {};

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const users = rawUsers.map(toAppUser);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[admin-users] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

