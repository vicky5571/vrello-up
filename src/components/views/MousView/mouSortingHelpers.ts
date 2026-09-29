import type { MouStatus, MarcomMou } from "@/types";

export const MOU_STATUS_ORDER: Record<MouStatus, number> = {
  DRAFT: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  DONE: 4,
  REJECTED: 5,
};

export function compareMouStatus(statusA: MouStatus, statusB: MouStatus): number {
  const orderA = MOU_STATUS_ORDER[statusA] ?? 99;
  const orderB = MOU_STATUS_ORDER[statusB] ?? 99;
  return orderA - orderB;
}

export const MOU_SEARCH_KEYS: (keyof MarcomMou)[] = [
  "partnerName",
  "outletName",
  "mouType",
  "picName",
  "picPhone",
  "notes",
];
