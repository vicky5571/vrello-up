import { NextResponse } from "next/server";
import { Prisma, EquipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const VALID_STATUSES: EquipmentStatus[] = ["AVAILABLE", "BORROWED", "MAINTENANCE", "RETIRED"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: Prisma.InventoryItemWhereInput = {};

    if (status && status !== "ALL") {
      if (!VALID_STATUSES.includes(status as EquipmentStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      where.status = status as EquipmentStatus;
    }

    if (category && category !== "ALL") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { code: "asc" },
    });

    const normalized = items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({ total: normalized.length, data: normalized });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      code,
      category,
      brand = "",
      description = "",
      totalUnits = 1,
      storageLocation = "",
      notes = "",
      photoUrl = "",
    } = body;

    if (!name?.trim() || !code?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: "name, code, and category are required" },
        { status: 400 }
      );
    }

    const parsedTotalUnits = Math.max(1, parseInt(String(totalUnits), 10) || 1);

    // Enforce code uniqueness
    const existing = await prisma.inventoryItem.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Item with code "${code.trim().toUpperCase()}" already exists` },
        { status: 409 }
      );
    }

    const created = await prisma.inventoryItem.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category.trim(),
        brand: String(brand).trim(),
        description: String(description).trim(),
        totalUnits: parsedTotalUnits,
        availableUnits: parsedTotalUnits,
        storageLocation: String(storageLocation).trim(),
        photoUrl: String(photoUrl).trim(),
        notes: String(notes).trim(),
        status: "AVAILABLE",
      },
    });

    const normalized = {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    return NextResponse.json(normalized, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
