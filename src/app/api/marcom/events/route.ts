import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_STATUSES = ["UPCOMING", "ON_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const eventInclude = {
  footage: true,
} as const;

async function requireEventWriter() {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw e;
  }
  if (!hasPermission(role, "CREATE_EVENT")) {
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase();

  if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const where: Prisma.MarcomEventWhereInput = {};
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
  return NextResponse.json({ total: events.length, data: events });
}

export async function POST(request: Request) {
  try {
    await requireEventWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
  const { name, date, endDate, location, branchName, picName, eventType, status, budget, attendeeCount, targetAttendee, notes, postPlatform, postFormat, mediaUrl } = body ?? {};
  if (!name || !eventType) {
    return NextResponse.json({ error: "Missing required fields: name, eventType" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const event = await prisma.marcomEvent.create({
    data: {
      name,
      date: date ? new Date(date) : undefined,
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
    },
    include: eventInclude,
  });
  return NextResponse.json(event, { status: 201 });
}
