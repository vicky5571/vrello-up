import { NextResponse } from "next/server";
import { EquipmentCondition } from "@prisma/client";
import { resolveInventoryAuth } from "@/lib/server/inventoryAuth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/marcom/guards";

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

    // Authorization: resolve session and enforce PROCESS_RETURN
    const { role: userRole, isAuthenticated } = await resolveInventoryAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(userRole, "PROCESS_RETURN")) {
      return NextResponse.json(
        { error: "Hanya Admin, Supervisor, atau Warehouse yang dapat memproses pengembalian alat." },
        { status: 403 }
      );
    }

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

    const {
      returnDate,
      returnNotes = "",
      compensationAmount = 0,
      compensationNotes = "",
      compensationStatus,
      damagePhotos = [],
      items = [],
    } = body;
    const parsedReturnDate = returnDate ? new Date(returnDate) : new Date();

    // Validate item breakdown sum
    for (const bi of existing.items) {
      const itemUpdate = Array.isArray(items) ? items.find((it: { borrowItemId: string }) => it.borrowItemId === bi.id) : null;
      if (itemUpdate) {
        // If breakdown fields are passed, validate exact sum
        if (
          itemUpdate.goodUnits !== undefined ||
          itemUpdate.minorDamageUnits !== undefined ||
          itemUpdate.majorDamageUnits !== undefined ||
          itemUpdate.lostUnits !== undefined
        ) {
          const good = Number(itemUpdate.goodUnits || 0);
          const minor = Number(itemUpdate.minorDamageUnits || 0);
          const major = Number(itemUpdate.majorDamageUnits || 0);
          const lost = Number(itemUpdate.lostUnits || 0);

          if (good + minor + major + lost !== bi.quantity) {
            return NextResponse.json(
              { error: `Jumlah unit dialokasikan (${good + minor + major + lost}) harus sama dengan kuantitas pinjam (${bi.quantity}).` },
              { status: 422 }
            );
          }
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalWriteOffAcrossItems = 0;

      for (const bi of existing.items) {
        const itemUpdate = Array.isArray(items) ? items.find((it: { borrowItemId: string }) => it.borrowItemId === bi.id) : null;
        let good = bi.quantity;
        let minor = 0;
        let major = 0;
        let lost = 0;

        if (itemUpdate) {
          if (
            itemUpdate.goodUnits !== undefined ||
            itemUpdate.minorDamageUnits !== undefined ||
            itemUpdate.majorDamageUnits !== undefined ||
            itemUpdate.lostUnits !== undefined
          ) {
            good = Number(itemUpdate.goodUnits || 0);
            minor = Number(itemUpdate.minorDamageUnits || 0);
            major = Number(itemUpdate.majorDamageUnits || 0);
            lost = Number(itemUpdate.lostUnits || 0);
          } else if (itemUpdate.conditionIn) {
            if (itemUpdate.conditionIn === "LOST") {
              lost = bi.quantity;
              good = 0;
            } else if (itemUpdate.conditionIn === "MAJOR_DAMAGE") {
              major = bi.quantity;
              good = 0;
            } else if (itemUpdate.conditionIn === "MINOR_DAMAGE") {
              minor = bi.quantity;
              good = 0;
            }
          }
        }

        const itemNotes = itemUpdate?.notes !== undefined ? itemUpdate.notes : bi.notes;

        const restoredUnits = good + minor;
        const writeOffUnits = major + lost;
        totalWriteOffAcrossItems += writeOffUnits;

        // Determine dominant condition for backwards compatibility
        let conditionIn: EquipmentCondition = "GOOD";
        if (lost > 0) conditionIn = "LOST";
        else if (major > 0) conditionIn = "MAJOR_DAMAGE";
        else if (minor > 0) conditionIn = "MINOR_DAMAGE";

        await tx.borrowItem.update({
          where: { id: bi.id },
          data: {
            conditionIn,
            goodUnits: good,
            minorDamageUnits: minor,
            majorDamageUnits: major,
            lostUnits: lost,
            notes: itemNotes,
          },
        });

        // Update InventoryItem physical master stock
        const inv = await tx.inventoryItem.findUnique({
          where: { id: bi.inventoryItemId },
        });

        if (inv) {
          const newTotal = Math.max(0, inv.totalUnits - writeOffUnits);
          const newAvailable = Math.min(newTotal, inv.availableUnits + restoredUnits);
          const newStatus =
            newAvailable > 0
              ? "AVAILABLE"
              : newTotal > 0
              ? "BORROWED"
              : "RETIRED";

          await tx.inventoryItem.update({
            where: { id: inv.id },
            data: {
              totalUnits: newTotal,
              availableUnits: newAvailable,
              status: newStatus,
            },
          });

          // Post-inspection capacity deficit detection (ADR-0102 / AC-5)
          if (writeOffUnits > 0) {
            const futureRecords = await tx.borrowRecord.findMany({
              where: {
                id: { not: existing.id },
                status: { in: ["APPROVED", "PENDING"] },
                returnDueDate: { gte: parsedReturnDate },
                items: {
                  some: { inventoryItemId: bi.inventoryItemId },
                },
              },
              include: {
                items: true,
              },
            });

            for (const fut of futureRecords) {
              const futItem = fut.items.find((x) => x.inventoryItemId === bi.inventoryItemId);
              if (futItem && futItem.quantity > newTotal) {
                const warningTag = `[DEFICIT_WARNING]: ${writeOffUnits} unit rusak/hilang pada return ${existing.borrowCode}. Verifikasi kesiapan fisik.`;
                if (!fut.notes?.includes("[DEFICIT_WARNING]")) {
                  const updatedNotes = fut.notes ? `${fut.notes}\n${warningTag}` : warningTag;
                  await tx.borrowRecord.update({
                    where: { id: fut.id },
                    data: { notes: updatedNotes },
                  });
                }
              }
            }
          }
        }
      }

      const assignedCompensationStatus =
        totalWriteOffAcrossItems > 0
          ? (compensationStatus || "PENDING_SETTLEMENT")
          : "NONE";

      return tx.borrowRecord.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnDate: parsedReturnDate,
          returnNotes: String(returnNotes).trim(),
          compensationAmount: Number(compensationAmount || 0),
          compensationNotes: String(compensationNotes || "").trim(),
          compensationStatus: assignedCompensationStatus,
          damagePhotos: Array.isArray(damagePhotos) ? damagePhotos : [],
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
