import type { BorrowRecord } from "@/types";

export interface UnreturnedEquipmentItem {
  id: string;
  borrowCode: string;
  borrowerName: string;
  borrowerPhone?: string;
  returnDueDate?: string | Date | null;
  status: "ACTIVE" | "OVERDUE" | "PENDING" | "APPROVED";
  itemsSummary: string;
  unitsCount: number;
}

export interface EventEquipmentSummary {
  recordCount: number;
  totalUnits: number;
  hasOverdue: boolean;
  hasActive: boolean;
  hasPending: boolean;
  hasUnreturned: boolean; // ponytail: debt DEBT-EVENT-LOGISTICS-001 (true if any unreturned items)
  statusText: string;
  unreturnedList: UnreturnedEquipmentItem[];
}

/**
 * Computes an aggregated equipment summary for a given event from the borrow records cache.
 * Returns null if no equipment is associated with this event.
 */
export function getEventEquipmentSummary(
  borrowRecords: BorrowRecord[] | undefined,
  eventId: string
): EventEquipmentSummary | null {
  if (!eventId || !Array.isArray(borrowRecords) || borrowRecords.length === 0) {
    return null;
  }

  const eventBorrows = borrowRecords.filter((b) => b.eventId === eventId);
  if (eventBorrows.length === 0) {
    return null;
  }

  const totalUnits = eventBorrows.reduce(
    (acc, b) =>
      acc + (b.items?.reduce((iAcc, it) => iAcc + (it.quantity || 1), 0) || 0),
    0
  );

  const hasOverdue = eventBorrows.some((b) => b.status === "OVERDUE");
  const hasActive = eventBorrows.some((b) => b.status === "ACTIVE");
  const hasPending = eventBorrows.some(
    (b) => b.status === "PENDING" || b.status === "APPROVED"
  );
  const hasUnreturned = hasOverdue || hasActive || hasPending;

  let statusText = `${totalUnits} Unit Alat`;
  if (hasOverdue) {
    statusText = `${totalUnits} Unit (Overdue)`;
  } else if (hasUnreturned) {
    statusText = `${totalUnits} Unit (Di Lapangan)`;
  }

  const unreturnedList: UnreturnedEquipmentItem[] = eventBorrows
    .filter(
      (b) =>
        b.status === "OVERDUE" ||
        b.status === "ACTIVE" ||
        b.status === "PENDING" ||
        b.status === "APPROVED"
    )
    .map((b) => {
      const itemsSummary =
        (b.items || [])
          .map((it) => `${it.inventoryItem?.name || "Alat"} ×${it.quantity || 1}`)
          .join(", ") || "Tidak ada daftar alat";

      const unitsCount = (b.items || []).reduce(
        (acc, it) => acc + (it.quantity || 1),
        0
      );

      return {
        id: b.id,
        borrowCode: b.borrowCode,
        borrowerName: b.borrowerName,
        borrowerPhone: b.borrowerPhone,
        returnDueDate: b.returnDueDate,
        status: b.status as "ACTIVE" | "OVERDUE" | "PENDING" | "APPROVED",
        itemsSummary,
        unitsCount,
      };
    });

  return {
    recordCount: eventBorrows.length,
    totalUnits,
    hasOverdue,
    hasActive,
    hasPending,
    hasUnreturned,
    statusText,
    unreturnedList,
  };
}
