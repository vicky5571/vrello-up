import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isValidDocumentFilePath } from "@/lib/marcom/upload";

const VALID_FILE_TYPES = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");
  const fileType = searchParams.get("fileType");
  const query = searchParams.get("q")?.toLowerCase();

  if (fileType && fileType !== "ALL" && !VALID_FILE_TYPES.includes(fileType as (typeof VALID_FILE_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
  }

  const where: Prisma.DocumentItemWhereInput = {};
  if (category && category !== "ALL") {
    where.category = { equals: category, mode: "insensitive" };
  }
  if (fileType && fileType !== "ALL") {
    where.fileType = fileType as (typeof VALID_FILE_TYPES)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { category: contains }, { branchName: contains }, { ownerPic: contains }, { description: contains }];
  }

  const documents = await prisma.documentItem.findMany({ where, orderBy: { id: "asc" } });
  return NextResponse.json({ total: documents.length, data: documents });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, category, period, branchName, ownerPic, fileType, fileSizeMb, filePath, description } = body ?? {};
  if (!name || !category || !fileType || !filePath) {
    return NextResponse.json({ error: "Missing required fields: name, category, fileType, filePath" }, { status: 400 });
  }
  if (!VALID_FILE_TYPES.includes(fileType)) {
    return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
  }
  if (!isValidDocumentFilePath(filePath)) {
    return NextResponse.json({ error: "Invalid filePath: must be served by /api/marcom/files/ or a valid https:// URL" }, { status: 400 });
  }

  const document = await prisma.documentItem.create({
    data: { name, category, period, branchName, ownerPic, fileType, fileSizeMb, filePath, description },
  });
  return NextResponse.json(document, { status: 201 });
}
