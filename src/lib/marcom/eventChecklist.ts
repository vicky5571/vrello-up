import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
import { startOfDay, differenceInDays } from "date-fns";

export const DEFAULT_EVENT_CHECKLISTS: Record<string, string[]> = {
  default: [
    "Venue licensing & local authority permits",
    "Stage, sound system, & AV production setup",
    "Brand POSM & promotional banner installation",
    "SPG & field crew briefing on sales targets",
    "Live event documentation & social coverage",
    "Post-event evaluation & recap report",
  ],
  roadshow: [
    "Van / vehicle branded wrapping & safety inspection",
    "Route planning & high-traffic outlet permits",
    "Flyering & acoustic sound rig readiness",
    "Flyer distribution & product sampling log",
    "Daily sales target & attendance tally",
  ],
  sponsorship: [
    "Contract signing & partner brand alignment",
    "Main stage & entrance backdrop branding",
    "VIP invitation & stakeholder hospitality",
    "Keynote speaker / talent coordination",
    "MOU milestone reporting & media kit handoff",
  ],
  exhibition: [
    "Booth structural design & contractor signoff",
    "Display showcase & lighting setup",
    "Interactive contest & lead scanner readiness",
    "On-site QR code giveaway & lead collection",
    "Booth teardown & asset inventory return",
  ],
  community: [
    "Community leader engagement & agenda lock",
    "Snack & merchandise pack preparation",
    "Workshop / coaching session run-through",
    "Group photo & social story publishing",
    "Community feedback & follow-up outreach",
  ],
  launch: [
    "Press release & media invite distribution",
    "Product unveil choreography & lighting cues",
    "Influencer & KOL live coverage coordination",
    "Trial demo area & QA testing",
    "Post-launch sales conversion telemetry",
  ],
};

export interface EventDateRangeResult {
  formatted: string;
  durationDays: number;
  isMultiDay: boolean;
  startDateFormatted: string;
  endDateFormatted?: string;
}

/**
 * Returns a contextual checklist template based on the event type.
 */
export function getEventChecklistTemplate(eventType: string): string[] {
  if (!eventType) return DEFAULT_EVENT_CHECKLISTS.default;
  const normalizedKey = Object.keys(DEFAULT_EVENT_CHECKLISTS).find(
    (k) => k.toLowerCase() === eventType.trim().toLowerCase()
  );
  return normalizedKey
    ? DEFAULT_EVENT_CHECKLISTS[normalizedKey]
    : DEFAULT_EVENT_CHECKLISTS.default;
}

/**
 * Resolves a User member given a PIC ID or name.
 */
export function findMemberForPic(
  members: User[],
  picIdOrName?: string
): User | undefined {
  if (!picIdOrName || !Array.isArray(members)) return undefined;
  const q = picIdOrName.trim().toLowerCase();

  // 1. Direct ID match
  const byId = members.find((m) => m.id === picIdOrName);
  if (byId) return byId;

  // 2. Exact or case-insensitive name match
  const byName = members.find((m) => m.name.toLowerCase() === q);
  if (byName) return byName;

  // 3. Email match
  const byEmail = members.find((m) => m.email.toLowerCase() === q);
  if (byEmail) return byEmail;

  // 4. Starts with / includes match
  return members.find(
    (m) =>
      m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())
  );
}

/**
 * Formats event date range and calculates duration in days.
 */
export function formatEventDateRange(
  date?: string | null,
  endDate?: string | null
): EventDateRangeResult {
  const rawStart = date ? date.slice(0, 10) : "";
  const rawEnd = endDate ? endDate.slice(0, 10) : "";

  if (!rawStart) {
    return {
      formatted: "TBD",
      durationDays: 0,
      isMultiDay: false,
      startDateFormatted: "TBD",
    };
  }

  const startFormatted = formatDate(rawStart);

  if (!rawEnd || rawEnd === rawStart || rawEnd < rawStart) {
    return {
      formatted: startFormatted,
      durationDays: 1,
      isMultiDay: false,
      startDateFormatted: startFormatted,
    };
  }

  const endFormatted = formatDate(rawEnd);

  // Compute days difference
  const startMs = new Date(rawStart).getTime();
  const endMs = new Date(rawEnd).getTime();
  const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

  return {
    formatted: `${startFormatted} – ${endFormatted}`,
    durationDays: diffDays,
    isMultiDay: diffDays > 1,
    startDateFormatted: startFormatted,
    endDateFormatted: endFormatted,
  };
}

export interface EventConflictItem {
  eventId: string;
  eventName: string;
  branchName: string;
  isSameBranch: boolean;
}

export interface EventConflictDetail {
  conflictingEventIds: string[];
  branchName: string;
  hasSameBranchConflict: boolean;
  hasCrossBranchConflict: boolean;
  sameBranchCount: number;
  crossBranchCount: number;
  sameBranchConflicts: EventConflictItem[];
  crossBranchConflicts: EventConflictItem[];
  message: string;
}

/**
 * Detects schedule clashes/conflicts where two or more non-cancelled events
 * have overlapping dates:
 * - Same branch clash (Venue & local team overlap)
 * - Cross branch clash (Simultaneous activations across different branches)
 */
export function detectEventConflicts(
  events: {
    id: string;
    branchName?: string;
    date?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    status: string;
    name: string;
  }[]
): Map<string, EventConflictDetail> {
  const conflictMap = new Map<string, EventConflictDetail>();
  if (!Array.isArray(events) || events.length < 2) return conflictMap;

  // Filter out cancelled events and events without branch or date
  const activeEvents = events.filter((e) => {
    if (e.status === "CANCELLED") return false;
    const start = (e.startDate || e.date)?.slice(0, 10);
    return Boolean(start && e.branchName?.trim());
  });

  const getOrCreateDetail = (ev: (typeof activeEvents)[0]): EventConflictDetail => {
    let detail = conflictMap.get(ev.id);
    if (!detail) {
      detail = {
        conflictingEventIds: [],
        branchName: ev.branchName || "Main Branch",
        hasSameBranchConflict: false,
        hasCrossBranchConflict: false,
        sameBranchCount: 0,
        crossBranchCount: 0,
        sameBranchConflicts: [],
        crossBranchConflicts: [],
        message: "",
      };
      conflictMap.set(ev.id, detail);
    }
    return detail;
  };

  for (let i = 0; i < activeEvents.length; i++) {
    const a = activeEvents[i];
    const aStart = (a.startDate || a.date)!.slice(0, 10);
    const aEnd = (a.endDate || a.startDate || a.date)!.slice(0, 10);
    const aBranch = a.branchName!.trim().toLowerCase();

    for (let j = i + 1; j < activeEvents.length; j++) {
      const b = activeEvents[j];
      const bBranch = b.branchName!.trim().toLowerCase();
      const bStart = (b.startDate || b.date)!.slice(0, 10);
      const bEnd = (b.endDate || b.startDate || b.date)!.slice(0, 10);

      // Overlap check
      const overlaps = aStart <= bEnd && aEnd >= bStart;
      if (!overlaps) continue;

      const isSameBranch = aBranch === bBranch;
      const detailA = getOrCreateDetail(a);
      const detailB = getOrCreateDetail(b);

      const conflictForA: EventConflictItem = {
        eventId: b.id,
        eventName: b.name,
        branchName: b.branchName || "Main Branch",
        isSameBranch,
      };

      const conflictForB: EventConflictItem = {
        eventId: a.id,
        eventName: a.name,
        branchName: a.branchName || "Main Branch",
        isSameBranch,
      };

      detailA.conflictingEventIds.push(b.id);
      detailB.conflictingEventIds.push(a.id);

      if (isSameBranch) {
        detailA.hasSameBranchConflict = true;
        detailA.sameBranchCount++;
        detailA.sameBranchConflicts.push(conflictForA);

        detailB.hasSameBranchConflict = true;
        detailB.sameBranchCount++;
        detailB.sameBranchConflicts.push(conflictForB);
      } else {
        detailA.hasCrossBranchConflict = true;
        detailA.crossBranchCount++;
        detailA.crossBranchConflicts.push(conflictForA);

        detailB.hasCrossBranchConflict = true;
        detailB.crossBranchCount++;
        detailB.crossBranchConflicts.push(conflictForB);
      }
    }
  }

  // Generate messages
  for (const detail of conflictMap.values()) {
    if (detail.hasSameBranchConflict) {
      detail.message = `Bentrok jadwal di cabang yang sama (${detail.sameBranchCount} event overlap)`;
    } else if (detail.hasCrossBranchConflict) {
      detail.message = `Simultaneous activations across branches (${detail.crossBranchCount} event)`;
    }
  }

  return conflictMap;
}

export interface FieldEventsKpiSummary {
  totalActivations: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  totalCommittedBudget: number;
  cancelledBudget: number;
  totalTargetAttendees: number;
  totalActualAttendees: number;
  branchCoverageCount: number;
  avgCostPerAttendee: number;
  overallTargetReachRate: number;
}

/**
 * Calculates Field Events KPIs strictly excluding CANCELLED events
 * from Committed Budget, Target Footfall, and Actual Attendance.
 */
export function calculateFieldEventsKPI(
  events: Array<{
    status?: string | null;
    budget?: number | null;
    targetAttendee?: number | null;
    attendeeCount?: number | null;
  }>,
  branchesCount = 0
): FieldEventsKpiSummary {
  const totalActivations = events.length;
  let activeCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let totalCommittedBudget = 0;
  let cancelledBudget = 0;
  let totalTargetAttendees = 0;
  let totalActualAttendees = 0;

  for (const e of events) {
    const budget = Number(e.budget) || 0;
    const target = Number(e.targetAttendee) || 0;
    const actual = Number(e.attendeeCount) || 0;

    if (e.status === "CANCELLED") {
      cancelledCount++;
      cancelledBudget += budget;
    } else {
      if (e.status === "UPCOMING" || e.status === "ON_PROGRESS") {
        activeCount++;
      } else if (e.status === "COMPLETED") {
        completedCount++;
      }
      totalCommittedBudget += budget;
      totalTargetAttendees += target;
      totalActualAttendees += actual;
    }
  }

  const avgCostPerAttendee =
    totalActualAttendees > 0
      ? Math.round(totalCommittedBudget / totalActualAttendees)
      : 0;
  const overallTargetReachRate =
    totalTargetAttendees > 0
      ? Math.round((totalActualAttendees / totalTargetAttendees) * 100)
      : 0;

  return {
    totalActivations,
    activeCount,
    completedCount,
    cancelledCount,
    totalCommittedBudget,
    cancelledBudget,
    totalTargetAttendees,
    totalActualAttendees,
    branchCoverageCount: Math.max(branchesCount, 1),
    avgCostPerAttendee,
    overallTargetReachRate,
  };
}

export interface TimelineBarMetricsInput {
  startDate: Date | string;
  endDate?: Date | string | null;
  windowStart: Date;
  windowEnd: Date;
  colWidth?: number;
}

export interface TimelineBarMetrics {
  isVisible: boolean;
  totalDurationDays: number;
  visibleDays: number;
  leftPx: number;
  barWidthPx: number;
  startsBeforeWindow: boolean;
  endsAfterWindow: boolean;
}

/**
 * Calculates timeline bar metrics for an event within a visible date window.
 */
export function calculateTimelineBarMetrics({
  startDate,
  endDate,
  windowStart,
  windowEnd,
  colWidth = 44,
}: TimelineBarMetricsInput): TimelineBarMetrics {
  const parseToLocalStartOfDay = (d: Date | string): Date => {
    if (d instanceof Date) return startOfDay(d);
    const dateStr = String(d).slice(0, 10);
    return startOfDay(new Date(`${dateStr}T00:00:00`));
  };

  const startObj = parseToLocalStartOfDay(startDate);
  const endObj = endDate ? parseToLocalStartOfDay(endDate) : startObj;
  const wStart = startOfDay(windowStart);
  const wEnd = startOfDay(windowEnd);

  // If completely outside the window interval, it shouldn't render
  if (endObj < wStart || startObj > wEnd) {
    const totalDuration = Math.max(1, differenceInDays(endObj, startObj) + 1);
    return {
      isVisible: false,
      totalDurationDays: totalDuration,
      visibleDays: 0,
      leftPx: 0,
      barWidthPx: 0,
      startsBeforeWindow: startObj < wStart,
      endsAfterWindow: endObj > wEnd,
    };
  }

  const totalDurationDays = Math.max(1, differenceInDays(endObj, startObj) + 1);

  // Clamp visible start and end within window bounds
  const visibleStart = startObj < wStart ? wStart : startObj;
  const visibleEnd = endObj > wEnd ? wEnd : endObj;

  const visibleDiff = Math.max(0, differenceInDays(visibleStart, wStart));
  const visibleDays = Math.max(1, differenceInDays(visibleEnd, visibleStart) + 1);

  const leftPx = visibleDiff * colWidth;
  const barWidthPx = Math.max(colWidth - 6, visibleDays * colWidth - 8);

  return {
    isVisible: true,
    totalDurationDays,
    visibleDays,
    leftPx,
    barWidthPx,
    startsBeforeWindow: startObj < wStart,
    endsAfterWindow: endObj > wEnd,
  };
}

