import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { isValidDocumentFilePath } from "@/lib/marcom/upload";

const VALID_FILE_TYPES = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG"] as const;
const PATCHABLE_FIELDS = ["name", "category", "period", "branchName", "ownerPic", "status", "fileType", "fileSizeMb", "filePath", "description"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.documentItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) data[field] = body[field];
  }
  if (data.fileType !== undefined && !VALID_FILE_TYPES.includes(data.fileType as (typeof VALID_FILE_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
  }
  if (data.filePath !== undefined && !isValidDocumentFilePath(data.filePath as string)) {
    return NextResponse.json({ error: "Invalid filePath: must be served by /api/marcom/files/ or a valid https:// URL" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const document = await prisma.documentItem.update({ where: { id }, data });
    return NextResponse.json(document);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.documentItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  try {
    await prisma.documentItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    throw e;
  }
}
