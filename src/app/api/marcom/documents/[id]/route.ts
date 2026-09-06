import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_FILE_TYPES = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG"] as const;
const PATCHABLE_FIELDS = ["name", "category", "period", "branchName", "ownerPic", "status", "fileType", "fileSizeMb", "filePath", "description"] as const;

async function requireDocumentWriter() {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw e;
  }
  if (!hasPermission(role, "UPLOAD_DOCUMENT")) {
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDocumentWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) data[field] = body[field];
  }
  if (data.fileType !== undefined && !VALID_FILE_TYPES.includes(data.fileType as (typeof VALID_FILE_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!hasPermission(role, "DELETE_DOCUMENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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
