import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

const VALID_STATUSES = ["UPCOMING", "ON_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const PATCHABLE_FIELDS = [
  "name",
  "date",
  "startDate",
  "endDate",
  "location",
  "branchName",
  "picName",
  "eventType",
  "status",
  "budget",
  "attendeeCount",
  "targetAttendee",
  "notes",
  "postPlatform",
  "postFormat",
  "mediaUrl",
] as const;

const eventInclude = {
  footage: true,
} as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.marcomEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) {
      if (field === "startDate" && body.date === undefined) {
        data["date"] = body[field] ? new Date(body[field] as string) : null;
      } else if (field === "date" || field === "endDate") {
        data[field] = typeof body[field] === "string" && body[field] ? new Date(body[field] as string) : null;
      } else if (field !== "startDate") {
        data[field] = body[field];
      }
    }
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const effectiveStartDate = data["date"] !== undefined ? (data["date"] as Date | null) : existing.date;
  const effectiveEndDate = data["endDate"] !== undefined ? (data["endDate"] as Date | null) : existing.endDate;

  if (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    return NextResponse.json({ error: "endDate cannot be earlier than startDate" }, { status: 400 });
  }

  if (body?.footage !== undefined && Array.isArray(body.footage)) {
    const footageData = body.footage
      .filter((f: any) => f && (f.title || f.filePath))
      .map((f: any) => ({
        title: String(f.title || "Footage").trim(),
        filePath: String(f.filePath || "").trim(),
        duration: String(f.duration || "").trim(),
      }))
      .filter((f: any) => f.filePath);

    data["footage"] = {
      deleteMany: {},
      create: footageData,
    };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const event = await prisma.marcomEvent.update({ where: { id }, data, include: eventInclude });
    return NextResponse.json({
      ...event,
      startDate: event.date ? event.date.toISOString() : null,
      date: event.date ? event.date.toISOString() : null,
      endDate: event.endDate ? event.endDate.toISOString() : null,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.marcomEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  try {
    await prisma.marcomEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    throw e;
  }
}
