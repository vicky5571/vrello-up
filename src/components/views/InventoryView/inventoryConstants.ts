import type { EquipmentStatus, BorrowStatus, EquipmentCondition } from "@/types";

export const EQUIPMENT_CATEGORIES = [
  "Furniture",
  "Branding",
  "Audio",
  "Display",
  "Logistics",
  "Lighting",
  "Other",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_STATUS_CONFIG: Record<
  EquipmentStatus,
  { label: string; badge: string }
> = {
  AVAILABLE: {
    label: "Available",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  BORROWED: {
    label: "Borrowed",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  MAINTENANCE: {
    label: "Maintenance",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  RETIRED: {
    label: "Retired",
    badge: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
  },
};

export const BORROW_STATUS_CONFIG: Record<
  BorrowStatus,
  { label: string; badge: string; column: string }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    column: "Pending Approval",
  },
  APPROVED: {
    label: "Approved",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    column: "Approved",
  },
  ACTIVE: {
    label: "Active",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    column: "In Use",
  },
  OVERDUE: {
    label: "Overdue",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    column: "In Use",
  },
  RETURNED: {
    label: "Returned",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    column: "Returned",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-slate-400/10 text-slate-400 dark:text-slate-500 border-slate-400/20",
    column: "",
  },
};

export const CONDITION_CONFIG: Record<
  EquipmentCondition,
  { label: string; badge: string }
> = {
  GOOD: {
    label: "Good",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  MINOR_DAMAGE: {
    label: "Minor Damage",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  MAJOR_DAMAGE: {
    label: "Major Damage",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  LOST: {
    label: "Lost",
    badge: "bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-700/30",
  },
};
