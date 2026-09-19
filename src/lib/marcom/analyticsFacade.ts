/**
 * Unified Analytics Facade for Marcom Operations
 * Consolidates fragmented calculations across the workspace into one robust,
 * defensive facade that prevents divide-by-zero, handles status edge-cases,
 * and standardizes financial metrics.
 */

import { calculatePlacementKPIs, type PlacementAnalyticsKPIs } from "@/lib/marcom/placementAnalytics";

/**
 * Defensive division helper that eliminates NaN, Infinity, and divide-by-zero crashes.
 */
export function safeDiv(
  numerator: number,
  denominator: number,
  precision = 0
): number {
  if (
    typeof numerator !== "number" ||
    typeof denominator !== "number" ||
    Number.isNaN(numerator) ||
    Number.isNaN(denominator) ||
    denominator <= 0 ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator)
  ) {
    return 0;
  }
  const val = numerator / denominator;
  if (!Number.isFinite(val)) return 0;
  return precision > 0 ? Number(val.toFixed(precision)) : Math.round(val);
}

export interface ActionableCostPerOutlet {
  totalActiveOutlets: number;
  totalPlacementCost: number;
  totalMouInvestment: number;
  totalCost: number;
  avgCostPerOutlet: number;
  avgPlacementCostPerOutlet: number;
  avgMouInvestmentPerOutlet: number;
}

export interface ActionablePlacementProgress {
  total: number;
  done: number;
  inProgress: number;
  issue: number;
  notStarted: number;
  pendingCount: number;
  donePercentage: number;
  issuePercentage: number;
  totalCost: number;
}

export interface ActionableMouFunnel {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  done: number;
  rejected: number;
  conversionRate: number; // % of total MoUs that reach DONE
  approvalRate: number;   // % of submitted MoUs approved/done
  dropoffStage: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "NONE";
}

export interface ActionableContentAging {
  totalInReview: number;
  avgDaysInReview: number;
  maxDaysInReview: number;
  criticalAgingCount: number; // Posts waiting review > 2 days
}

export interface ActionableEventEfficiency {
  totalEvents: number;
  totalBudget: number;
  totalAttendees: number;
  totalTargetAttendees: number;
  costPerAttendee: number;
  attendanceRate: number;
}

export interface ActionableMarcomMetrics {
  costPerOutlet: ActionableCostPerOutlet;
  placementProgress: ActionablePlacementProgress;
  mouFunnel: ActionableMouFunnel;
  contentAging: ActionableContentAging;
  eventEfficiency: ActionableEventEfficiency;
}

export interface FacadeMouInput {
  status?: string | null;
  compensationValue?: number | null;
  submissionDate?: string | Date | null;
  createdAt?: string | Date | null;
}

export interface FacadePlacementInput {
  status?: string | null;
  cost?: number | null;
  brand?: string | null;
  outletId?: string | null;
}

export interface FacadeContentInput {
  status?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  publishDate?: string | Date | null;
}

export interface FacadeEventInput {
  status?: string | null;
  budget?: number | null;
  attendeeCount?: number | null;
  targetAttendee?: number | null;
}

export interface FacadeOutletInput {
  id?: string;
  active?: boolean | null;
  tier?: string | null;
}

export interface ActionableMarcomInput {
  mous?: FacadeMouInput[] | null;
  placements?: FacadePlacementInput[] | null;
  contents?: FacadeContentInput[] | null;
  events?: FacadeEventInput[] | null;
  outlets?: FacadeOutletInput[] | null;
  now?: Date;
}

/**
 * 1. Cost per Outlet realization (aggregates Placement cost + MoU compensation)
 */
export function calculateCostPerOutlet(
  outlets: FacadeOutletInput[] = [],
  placements: FacadePlacementInput[] = [],
  mous: FacadeMouInput[] = []
): ActionableCostPerOutlet {
  const safeOutlets = Array.isArray(outlets) ? outlets : [];
  const safePlacements = Array.isArray(placements) ? placements : [];
  const safeMous = Array.isArray(mous) ? mous : [];

  const totalActiveOutlets = safeOutlets.filter(
    (o) => o.active !== false
  ).length;

  let totalPlacementCost = 0;
  for (const p of safePlacements) {
    const cost = Number(p.cost);
    if (!Number.isNaN(cost) && cost > 0) {
      totalPlacementCost += cost;
    }
  }

  let totalMouInvestment = 0;
  for (const m of safeMous) {
    const comp = Number(m.compensationValue);
    if (!Number.isNaN(comp) && comp > 0) {
      totalMouInvestment += comp;
    }
  }

  const totalCost = totalPlacementCost + totalMouInvestment;

  return {
    totalActiveOutlets,
    totalPlacementCost,
    totalMouInvestment,
    totalCost,
    avgCostPerOutlet: safeDiv(totalCost, totalActiveOutlets),
    avgPlacementCostPerOutlet: safeDiv(totalPlacementCost, totalActiveOutlets),
    avgMouInvestmentPerOutlet: safeDiv(totalMouInvestment, totalActiveOutlets),
  };
}

/**
 * 2. Placement progress (% DONE & explicitly tracked ISSUE)
 */
export function calculatePlacementProgress(
  placements: FacadePlacementInput[] = []
): ActionablePlacementProgress {
  const safePlacements = Array.isArray(placements) ? placements : [];
  const kpi: PlacementAnalyticsKPIs = calculatePlacementKPIs(
    safePlacements.map((p) => ({
      status: p.status || "NOT_STARTED",
      brand: p.brand,
      cost: p.cost,
    }))
  );

  return {
    total: kpi.totalCount,
    done: kpi.doneCount,
    inProgress: kpi.inProgressCount,
    issue: kpi.issueCount,
    notStarted: kpi.notStartedCount,
    pendingCount: kpi.pendingCount,
    donePercentage: kpi.completionRate,
    issuePercentage: safeDiv(kpi.issueCount * 100, kpi.totalCount),
    totalCost: kpi.totalCost,
  };
}

/**
 * 3. MoU Funnel Pipeline (DRAFT -> SUBMITTED -> APPROVED -> DONE)
 */
export function calculateMouFunnel(
  mous: FacadeMouInput[] = []
): ActionableMouFunnel {
  const safeMous = Array.isArray(mous) ? mous : [];
  let draft = 0;
  let submitted = 0;
  let approved = 0;
  let done = 0;
  let rejected = 0;

  for (const m of safeMous) {
    const st = (m.status || "").toUpperCase();
    if (st === "DRAFT") draft++;
    else if (st === "SUBMITTED") submitted++;
    else if (st === "APPROVED") approved++;
    else if (st === "DONE") done++;
    else if (st === "REJECTED") rejected++;
  }

  const total = safeMous.length;
  const conversionRate = safeDiv(done * 100, total);
  const totalProcessed = submitted + approved + done;
  const approvalRate = safeDiv((approved + done) * 100, totalProcessed);

  let dropoffStage: ActionableMouFunnel["dropoffStage"] = "NONE";
  if (draft > submitted + approved + done && draft > 0) {
    dropoffStage = "DRAFT";
  } else if (submitted > approved + done && submitted > 0) {
    dropoffStage = "SUBMITTED";
  } else if (rejected > 0 && rejected >= approved) {
    dropoffStage = "REJECTED";
  } else if (approved > done && approved > 0) {
    dropoffStage = "APPROVED";
  }

  return {
    total,
    draft,
    submitted,
    approved,
    done,
    rejected,
    conversionRate,
    approvalRate,
    dropoffStage,
  };
}

/**
 * 4. Content Aging in Review (identifies approval bottleneck)
 */
export function calculateContentAging(
  contents: FacadeContentInput[] = [],
  now: Date = new Date()
): ActionableContentAging {
  const safeContents = Array.isArray(contents) ? contents : [];
  let totalInReview = 0;
  let sumDays = 0;
  let maxDaysInReview = 0;
  let criticalAgingCount = 0;

  const nowMs = now.getTime();

  for (const c of safeContents) {
    const st = (c.status || "").toUpperCase();
    if (st === "IN_REVIEW" || st === "REVISION") {
      totalInReview++;
      const rawDate = c.updatedAt || c.createdAt || c.publishDate;
      const parsedDate = rawDate ? new Date(rawDate) : null;

      let days = 0;
      if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
        const diffMs = Math.max(0, nowMs - parsedDate.getTime());
        days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      sumDays += days;
      if (days > maxDaysInReview) {
        maxDaysInReview = days;
      }
      if (days > 2) {
        criticalAgingCount++;
      }
    }
  }

  const avgDaysInReview =
    totalInReview > 0 ? Number((sumDays / totalInReview).toFixed(1)) : 0;

  return {
    totalInReview,
    avgDaysInReview,
    maxDaysInReview,
    criticalAgingCount,
  };
}

/**
 * 5. Event Unit Economics (strictly guarded against divide-by-zero)
 */
export function calculateEventEfficiencySafe(
  events: FacadeEventInput[] = []
): ActionableEventEfficiency {
  const safeEvents = Array.isArray(events) ? events : [];

  let totalBudget = 0;
  let totalAttendees = 0;
  let totalTargetAttendees = 0;

  for (const e of safeEvents) {
    const budget = Number(e.budget);
    if (!Number.isNaN(budget) && budget > 0) {
      totalBudget += budget;
    }
    const attendees = Number(e.attendeeCount);
    if (!Number.isNaN(attendees) && attendees > 0) {
      totalAttendees += attendees;
    }
    const target = Number(e.targetAttendee);
    if (!Number.isNaN(target) && target > 0) {
      totalTargetAttendees += target;
    }
  }

  return {
    totalEvents: safeEvents.length,
    totalBudget,
    totalAttendees,
    totalTargetAttendees,
    costPerAttendee: safeDiv(totalBudget, totalAttendees),
    attendanceRate: safeDiv(totalAttendees * 100, totalTargetAttendees),
  };
}

/**
 * Main Entry Point: Calculates all 5 actionable metrics in a single pass.
 */
export function calculateActionableMarcomMetrics(
  input: ActionableMarcomInput = {}
): ActionableMarcomMetrics {
  const now = input.now || new Date();

  return {
    costPerOutlet: calculateCostPerOutlet(
      input.outlets || [],
      input.placements || [],
      input.mous || []
    ),
    placementProgress: calculatePlacementProgress(input.placements || []),
    mouFunnel: calculateMouFunnel(input.mous || []),
    contentAging: calculateContentAging(input.contents || [], now),
    eventEfficiency: calculateEventEfficiencySafe(input.events || []),
  };
}
