import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const report = await prisma.monthlyReport.findUnique({
      where: { id },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const authError = await requireWorkspaceAccess(report.workspaceId, { requiredRole: "viewer", request });
    if (authError) return authError;

    return NextResponse.json(report);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await prisma.monthlyReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  try {
    await prisma.monthlyReport.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    throw e;
  }
}
