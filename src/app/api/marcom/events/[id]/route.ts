import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import { canTransitionEvent, type EventStatus } from "@/lib/marcom/eventMachine";

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
] as const;

const eventInclude = {
  footage: true,
} as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.fieldEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body?.[field] !== undefined) {
      if (field === "startDate" || field === "date") {
        data["startDate"] = body[field] ? new Date(body[field] as string) : null;
      } else if (field === "endDate") {
        data[field] = typeof body[field] === "string" && body[field] ? new Date(body[field] as string) : null;
      } else {
        data[field] = body[field];
      }
    }
  }
  if (data.status !== undefined) {
    if (!VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const fromStatus = existing.status as EventStatus;
    const toStatus = data.status as EventStatus;
    if (!canTransitionEvent(fromStatus, toStatus)) {
      return NextResponse.json(
        { error: `Cannot transition event status from ${fromStatus} to ${toStatus}` },
        { status: 400 }
      );
    }
  }

  const effectiveStartDate = data["startDate"] !== undefined ? (data["startDate"] as Date | null) : existing.startDate;
  const effectiveEndDate = data["endDate"] !== undefined ? (data["endDate"] as Date | null) : existing.endDate;

  if (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    return NextResponse.json({ error: "endDate cannot be earlier than startDate" }, { status: 400 });
  }

  if (body?.footage !== undefined && Array.isArray(body.footage)) {
    const rawFootage = body.footage as Array<{
      title?: unknown;
      filePath?: unknown;
      duration?: unknown;
    }>;
    const footageData = rawFootage
      .filter((f) => f && (f.title || f.filePath))
      .map((f) => ({
        title: String(f.title || "Footage").trim(),
        filePath: String(f.filePath || "").trim(),
        duration: String(f.duration || "").trim(),
      }))
      .filter((f) => f.filePath);

    data["footage"] = {
      deleteMany: {},
      create: footageData,
    };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const event = await prisma.fieldEvent.update({ where: { id }, data, include: eventInclude });
    return NextResponse.json({
      ...event,
      startDate: event.startDate ? event.startDate.toISOString() : null,
      date: event.startDate ? event.startDate.toISOString() : null,
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
  const existing = await prisma.fieldEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  try {
    await prisma.fieldEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    throw e;
  }
}
