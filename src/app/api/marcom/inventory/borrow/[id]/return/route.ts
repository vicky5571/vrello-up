import { NextResponse } from "next/server";
import { EquipmentCondition } from "@prisma/client";
import { prisma } from "@/lib/db";

const recordInclude = {
  event: { select: { id: true, name: true } },
  items: {
    include: {
      inventoryItem: true,
    },
  },
} as const;

interface RawBorrowItem {
  inventoryItem?: {
    createdAt?: Date | null;
    updatedAt?: Date | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

interface RawBorrowRecord {
  borrowDate?: Date | null;
  returnDueDate?: Date | string | null;
  returnDate?: Date | null;
  approvedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  items?: RawBorrowItem[];
  [key: string]: unknown;
}

function normalizeBorrowRecord(record: RawBorrowRecord) {
  return {
    ...record,
    borrowDate: record.borrowDate ? record.borrowDate.toISOString() : null,
    returnDueDate: record.returnDueDate ? new Date(record.returnDueDate).toISOString() : null,
    returnDate: record.returnDate ? record.returnDate.toISOString() : null,
    approvedAt: record.approvedAt ? record.approvedAt.toISOString() : null,
    createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    items: (record.items || []).map((item: RawBorrowItem) => ({
      ...item,
      inventoryItem: item.inventoryItem
        ? {
            ...item.inventoryItem,
            createdAt: item.inventoryItem.createdAt?.toISOString(),
            updatedAt: item.inventoryItem.updatedAt?.toISOString(),
          }
        : undefined,
    })),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.borrowRecord.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });
    }

    // Only ACTIVE or OVERDUE can be returned
    const isOverdue = existing.status === "ACTIVE" && new Date(existing.returnDueDate) < new Date();
    const canReturn = existing.status === "ACTIVE" || existing.status === "OVERDUE" || isOverdue;

    if (!canReturn) {
      return NextResponse.json(
        { error: `Cannot return record with status ${existing.status}. Only ACTIVE or OVERDUE records can be returned.` },
        { status: 422 }
      );
    }

    const { returnDate, returnNotes = "", items = [] } = body;
    const parsedReturnDate = returnDate ? new Date(returnDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Process items condition and restore inventory units
      const itemMap = new Map<string, { conditionIn: EquipmentCondition; notes?: string }>();
      if (Array.isArray(items)) {
        for (const it of items) {
          if (it.borrowItemId) {
            itemMap.set(it.borrowItemId, {
              conditionIn: (it.conditionIn as EquipmentCondition) || "GOOD",
              notes: it.notes,
            });
          }
        }
      }

      for (const bi of existing.items) {
        const itemUpdate = itemMap.get(bi.id);
        const conditionIn: EquipmentCondition = itemUpdate?.conditionIn || "GOOD";
        const itemNotes = itemUpdate?.notes !== undefined ? itemUpdate.notes : bi.notes;

        // Update BorrowItem
        await tx.borrowItem.update({
          where: { id: bi.id },
          data: {
            conditionIn,
            notes: itemNotes,
          },
        });

        // If not LOST, restore availableUnits on InventoryItem
        if (conditionIn !== "LOST") {
          const inv = await tx.inventoryItem.findUnique({
            where: { id: bi.inventoryItemId },
          });

          if (inv) {
            const restoredUnits = Math.min(inv.totalUnits, inv.availableUnits + bi.quantity);
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: {
                availableUnits: restoredUnits,
                status: restoredUnits > 0 && inv.status === "BORROWED" ? "AVAILABLE" : inv.status,
              },
            });
          }
        }
      }

      // 2. Update BorrowRecord to RETURNED
      return tx.borrowRecord.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnDate: parsedReturnDate,
          returnNotes: String(returnNotes).trim(),
        },
        include: recordInclude,
      });
    });

    return NextResponse.json(normalizeBorrowRecord(result));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process return";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
