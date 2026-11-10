import { NextResponse } from "next/server";
import { BorrowStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission, type MarcomRole } from "@/lib/marcom/guards";
import {
  checkBookingCollision,
  type ExistingBookingItem,
  type ItemMasterCapacity,
} from "@/lib/marcom/inventoryCollisionEngine";

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

    let session = null;
    try {
      session = await auth();
    } catch {
      // Handled in isolated test environments without Next.js request store
    }

    const roleHeader = request.headers.get("x-user-role");
    if (!session?.user?.id && !roleHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawRole = (roleHeader || session?.user?.role || "viewer").toLowerCase();
    const userRole: MarcomRole =
      rawRole === "admin" || rawRole === "supervisor" || rawRole === "warehouse" || rawRole === "staff"
        ? rawRole
        : "viewer";

    const userName = (
      session?.user?.name ||
      session?.user?.email ||
      (process.env.NODE_ENV !== "production" ? request.headers.get("x-user-name") : null) ||
      "Authorized User"
    ).trim();

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

    const { status, notes, picName, purpose, eventLocation, returnDueDate } = body;

    // Reject direct status update to RETURNED via PUT handler
    if (status === "RETURNED") {
      return NextResponse.json(
        { error: "Returns must be processed via the /return endpoint" },
        { status: 422 }
      );
    }

    const isManager = hasPermission(userRole, "MANAGE_INVENTORY");
    const isRequesterOnPending =
      existing.status === "PENDING" &&
      hasPermission(userRole, "CANCEL_OWN_BORROW") &&
      existing.borrowerName.trim().toLowerCase() === userName.toLowerCase();

    // Guard transition to APPROVED
    if (status === "APPROVED") {
      if (!hasPermission(userRole, "APPROVE_BORROW")) {
        return NextResponse.json(
          { error: "Hanya Admin, Supervisor, atau Warehouse yang dapat menyetujui peminjaman alat." },
          { status: 403 }
        );
      }

      // Re-validate collision on approval (prevent double-approval race conditions)
      if (existing.status === "PENDING") {
        const overlappingOnApproval = await prisma.borrowRecord.findMany({
          where: {
            id: { not: existing.id },
            status: { in: ["APPROVED", "ACTIVE", "OVERDUE"] },
            borrowDate: { lte: existing.returnDueDate },
            returnDueDate: { gte: existing.borrowDate },
          },
          include: { items: true },
        });

        const existingBookings: ExistingBookingItem[] = [];
        for (const rec of overlappingOnApproval) {
          for (const it of rec.items) {
            existingBookings.push({
              inventoryItemId: it.inventoryItemId,
              quantity: it.quantity,
              borrowCode: rec.borrowCode,
              borrowDate: rec.borrowDate.toISOString().slice(0, 10),
              returnDueDate: rec.returnDueDate.toISOString().slice(0, 10),
              status: rec.status as "APPROVED" | "ACTIVE" | "OVERDUE",
              borrowRecordId: rec.id,
            });
          }
        }

        const itemCapacities = new Map<string, ItemMasterCapacity>();
        for (const it of existing.items) {
          if (it.inventoryItem) {
            itemCapacities.set(it.inventoryItemId, {
              id: it.inventoryItemId,
              name: it.inventoryItem.name,
              totalUnits: it.inventoryItem.totalUnits,
            });
          }
        }

        const approvalCheck = checkBookingCollision({
          requestedItems: existing.items.map((it) => ({
            inventoryItemId: it.inventoryItemId,
            quantity: it.quantity,
          })),
          borrowDate: existing.borrowDate.toISOString().slice(0, 10),
          returnDueDate: existing.returnDueDate.toISOString().slice(0, 10),
          existingBookings,
          itemCapacities,
          excludeBorrowRecordId: existing.id,
        });

        if (approvalCheck.hasConflict) {
          return NextResponse.json(
            {
              error: "Tidak dapat menyetujui: unit telah dialokasikan untuk peminjaman lain pada jadwal tersebut.",
              conflicts: approvalCheck.conflicts,
            },
            { status: 422 }
          );
        }
      }
    }

    // Guard transition to ACTIVE
    if (status === "ACTIVE") {
      if (!isManager) {
        return NextResponse.json(
          { error: "Hanya Admin, Supervisor, atau Warehouse yang dapat menyerahkan / mengaktifkan peminjaman alat." },
          { status: 403 }
        );
      }
    }

    // Guard transition to CANCELLED
    if (status === "CANCELLED") {
      if (!isManager && !isRequesterOnPending) {
        return NextResponse.json(
          { error: "Hanya manajer atau peminjam terkait yang dapat membatalkan peminjaman ini." },
          { status: 403 }
        );
      }
    }

    // Guard metadata updates
    const isUpdatingMetadata =
      notes !== undefined ||
      picName !== undefined ||
      purpose !== undefined ||
      eventLocation !== undefined ||
      returnDueDate !== undefined;

    if (isUpdatingMetadata && !isManager && !isRequesterOnPending) {
      return NextResponse.json(
        { error: "Hanya manajer atau peminjam terkait yang dapat memperbarui data peminjaman." },
        { status: 403 }
      );
    }

    if (!status && !isUpdatingMetadata && !isManager && !isRequesterOnPending) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
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

    if (returnDueDate !== undefined) {
      const parsedNewDueDate = new Date(returnDueDate);
      if (isNaN(parsedNewDueDate.getTime())) {
        return NextResponse.json({ error: "Invalid returnDueDate" }, { status: 400 });
      }
      if (parsedNewDueDate < existing.borrowDate) {
        return NextResponse.json(
          { error: "returnDueDate cannot be earlier than borrowDate" },
          { status: 422 }
        );
      }

      // If extending schedule, run collision check
      if (parsedNewDueDate.getTime() > existing.returnDueDate.getTime()) {
        const overlappingForExt = await prisma.borrowRecord.findMany({
          where: {
            id: { not: existing.id },
            status: { in: ["APPROVED", "ACTIVE", "OVERDUE"] },
            borrowDate: { lte: parsedNewDueDate },
            returnDueDate: { gte: existing.returnDueDate },
          },
          include: { items: true },
        });

        const extExistingBookings: ExistingBookingItem[] = [];
        for (const rec of overlappingForExt) {
          for (const it of rec.items) {
            extExistingBookings.push({
              inventoryItemId: it.inventoryItemId,
              quantity: it.quantity,
              borrowCode: rec.borrowCode,
              borrowDate: rec.borrowDate.toISOString().slice(0, 10),
              returnDueDate: rec.returnDueDate.toISOString().slice(0, 10),
              status: rec.status as "APPROVED" | "ACTIVE" | "OVERDUE",
              borrowRecordId: rec.id,
            });
          }
        }

        const itemCapacities = new Map<string, ItemMasterCapacity>();
        for (const it of existing.items) {
          if (it.inventoryItem) {
            itemCapacities.set(it.inventoryItemId, {
              id: it.inventoryItemId,
              name: it.inventoryItem.name,
              totalUnits: it.inventoryItem.totalUnits,
            });
          }
        }

        const extCheck = checkBookingCollision({
          requestedItems: existing.items.map((it) => ({
            inventoryItemId: it.inventoryItemId,
            quantity: it.quantity,
          })),
          borrowDate: existing.borrowDate.toISOString().slice(0, 10),
          returnDueDate: parsedNewDueDate.toISOString().slice(0, 10),
          existingBookings: extExistingBookings,
          itemCapacities,
          excludeBorrowRecordId: existing.id,
        });

        if (extCheck.hasConflict) {
          const conflictCodes = Array.from(
            new Set(extCheck.conflicts.flatMap((c) => c.conflictingBorrowCodes))
          ).join(", ");
          return NextResponse.json(
            {
              error: `Tidak dapat memperpanjang jadwal: bentrok dengan peminjaman lain (${conflictCodes || "jadwal penuh"}).`,
              conflicts: extCheck.conflicts,
            },
            { status: 422 }
          );
        }
      }

      updateData.returnDueDate = parsedNewDueDate;
    }

    if (status) {
      updateData.status = status;
      if (status === "APPROVED" && existing.status === "PENDING") {
        updateData.approvedBy = userName;
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
