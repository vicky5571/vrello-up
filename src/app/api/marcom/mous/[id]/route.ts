import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canTransitionMou, MOU_STATUSES, type MouStatus } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;
const PATCHABLE_FIELDS = [
  "branchId",
  "outletId",
  "outletName",
  "partnerName",
  "mouType",
  "submissionDate",
  "startDate",
  "endDate",
  "status",
  "picName",
  "picPhone",
  "docPath",
  "docPaths",
  "compensationValue",
  "notes",
] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.mou.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) {
      if ((field === "startDate" || field === "endDate" || field === "submissionDate") && typeof body[field] === "string") {
        data[field] = body[field] ? new Date(body[field] as string) : null;
      } else {
        data[field] = body[field];
      }
    }
  }
  if (data.outletId !== undefined) {
    data.outletId =
      typeof data.outletId === "string" && data.outletId.trim() && data.outletId !== "NONE"
        ? data.outletId.trim()
        : null;
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Clean and normalize docPaths if provided
  if (data.docPaths !== undefined) {
    if (Array.isArray(data.docPaths)) {
      data.docPaths = data.docPaths
        .filter((p: unknown) => typeof p === "string" && p.trim() !== "")
        .map((p: string) => p.trim());
    } else {
      data.docPaths = [];
    }
    // Automatically sync docPath scalar fallback
    if (!data.docPath && Array.isArray(data.docPaths) && data.docPaths.length > 0) {
      data.docPath = data.docPaths[0];
    }
  } else if (typeof data.docPath === "string" && data.docPath.trim()) {
    // If docPath is provided alone, ensure docPaths has it
    if (!existing.docPaths || existing.docPaths.length === 0) {
      data.docPaths = [data.docPath.trim()];
    }
  }

  // Mandatory Document Guard: Fail-closed HTTP 422 if attempting to approve/finish without any uploaded document
  if (data.status === "APPROVED" || data.status === "DONE") {
    const existingDocs = Array.isArray(existing.docPaths) ? existing.docPaths.filter(Boolean) : [];
    if (existing.docPath && existing.docPath.trim() && !existingDocs.includes(existing.docPath.trim())) {
      existingDocs.push(existing.docPath.trim());
    }

    const incomingDocs = Array.isArray(data.docPaths)
      ? (data.docPaths as string[]).filter(Boolean)
      : (typeof data.docPath === "string" && data.docPath.trim() ? [data.docPath.trim()] : []);

    const totalDocs = data.docPaths !== undefined || data.docPath !== undefined ? incomingDocs : existingDocs;

    if (totalDocs.length === 0) {
      return NextResponse.json(
        { error: "Cannot approve or complete MOU without uploaded signed document / proof" },
        { status: 422 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  if (typeof data.status === "string" && data.status !== existing.status) {
    if (!canTransitionMou(existing.status as MouStatus, data.status as MouStatus)) {
      return NextResponse.json(
        { error: `Illegal status transition: ${existing.status} → ${data.status}` },
        { status: 400 },
      );
    }
  }

  try {
    const mou = await prisma.mou.update({ where: { id }, data });
    return NextResponse.json(mou);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.mou.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }

  try {
    await prisma.mou.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "MOU not found" }, { status: 404 });
    }
    throw e;
  }
}
