/**
 * Inventory Booking Collision Detection Engine (ADR-0102)
 *
 * Implements interval math across [borrowDate, returnDueDate] to determine
 * remaining capacity per day, detect overbooking collisions, and surface
 * tight-schedule warnings (T+0, T+1) without hard artificial buffer days.
 */

export interface BookingItemRequest {
  inventoryItemId: string;
  quantity: number;
}

export interface ExistingBookingItem {
  inventoryItemId: string;
  quantity: number;
  borrowCode: string;
  borrowDate: string; // ISO YYYY-MM-DD
  returnDueDate: string; // ISO YYYY-MM-DD
  status: "APPROVED" | "ACTIVE" | "OVERDUE";
  borrowRecordId?: string;
}

export interface ItemMasterCapacity {
  id: string;
  name: string;
  totalUnits: number;
}

export interface CollisionConflict {
  inventoryItemId: string;
  itemName: string;
  requestedQuantity: number;
  availableCapacity: number;
  conflictingDates: string[];
  conflictingBorrowCodes: string[];
}

export interface TightScheduleDetail {
  inventoryItemId: string;
  itemName: string;
  conflictingBorrowCode: string;
  precedingReturnDueDate: string;
  gapDays: number; // 0 for same day, 1 for next day
}

export interface CollisionCheckResult {
  hasConflict: boolean;
  conflicts: CollisionConflict[];
  isTightSchedule: boolean;
  tightScheduleDetails: TightScheduleDetail[];
}

/**
 * Parses YYYY-MM-DD safely into UTC midnight Date object.
 */
export function parseDateUtc(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    const y = dateStr.getUTCFullYear();
    const m = dateStr.getUTCMonth();
    const d = dateStr.getUTCDate();
    return new Date(Date.UTC(y, m, d));
  }
  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split("-").map(Number);
  if (parts.length < 3 || parts.some((p) => isNaN(p))) {
    return new Date(NaN);
  }
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
export function formatDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns an inclusive list of YYYY-MM-DD date strings in the given range.
 */
export function getDatesInRange(startDate: string | Date, endDate: string | Date): string[] {
  const dates: string[] = [];
  const start = parseDateUtc(startDate);
  const end = parseDateUtc(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return dates;
  }

  const curr = new Date(start);
  while (curr <= end) {
    dates.push(formatDateUtc(curr));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Evaluates booking collision and tight schedules across requested date intervals.
 */
export function checkBookingCollision(params: {
  requestedItems: BookingItemRequest[];
  borrowDate: string | Date;
  returnDueDate: string | Date;
  existingBookings: ExistingBookingItem[];
  itemCapacities: Map<string, ItemMasterCapacity>;
  excludeBorrowRecordId?: string;
}): CollisionCheckResult {
  const {
    requestedItems,
    borrowDate,
    returnDueDate,
    existingBookings,
    itemCapacities,
    excludeBorrowRecordId,
  } = params;

  const reqDates = getDatesInRange(borrowDate, returnDueDate);
  const conflicts: CollisionConflict[] = [];
  const tightScheduleDetails: TightScheduleDetail[] = [];

  const reqStartUtc = parseDateUtc(borrowDate).getTime();

  for (const reqItem of requestedItems) {
    const itemCap = itemCapacities.get(reqItem.inventoryItemId);
    const totalUnits = itemCap ? Math.max(0, itemCap.totalUnits) : 0;
    const itemName = itemCap ? itemCap.name : reqItem.inventoryItemId;

    // Filter relevant existing bookings for this inventory item
    const relevantExisting = existingBookings.filter((b) => {
      if (b.inventoryItemId !== reqItem.inventoryItemId) return false;
      if (excludeBorrowRecordId && b.borrowRecordId === excludeBorrowRecordId) return false;
      return b.status === "APPROVED" || b.status === "ACTIVE" || b.status === "OVERDUE";
    });

    // 1. Calculate daily load & find conflicting dates
    const conflictingDatesSet = new Set<string>();
    const conflictingCodesSet = new Set<string>();
    let minRemainingCapacity = totalUnits;

    for (const d of reqDates) {
      const dTime = parseDateUtc(d).getTime();

      let allocatedToday = 0;
      for (const b of relevantExisting) {
        const bStart = parseDateUtc(b.borrowDate).getTime();
        const bEnd = parseDateUtc(b.returnDueDate).getTime();

        if (dTime >= bStart && dTime <= bEnd) {
          allocatedToday += b.quantity;
          if (allocatedToday + reqItem.quantity > totalUnits) {
            conflictingDatesSet.add(d);
            conflictingCodesSet.add(b.borrowCode);
          }
        }
      }

      const remainingToday = Math.max(0, totalUnits - allocatedToday);
      if (remainingToday < minRemainingCapacity) {
        minRemainingCapacity = remainingToday;
      }
    }

    if (conflictingDatesSet.size > 0) {
      conflicts.push({
        inventoryItemId: reqItem.inventoryItemId,
        itemName,
        requestedQuantity: reqItem.quantity,
        availableCapacity: minRemainingCapacity,
        conflictingDates: Array.from(conflictingDatesSet).sort(),
        conflictingBorrowCodes: Array.from(conflictingCodesSet),
      });
    }

    // 2. Tight schedule detection (T+0 or T+1 relative to preceding returnDueDate)
    if (!isNaN(reqStartUtc)) {
      for (const b of relevantExisting) {
        const bEndUtc = parseDateUtc(b.returnDueDate).getTime();
        if (isNaN(bEndUtc)) continue;

        const diffDays = Math.round((reqStartUtc - bEndUtc) / 86400000);
        if (diffDays === 0 || diffDays === 1) {
          tightScheduleDetails.push({
            inventoryItemId: reqItem.inventoryItemId,
            itemName,
            conflictingBorrowCode: b.borrowCode,
            precedingReturnDueDate: formatDateUtc(parseDateUtc(b.returnDueDate)),
            gapDays: diffDays,
          });
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    isTightSchedule: tightScheduleDetails.length > 0,
    tightScheduleDetails,
  };
}

/**
 * Calculates remaining available capacity for a specific item across requested dates.
 */
export function calculateItemRemainingCapacity(params: {
  inventoryItemId: string;
  totalUnits: number;
  borrowDate: string | Date;
  returnDueDate: string | Date;
  existingBookings: ExistingBookingItem[];
  excludeBorrowRecordId?: string;
}): number {
  const {
    inventoryItemId,
    totalUnits,
    borrowDate,
    returnDueDate,
    existingBookings,
    excludeBorrowRecordId,
  } = params;

  const dates = getDatesInRange(borrowDate, returnDueDate);
  if (dates.length === 0) return totalUnits;

  const relevant = existingBookings.filter(
    (b) =>
      b.inventoryItemId === inventoryItemId &&
      (!excludeBorrowRecordId || b.borrowRecordId !== excludeBorrowRecordId) &&
      (b.status === "APPROVED" || b.status === "ACTIVE" || b.status === "OVERDUE")
  );

  let minRemaining = totalUnits;

  for (const d of dates) {
    const dTime = parseDateUtc(d).getTime();
    let allocated = 0;
    for (const b of relevant) {
      const bStart = parseDateUtc(b.borrowDate).getTime();
      const bEnd = parseDateUtc(b.returnDueDate).getTime();
      if (dTime >= bStart && dTime <= bEnd) {
        allocated += b.quantity;
      }
    }
    const rem = Math.max(0, totalUnits - allocated);
    if (rem < minRemaining) {
      minRemaining = rem;
    }
  }

  return minRemaining;
}
