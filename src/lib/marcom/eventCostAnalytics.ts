import { formatIDR } from "@/lib/utils";

export type EventEfficiencyCategory = "HIGH" | "MODERATE" | "LOW" | "PROJECTION";

export interface EventUnitEconomics {
  costPerAttendee: number;
  targetCostPerAttendee: number;
  attendanceRate: number;
  efficiencyVariance: number;
  efficiencyCategory: EventEfficiencyCategory;
  efficiencyLabel: string;
}

export interface EventCostInput {
  status?: string | null;
  budget?: number | null;
  actualCost?: number | null;
  targetAttendee?: number | null;
  attendeeCount?: number | null;
}

/**
 * Calculates event unit economics (cost per attendee and target ROI).
 * Safe against division by zero and negative values.
 * Supports actualCost with graceful fallback to planned budget.
 */
export function calculateEventUnitEconomics(event: EventCostInput): EventUnitEconomics {
  const budget = Math.max(0, Number(event.budget) || 0);
  const cost =
    event.actualCost !== undefined && event.actualCost !== null
      ? Math.max(0, Number(event.actualCost) || 0)
      : budget;
  const target = Math.max(0, Number(event.targetAttendee) || 0);
  const actual = Math.max(0, Number(event.attendeeCount) || 0);

  const costPerAttendee = actual > 0 ? Math.round(cost / actual) : 0;
  const targetCostPerAttendee = target > 0 ? Math.round(budget / target) : 0;
  const attendanceRate = target > 0 ? Math.round((actual / target) * 100) : 0;

  let efficiencyVariance = 0;
  if (targetCostPerAttendee > 0 && costPerAttendee > 0) {
    efficiencyVariance = Math.round(
      ((targetCostPerAttendee - costPerAttendee) / targetCostPerAttendee) * 100
    );
  }

  let efficiencyCategory: EventEfficiencyCategory = "PROJECTION";
  let efficiencyLabel = "Proyeksi Anggaran";

  if (actual > 0) {
    if (attendanceRate >= 100 && (costPerAttendee <= targetCostPerAttendee || targetCostPerAttendee === 0)) {
      efficiencyCategory = "HIGH";
      efficiencyLabel =
        efficiencyVariance > 0
          ? `✓ Efisien (+${efficiencyVariance}% Hemat)`
          : "✓ Capai Target";
    } else if (attendanceRate >= 75) {
      efficiencyCategory = "MODERATE";
      efficiencyLabel = `${attendanceRate}% Target (On Track)`;
    } else {
      efficiencyCategory = "LOW";
      efficiencyLabel =
        event.status === "COMPLETED"
          ? `${attendanceRate}% Target (Perlu Evaluasi)`
          : `${attendanceRate}% Target`;
    }
  } else if (targetCostPerAttendee > 0) {
    efficiencyCategory = "PROJECTION";
    efficiencyLabel = `Target: ${formatIDR(targetCostPerAttendee)} / org`;
  }

  return {
    costPerAttendee,
    targetCostPerAttendee,
    attendanceRate,
    efficiencyVariance,
    efficiencyCategory,
    efficiencyLabel,
  };
}

export function getEfficiencyBadgeClasses(category: EventEfficiencyCategory): string {
  switch (category) {
    case "HIGH":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    case "MODERATE":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
    case "LOW":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    case "PROJECTION":
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}
