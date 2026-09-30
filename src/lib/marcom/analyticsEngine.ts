/**
 * Marcom Operational Analytics Engine
 * Pure calculation functions for Actionable Marketing Intelligence:
 * - MOU Approval SLA & Aging Velocity
 * - POSM Deployment Rate & Material Economics
 * - Social Media Content Cadence & Reliability
 * - Field Event Cost per Attendee & Target Realization
 */

import {
  calculateActionableMarcomMetrics,
  type ActionableMarcomMetrics,
} from "@/lib/marcom/analyticsFacade";

export interface MouAnalyticsInput {
  id: string;
  status: string;
  submissionDate?: Date | string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  compensationValue?: number | null;
}

export interface MouAgingBucket {
  bucket: string;
  label: string;
  count: number;
  color: string;
}

export interface MouSlaAndAgingResult {
  totalMous: number;
  submittedCount: number;
  approvedOrDoneCount: number;
  avgSlaDays: number;
  agingBuckets: MouAgingBucket[];
  stuckCount: number; // > 14 days
}

export interface PlacementAnalyticsInput {
  id: string;
  status: string;
  cost?: number | null;
  material?: {
    id: string;
    name: string;
    type?: string;
  } | null;
  outletId?: string;
  outlet?: {
    id: string;
    branchId?: string;
    branch?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface PosmMaterialMetric {
  materialName: string;
  total: number;
  done: number;
  inProgress: number;
  issue: number;
  notStarted: number;
  doneRate: number; // 0 - 100
  totalCost: number;
  avgCost: number;
}

export interface PosmDeploymentResult {
  totalPlacements: number;
  donePlacements: number;
  inProgressPlacements: number;
  issuePlacements: number;
  notStartedPlacements: number;
  deploymentRate: number; // 0 - 100
  totalInvestment: number;
  materials: PosmMaterialMetric[];
}

export interface ContentPostAnalyticsInput {
  id: string;
  platform: string;
  status: string;
  publishDate?: Date | string | null;
}

export interface ContentPlatformMetric {
  platform: string;
  total: number;
  published: number;
  scheduled: number;
  draftOrOther: number;
  publishedRate: number; // 0 - 100
}

export interface ContentAnalyticsResult {
  totalPosts: number;
  publishedPosts: number;
  overallPublishedRate: number;
  platforms: ContentPlatformMetric[];
}

export interface FieldEventAnalyticsInput {
  id: string;
  eventType: string;
  status: string;
  budget?: number | null;
  targetAttendee?: number | null;
  attendeeCount?: number | null;
}

export interface EventTypeMetric {
  eventType: string;
  totalEvents: number;
  completedEvents: number;
  totalBudget: number;
  totalAttendees: number;
  totalTargetAttendees: number;
  costPerAttendee: number;
  /**
   * Projected cost per attendee using the target audience when no real
   * attendees have been recorded yet (upcoming / unrealized events).
   */
  projectedCostPerAttendee: number;
  attendanceRate: number; // 0 - 100%
}

export interface EventEfficiencyResult {
  totalEvents: number;
  totalBudget: number;
  totalAttendees: number;
  avgCostPerAttendee: number;
  eventsByType: EventTypeMetric[];
}

export interface OutletAnalyticsInput {
  id: string;
  name?: string;
  code?: string;
  active?: boolean;
}

export interface ExecutiveKpis {
  mouSla: {
    avgSlaDays: number;
    stuckCount: number;
    healthStatus: "HEALTHY" | "ATTENTION" | "CRITICAL";
    label: string;
  };
  posmDeployment: {
    total: number;
    done: number;
    rate: number;
    totalInvestment: number;
  };
  eventEfficiency: {
    totalBudget: number;
    totalAttendees: number;
    costPerAttendee: number;
  };
}

export interface MarcomAnalyticsDashboardData {
  kpis: ExecutiveKpis;
  mouSlaAndAging: MouSlaAndAgingResult;
  posmDeployment: PosmDeploymentResult;
  contentMetrics: ContentAnalyticsResult;
  eventEfficiency: EventEfficiencyResult;
  actionable: ActionableMarcomMetrics;
}

export type AnalyticsDashboardData = MarcomAnalyticsDashboardData;

/**
 * Normalizes a platform string (e.g. "instagram" -> "Instagram")
 */
function normalizePlatformName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (trimmed === "instagram") return "Instagram";
  if (trimmed === "tiktok") return "TikTok";
  if (trimmed === "youtube") return "YouTube";
  if (trimmed === "facebook") return "Facebook";
  if (trimmed === "twitter" || trimmed === "x") return "X / Twitter";
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "Other";
}

/**
 * Calculates MOU Approval SLA turnaround (in days) and aging of submitted proposals.
 */
export function calculateMouSlaAndAging(
  mous: MouAnalyticsInput[],
  referenceNow: Date = new Date()
): MouSlaAndAgingResult {
  let totalSlaDays = 0;
  let slaSampleCount = 0;
  let submittedCount = 0;
  let approvedOrDoneCount = 0;

  let under7Count = 0;
  let sevenTo14Count = 0;
  let over14Count = 0;

  for (const mou of mous) {
    const status = mou.status?.toUpperCase();

    if (status === "APPROVED" || status === "DONE") {
      approvedOrDoneCount++;
      if (mou.submissionDate && mou.startDate) {
        const subTime = new Date(mou.submissionDate).getTime();
        const startTime = new Date(mou.startDate).getTime();
        if (!isNaN(subTime) && !isNaN(startTime) && startTime >= subTime) {
          const days = Math.round((startTime - subTime) / (1000 * 60 * 60 * 24));
          totalSlaDays += days;
          slaSampleCount++;
        }
      }
    } else if (status === "SUBMITTED") {
      submittedCount++;
      if (mou.submissionDate) {
        const subTime = new Date(mou.submissionDate).getTime();
        if (!isNaN(subTime)) {
          const ageDays = Math.max(0, Math.floor((referenceNow.getTime() - subTime) / (1000 * 60 * 60 * 24)));
          if (ageDays < 7) {
            under7Count++;
          } else if (ageDays <= 14) {
            sevenTo14Count++;
          } else {
            over14Count++;
          }
        } else {
          under7Count++;
        }
      } else {
        under7Count++;
      }
    }
  }

  const avgSlaDays = slaSampleCount > 0 ? Math.round(totalSlaDays / slaSampleCount) : 0;

  const agingBuckets: MouAgingBucket[] = [
    { bucket: "under_7", label: "< 7 Hari", count: under7Count, color: "#10b981" },
    { bucket: "7_to_14", label: "7–14 Hari", count: sevenTo14Count, color: "#f59e0b" },
    { bucket: "over_14", label: "> 14 Hari (Stuck)", count: over14Count, color: "#ef4444" },
  ];

  return {
    totalMous: mous.length,
    submittedCount,
    approvedOrDoneCount,
    avgSlaDays,
    agingBuckets,
    stuckCount: over14Count,
  };
}

/**
 * Calculates POSM Deployment Rate & Material Economics (unit costs, done rates).
 */
export function calculatePosmMaterialEconomics(
  placements: PlacementAnalyticsInput[]
): PosmDeploymentResult {
  const materialMap = new Map<
    string,
    {
      total: number;
      done: number;
      inProgress: number;
      issue: number;
      notStarted: number;
      totalCost: number;
    }
  >();

  let totalPlacements = 0;
  let donePlacements = 0;
  let inProgressPlacements = 0;
  let issuePlacements = 0;
  let notStartedPlacements = 0;
  let totalInvestment = 0;

  for (const p of placements) {
    totalPlacements++;
    const cost = Number(p.cost) || 0;
    totalInvestment += cost;

    const status = p.status?.toUpperCase();
    const isDone = status === "DONE";
    const isInProgress = status === "ON_PROGRESS";
    const isIssue = status === "ISSUE";

    if (isDone) donePlacements++;
    else if (isInProgress) inProgressPlacements++;
    else if (isIssue) issuePlacements++;
    else notStartedPlacements++;

    const matName = p.material?.name?.trim() || "Materi Lainnya";
    let entry = materialMap.get(matName);
    if (!entry) {
      entry = { total: 0, done: 0, inProgress: 0, issue: 0, notStarted: 0, totalCost: 0 };
      materialMap.set(matName, entry);
    }
    entry.total++;
    entry.totalCost += cost;
    if (isDone) entry.done++;
    else if (isInProgress) entry.inProgress++;
    else if (isIssue) entry.issue++;
    else entry.notStarted++;
  }

  const materials: PosmMaterialMetric[] = Array.from(materialMap.entries()).map(
    ([materialName, stats]) => ({
      materialName,
      total: stats.total,
      done: stats.done,
      inProgress: stats.inProgress,
      issue: stats.issue,
      notStarted: stats.notStarted,
      doneRate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
      totalCost: stats.totalCost,
      avgCost: stats.total > 0 ? Math.round(stats.totalCost / stats.total) : 0,
    })
  );

  // Sort by highest volume
  materials.sort((a, b) => b.total - a.total);

  const deploymentRate =
    totalPlacements > 0 ? Math.round((donePlacements / totalPlacements) * 100) : 0;

  return {
    totalPlacements,
    donePlacements,
    inProgressPlacements,
    issuePlacements,
    notStartedPlacements,
    deploymentRate,
    totalInvestment,
    materials,
  };
}

/**
 * Calculates Content Cadence and Platform Reliability.
 */
export function calculateContentPlatformMetrics(
  contents: ContentPostAnalyticsInput[]
): ContentAnalyticsResult {
  const platformMap = new Map<
    string,
    {
      total: number;
      published: number;
      scheduled: number;
      draftOrOther: number;
    }
  >();

  let totalPosts = 0;
  let publishedPosts = 0;

  for (const c of contents) {
    totalPosts++;
    const status = c.status?.toUpperCase();
    const isPublished = status === "PUBLISHED";
    const isScheduled = status === "SCHEDULED";

    if (isPublished) publishedPosts++;

    const platName = normalizePlatformName(c.platform || "Other");
    let entry = platformMap.get(platName);
    if (!entry) {
      entry = { total: 0, published: 0, scheduled: 0, draftOrOther: 0 };
      platformMap.set(platName, entry);
    }
    entry.total++;
    if (isPublished) entry.published++;
    else if (isScheduled) entry.scheduled++;
    else entry.draftOrOther++;
  }

  const platforms: ContentPlatformMetric[] = Array.from(platformMap.entries()).map(
    ([platform, stats]) => ({
      platform,
      total: stats.total,
      published: stats.published,
      scheduled: stats.scheduled,
      draftOrOther: stats.draftOrOther,
      publishedRate: stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0,
    })
  );

  platforms.sort((a, b) => b.total - a.total);

  const overallPublishedRate =
    totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;

  return {
    totalPosts,
    publishedPosts,
    overallPublishedRate,
    platforms,
  };
}

/**
 * Calculates Field Event Efficiency, Cost Per Attendee & Audience Realization.
 */
export function calculateEventEfficiency(
  events: FieldEventAnalyticsInput[]
): EventEfficiencyResult {
  const typeMap = new Map<
    string,
    {
      totalEvents: number;
      completedEvents: number;
      totalBudget: number;
      totalAttendees: number;
      totalTarget: number;
    }
  >();

  let totalEvents = 0;
  let totalBudget = 0;
  let totalAttendees = 0;

  for (const e of events) {
    totalEvents++;
    const budget = Number(e.budget) || 0;
    const attendees = Number(e.attendeeCount) || 0;
    const target = Number(e.targetAttendee) || 0;
    const isCompleted = e.status?.toUpperCase() === "COMPLETED";

    totalBudget += budget;
    totalAttendees += attendees;

    const eventType = e.eventType?.trim() || "General Event";
    let entry = typeMap.get(eventType);
    if (!entry) {
      entry = {
        totalEvents: 0,
        completedEvents: 0,
        totalBudget: 0,
        totalAttendees: 0,
        totalTarget: 0,
      };
      typeMap.set(eventType, entry);
    }
    entry.totalEvents++;
    if (isCompleted) entry.completedEvents++;
    entry.totalBudget += budget;
    entry.totalAttendees += attendees;
    entry.totalTarget += target;
  }

  const eventsByType: EventTypeMetric[] = Array.from(typeMap.entries()).map(
    ([eventType, stats]) => ({
      eventType,
      totalEvents: stats.totalEvents,
      completedEvents: stats.completedEvents,
      totalBudget: stats.totalBudget,
      totalAttendees: stats.totalAttendees,
      totalTargetAttendees: stats.totalTarget,
      costPerAttendee:
        stats.totalAttendees > 0 ? Math.round(stats.totalBudget / stats.totalAttendees) : 0,
      projectedCostPerAttendee:
        stats.totalAttendees === 0 && stats.totalTarget > 0
          ? Math.round(stats.totalBudget / stats.totalTarget)
          : stats.totalAttendees > 0
          ? Math.round(stats.totalBudget / stats.totalAttendees)
          : 0,
      attendanceRate:
        stats.totalTarget > 0
          ? Math.round((stats.totalAttendees / stats.totalTarget) * 100)
          : 0,
    })
  );

  eventsByType.sort((a, b) => b.totalBudget - a.totalBudget);

  const avgCostPerAttendee =
    totalAttendees > 0 ? Math.round(totalBudget / totalAttendees) : 0;

  return {
    totalEvents,
    totalBudget,
    totalAttendees,
    avgCostPerAttendee,
    eventsByType,
  };
}

/**
 * Generates the 3 Executive KPI Cards for the top row pulse.
 */
export function calculateExecutiveKpis(
  mouResult: MouSlaAndAgingResult,
  posmResult: PosmDeploymentResult,
  eventResult: EventEfficiencyResult
): ExecutiveKpis {
  let mouHealthStatus: "HEALTHY" | "ATTENTION" | "CRITICAL" = "HEALTHY";
  let mouLabel = "SLA Prima (<7 Hari)";

  const hasMouSampleData =
    mouResult.totalMous > 0 &&
    (mouResult.submittedCount > 0 || mouResult.approvedOrDoneCount > 0);

  if (!hasMouSampleData) {
    // Empty / freshly initialized workspace: never falsely congratulate on SLA.
    mouHealthStatus = "HEALTHY";
    mouLabel = "Belum Ada Pengajuan";
  } else if (mouResult.stuckCount > 5 || mouResult.avgSlaDays > 14) {
    mouHealthStatus = "CRITICAL";
    mouLabel = "Bottleneck Kritis (>14 Hari)";
  } else if (mouResult.stuckCount > 0 || mouResult.avgSlaDays > 7) {
    mouHealthStatus = "ATTENTION";
    mouLabel = "Ada Keterlambatan Review";
  }

  return {
    mouSla: {
      avgSlaDays: mouResult.avgSlaDays,
      stuckCount: mouResult.stuckCount,
      healthStatus: mouHealthStatus,
      label: mouLabel,
    },
    posmDeployment: {
      total: posmResult.totalPlacements,
      done: posmResult.donePlacements,
      rate: posmResult.deploymentRate,
      totalInvestment: posmResult.totalInvestment,
    },
    eventEfficiency: {
      totalBudget: eventResult.totalBudget,
      totalAttendees: eventResult.totalAttendees,
      costPerAttendee: eventResult.avgCostPerAttendee,
    },
  };
}

export { calculateExecutiveKpis as buildExecutiveKpis };

/**
 * Main dashboard data aggregator from raw model lists.
 */
export function buildMarcomAnalyticsDashboard(params: {
  mous: MouAnalyticsInput[];
  placements: PlacementAnalyticsInput[];
  contents: ContentPostAnalyticsInput[];
  events: FieldEventAnalyticsInput[];
  outlets?: OutletAnalyticsInput[];
  activeOutletCount?: number;
  now?: Date;
}): MarcomAnalyticsDashboardData {
  const activeOutletCount =
    typeof params.activeOutletCount === "number" &&
    Number.isFinite(params.activeOutletCount)
      ? Math.max(0, Math.round(params.activeOutletCount))
      : undefined;

  const mouSlaAndAging = calculateMouSlaAndAging(params.mous, params.now);
  const posmDeployment = calculatePosmMaterialEconomics(params.placements);
  const contentMetrics = calculateContentPlatformMetrics(params.contents);
  const eventEfficiency = calculateEventEfficiency(params.events);
  const kpis = calculateExecutiveKpis(
    mouSlaAndAging,
    posmDeployment,
    eventEfficiency
  );
  const actionable = calculateActionableMarcomMetrics({
    mous: params.mous,
    placements: params.placements,
    contents: params.contents,
    events: params.events,
    outlets: params.outlets || [],
    activeOutletCount,
    now: params.now,
  });

  return {
    kpis,
    mouSlaAndAging,
    posmDeployment,
    contentMetrics,
    eventEfficiency,
    actionable,
  };
}

export { buildMarcomAnalyticsDashboard as calculateDashboardAnalytics };

