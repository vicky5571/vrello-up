import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

const VALID_STATUSES = ["UPCOMING", "ON_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const eventInclude = {
  footage: true,
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "viewer", request });
  if (authError) return authError;

  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.MarcomEventWhereInput = {
    workspaceId,
  };
  if (status && status !== "ALL") {
    where.status = status as (typeof VALID_STATUSES)[number];
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { location: contains }, { branchName: contains }, { picName: contains }, { eventType: contains }];
  }

  const events = await prisma.marcomEvent.findMany({
    where,
    orderBy: { id: "asc" },
    include: eventInclude,
  });

  const normalizedEvents = events.map((e) => ({
    ...e,
    startDate: e.date ? e.date.toISOString() : null,
    date: e.date ? e.date.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
  }));

  return NextResponse.json({ total: normalizedEvents.length, data: normalizedEvents });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspaceId = body?.workspaceId || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const {
    name,
    date,
    startDate,
    endDate,
    location,
    branchName,
    picName,
    eventType,
    status,
    budget,
    attendeeCount,
    targetAttendee,
    notes,
    postPlatform,
    postFormat,
    mediaUrl,
    footage,
  } = body ?? {};

  if (!name || !eventType) {
    return NextResponse.json({ error: "Missing required fields: name, eventType" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const eventDate = startDate || date;

  if (eventDate && endDate && new Date(endDate) < new Date(eventDate)) {
    return NextResponse.json({ error: "endDate cannot be earlier than startDate" }, { status: 400 });
  }

  const footageData = Array.isArray(footage)
    ? footage
        .filter((f: any) => f && (f.title || f.filePath))
        .map((f: any) => ({
          title: String(f.title || "Footage").trim(),
          filePath: String(f.filePath || "").trim(),
          duration: String(f.duration || "").trim(),
        }))
        .filter((f: any) => f.filePath)
    : [];

  const event = await prisma.marcomEvent.create({
    data: {
      workspaceId,
      name,
      date: eventDate ? new Date(eventDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location,
      branchName,
      picName,
      eventType,
      status,
      budget,
      attendeeCount,
      targetAttendee,
      notes,
      postPlatform,
      postFormat,
      mediaUrl,
      ...(footageData.length > 0 ? { footage: { create: footageData } } : {}),
    },
    include: eventInclude,
  });

  return NextResponse.json({
    ...event,
    startDate: event.date ? event.date.toISOString() : null,
    date: event.date ? event.date.toISOString() : null,
    endDate: event.endDate ? event.endDate.toISOString() : null,
  }, { status: 201 });
}
