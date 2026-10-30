import { NextResponse } from "next/server";
import { EquipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const VALID_STATUSES: EquipmentStatus[] = ["AVAILABLE", "BORROWED", "MAINTENANCE", "RETIRED"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const {
      name,
      code,
      category,
      brand,
      description,
      totalUnits,
      storageLocation,
      status,
      notes,
      photoUrl,
    } = body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = String(name).trim();
    if (category !== undefined) data.category = String(category).trim();
    if (brand !== undefined) data.brand = String(brand).trim();
    if (description !== undefined) data.description = String(description).trim();
    if (storageLocation !== undefined) data.storageLocation = String(storageLocation).trim();
    if (notes !== undefined) data.notes = String(notes).trim();
    if (photoUrl !== undefined) data.photoUrl = String(photoUrl).trim();

    if (code !== undefined) {
      const trimmedCode = String(code).trim().toUpperCase();
      if (trimmedCode !== existing.code) {
        const duplicate = await prisma.inventoryItem.findUnique({
          where: { code: trimmedCode },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: `Item with code "${trimmedCode}" already exists` },
            { status: 409 }
          );
        }
        data.code = trimmedCode;
      }
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as EquipmentStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status as EquipmentStatus;
    }

    if (totalUnits !== undefined) {
      const parsedTotal = parseInt(String(totalUnits), 10);
      if (isNaN(parsedTotal) || parsedTotal < 1) {
        return NextResponse.json(
          { error: "totalUnits must be a positive integer" },
          { status: 400 }
        );
      }

      // Spec §3.4 & AC-15: If totalUnits is decreased below the current availableUnits, return 422
      if (parsedTotal < existing.availableUnits) {
        return NextResponse.json(
          { error: "totalUnits cannot be less than availableUnits — units are currently out on loan" },
          { status: 422 }
        );
      }

      const currentlyBorrowed = existing.totalUnits - existing.availableUnits;
      if (parsedTotal < currentlyBorrowed) {
        return NextResponse.json(
          { error: "totalUnits cannot be less than availableUnits — units are currently out on loan" },
          { status: 422 }
        );
      }

      data.totalUnits = parsedTotal;
      data.availableUnits = parsedTotal - currentlyBorrowed;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Spec §3.5 & AC-14: Blocked with HTTP 409 if any BorrowItem referencing this item
    // exists with parent BorrowRecord.status of ACTIVE or APPROVED
    const activeBorrow = await prisma.borrowItem.findFirst({
      where: {
        inventoryItemId: id,
        borrowRecord: {
          status: { in: ["ACTIVE", "APPROVED"] },
        },
      },
    });

    if (activeBorrow) {
      return NextResponse.json(
        { error: "Cannot delete item with active or approved borrow records" },
        { status: 409 }
      );
    }

    // Cascade delete any remaining borrow items (from completed/cancelled borrows)
    await prisma.borrowItem.deleteMany({
      where: { inventoryItemId: id },
    });

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
