import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";

const VALID_TYPES = ["POSTER", "SHOPBLIND", "BANNER", "BRANDING_SIGNBOARD", "OTHER_MATERIALS"] as const;

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = searchParams.get("q")?.toLowerCase();

  if (type && type !== "ALL" && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const where: Prisma.MaterialWhereInput = {};
  if (type && type !== "ALL") {
    where.type = type as (typeof VALID_TYPES)[number];
  }
  if (query) {
    where.name = { contains: query, mode: "insensitive" };
  }

  const materials = await prisma.material.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ total: materials.length, data: materials });
}

export async function POST(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
  const { type, name } = body ?? {};
  if (!type || !name) {
    return NextResponse.json({ error: "Missing required fields: type, name" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const material = await prisma.material.create({ data: { type, name } });
  return NextResponse.json(material, { status: 201 });
}
