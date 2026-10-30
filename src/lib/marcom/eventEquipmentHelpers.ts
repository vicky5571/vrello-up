import type { BorrowRecord } from "@/types";

export interface EventEquipmentSummary {
  recordCount: number;
  totalUnits: number;
  hasOverdue: boolean;
  hasActive: boolean;
  hasPending: boolean;
  statusText: string;
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

  let statusText = `${totalUnits} Unit Alat`;
  if (hasOverdue) {
    statusText = `${totalUnits} Unit (Overdue)`;
  }

  return {
    recordCount: eventBorrows.length,
    totalUnits,
    hasOverdue,
    hasActive,
    hasPending,
    statusText,
  };
}
