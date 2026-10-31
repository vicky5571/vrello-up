import { NextResponse } from "next/server";
import { BorrowStatus } from "@prisma/client";
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
  status?: string;
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
  let currentStatus = record.status;
  if (currentStatus === "ACTIVE" && record.returnDueDate && new Date(record.returnDueDate) < new Date()) {
    currentStatus = "OVERDUE";
  }

  return {
    ...record,
    status: currentStatus,
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

const ALLOWED_TRANSITIONS: Record<BorrowStatus, BorrowStatus[]> = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["OVERDUE"], // RETURNED is handled by /return endpoint
  OVERDUE: [],         // RETURNED is handled by /return endpoint
  RETURNED: [],
  CANCELLED: [],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.borrowRecord.findUnique({
      where: { id },
      include: recordInclude,
    });

    if (!record) {
      return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeBorrowRecord(record));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch borrow record";
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

    const existing = await prisma.borrowRecord.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });
    }

    const { status, notes, picName, purpose, eventLocation, approvedBy } = body;

    // Reject direct status update to RETURNED via PUT handler
    if (status === "RETURNED") {
      return NextResponse.json(
        { error: "Returns must be processed via the /return endpoint" },
        { status: 422 }
      );
    }

    if (status && status !== existing.status) {
      const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(status as BorrowStatus)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${existing.status} to ${status}` },
          { status: 422 }
        );
      }
    }

    // Handle transition side effects
    if (status === "ACTIVE" && existing.status === "APPROVED") {
      // Check availability and decrement units atomically
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          const inv = await tx.inventoryItem.findUnique({
            where: { id: item.inventoryItemId },
          });

          if (!inv || inv.availableUnits < item.quantity) {
            throw new Error(
              `Insufficient units for "${inv?.name || item.inventoryItemId}": requested ${item.quantity}, available ${inv?.availableUnits ?? 0}`
            );
          }

          const newAvailable = inv.availableUnits - item.quantity;
          await tx.inventoryItem.update({
            where: { id: inv.id },
            data: {
              availableUnits: newAvailable,
              status: newAvailable === 0 ? "BORROWED" : inv.status,
            },
          });
        }

        return tx.borrowRecord.update({
          where: { id },
          data: {
            status: "ACTIVE",
            ...(notes !== undefined ? { notes: String(notes).trim() } : {}),
            ...(picName !== undefined ? { picName: String(picName).trim() } : {}),
            ...(purpose !== undefined ? { purpose: String(purpose).trim() } : {}),
            ...(eventLocation !== undefined ? { eventLocation: String(eventLocation).trim() } : {}),
          },
          include: recordInclude,
        });
      });

      return NextResponse.json(normalizeBorrowRecord(updated));
    }

    // Normal update
    const updateData: Record<string, unknown> = {};
    if (notes !== undefined) updateData.notes = String(notes).trim();
    if (picName !== undefined) updateData.picName = String(picName).trim();
    if (purpose !== undefined) updateData.purpose = String(purpose).trim();
    if (eventLocation !== undefined) updateData.eventLocation = String(eventLocation).trim();

    if (status) {
      updateData.status = status;
      if (status === "APPROVED" && existing.status === "PENDING") {
        updateData.approvedBy = String(approvedBy || "Admin").trim();
        updateData.approvedAt = new Date();
      }
    }

    const updated = await prisma.borrowRecord.update({
      where: { id },
      data: updateData,
      include: recordInclude,
    });

    return NextResponse.json(normalizeBorrowRecord(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update borrow record";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
