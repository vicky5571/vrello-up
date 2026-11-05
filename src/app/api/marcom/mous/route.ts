import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MOU_STATUSES } from "@/lib/marcom/mouMachine";

const VALID_STATUSES = MOU_STATUSES;
const CREATABLE_STATUSES = ["DRAFT", "SUBMITTED"] as const;

const mouInclude = {
  branch: { select: { id: true, code: true, name: true } },
  outlet: { select: { id: true, code: true, name: true } },
  placements: {
    select: {
      id: true,
      mouId: true,
      status: true,
      cost: true,
      photoUrl: true,
      material: { select: { id: true, name: true, type: true, requiresMou: true } },
    },
  },
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get("branchId") ?? searchParams.get("branch");
    const outletId = searchParams.get("outletId");
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.toLowerCase();

    if (status && status !== "ALL" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const where: Prisma.MouWhereInput = {};
    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }
    if (outletId && outletId !== "ALL") {
      where.outletId = outletId;
    }
    if (status && status !== "ALL") {
      where.status = status as (typeof VALID_STATUSES)[number];
    }
    if (query) {
      const contains = { contains: query, mode: "insensitive" as const };
      where.OR = [{ partnerName: contains }, { mouType: contains }, { outletName: contains }, { picName: contains }, { picPhone: contains }, { notes: contains }];
    }

    const mous = await prisma.mou.findMany({
      where,
      orderBy: { id: "asc" },
      include: mouInclude,
    });
    return NextResponse.json({ total: mous.length, data: mous });
  } catch (error) {
    console.error("[api/marcom/mous] GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const {
    branchId,
    outletId,
    outletName,
    partnerName,
    mouType,
    submissionDate,
    startDate,
    endDate,
    status,
    picName,
    picPhone,
    docPath,
    docPaths,
    compensationValue,
    notes,
  } = body ?? {};
  if (!branchId || !partnerName || !mouType) {
    return NextResponse.json({ error: "Missing required fields: branchId, partnerName, mouType" }, { status: 400 });
  }
  if (status !== undefined && !(CREATABLE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status: only DRAFT or SUBMITTED can be set on creation" }, { status: 400 });
  }

  const cleanDocPaths: string[] = Array.isArray(docPaths)
    ? docPaths.filter((p: unknown) => typeof p === "string" && p.trim() !== "").map((p: string) => p.trim())
    : [];
  const primaryDocPath =
    typeof docPath === "string" && docPath.trim()
      ? docPath.trim()
      : cleanDocPaths[0] || "";
  if (primaryDocPath && !cleanDocPaths.includes(primaryDocPath)) {
    cleanDocPaths.unshift(primaryDocPath);
  }

  const targetOutletId = typeof outletId === "string" && outletId.trim() && outletId !== "NONE" ? outletId.trim() : null;
  const targetOutletName = typeof outletName === "string" ? outletName : "";

  try {
    const mou = await prisma.mou.create({
      data: {
        branchId,
        outletId: targetOutletId,
        outletName: targetOutletName,
        partnerName,
        mouType,
        submissionDate: submissionDate ? new Date(submissionDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        picName: picName ?? "",
        picPhone: picPhone ?? "",
        docPath: primaryDocPath,
        docPaths: cleanDocPaths,
        compensationValue,
        notes,
      },
      include: mouInclude,
    });
    return NextResponse.json(mou, { status: 201 });
  } catch (e) {
    console.error("[MOU POST] failed", e, { branchId, partnerName, mouType });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Branch or Outlet not found" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No MOU IDs provided" }, { status: 400 });
    }

    const result = await prisma.mou.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    console.error("Error batch deleting MOUs:", error);
    return NextResponse.json({ error: "Failed to batch delete MOUs" }, { status: 500 });
  }
}
