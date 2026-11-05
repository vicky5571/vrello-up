import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, normalizeEmail } from "@/lib/server/auth-helpers";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchId: z.string().min(1, "Branch is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          issues: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    const { name, password, branchId } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const branchExists = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });

    if (!branchExists) {
      return NextResponse.json(
        { error: "Selected branch does not exist." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STAFF",
        status: "PENDING",
        assignedBranchIds: [branchId],
      },
    });

    return NextResponse.json(
      { message: "Registration submitted. Awaiting admin approval." },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error("[register] Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
