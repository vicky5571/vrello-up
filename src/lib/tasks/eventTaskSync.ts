import type { User, Subtask, Priority, Task, Status, Space } from "@/types";
import { formatIDR, formatDate } from "@/lib/utils";
import { findSpaceByListId } from "@/lib/tasks/targetSpaceList";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { differenceInDays, startOfDay } from "date-fns";

export const DEFAULT_EVENT_CHECKLISTS: Record<string, string[]> = {
  Roadshow: [
    "Venue survey & location operational permits",
    "Sound system & lighting rental",
    "Print backdrop & rollup banners",
    "Briefing field crew, MC & promoters",
    "Booth setup & product display installation",
    "Visitor evaluation & lead data recap",
  ],
  Launch: [
    "Venue rental confirmation & permits",
    "Invitations for media, KOL & VIP guests",
    "Stage, backdrop & sound system setup",
    "Catering & merchandise goodie bags",
    "Live streaming & video coverage team",
    "Press release distribution & media monitoring",
  ],
  Exhibition: [
    "Booth registration & layout floor plan",
    "Flagship product display & POSM installation",
    "Brochures, catalog flyers & promo vouchers",
    "Crew shift schedule & team uniforms",
    "Visitor lead recording & sales recap",
  ],
  Booth: [
    "Booth placement permit & power supply",
    "Rollup banners & promotional flyers",
    "Product dummy display & tester samples",
    "Stand crew assignment & attendance QR code",
  ],
  Workshop: [
    "Presentation slides & hands-on training kit",
    "Sound system & projector screen",
    "Refreshment snacks & coffee break",
    "Attendee certificates & feedback forms",
  ],
  Community: [
    "Community gathering venue reservation",
    "Event rundown, interactive games & doorprizes",
    "Exclusive community merchandise",
    "Group photo session & social media coverage",
  ],
  default: [
    "Location confirmation & operational permits",
    "Logistics & promotional materials preparation",
    "Field PIC & operational team briefing",
    "Event execution & media documentation",
    "Post-event evaluation & recap report",
  ],
};

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

export interface EventDataInput {
  id: string;
  name: string;
  eventType: string;
  branchName?: string;
  location?: string;
  startDate?: string | null;
  date?: string | null;
  endDate?: string | null;
  picName?: string;
  status?: string;
  budget?: number;
  targetAttendee?: number;
  attendeeCount?: number;
  notes?: string;
}

export function buildEventDescription(data: {
  location?: string;
  branchName?: string;
  eventType?: string;
  budget?: number;
  targetAttendee?: number;
  notes?: string;
}): string {
  const parts: string[] = [];
  if (data.location) {
    parts.push(`<p><strong>Location:</strong> ${data.location}</p>`);
  }
  if (data.branchName) {
    parts.push(`<p><strong>Branch:</strong> ${data.branchName}</p>`);
  }
  if (data.eventType) {
    parts.push(`<p><strong>Type:</strong> ${data.eventType}</p>`);
  }
  if (data.budget !== undefined) {
    parts.push(`<p><strong>Budget:</strong> ${formatIDR(data.budget)}</p>`);
  }
  if (data.targetAttendee !== undefined) {
    parts.push(`<p><strong>Target Attendees:</strong> ${data.targetAttendee}</p>`);
  }
  if (data.notes) {
    parts.push(`<p><strong>Logistics & Notes:</strong> ${data.notes}</p>`);
  }
  return parts.join("") || "<p>Field activation task</p>";
}

export interface BuildEventTaskPayloadParams {
  event: EventDataInput;
  listId: string;
  statusId: string;
  members: User[];
  picIdOrName?: string;
  subtasks: Subtask[];
  priority?: Priority;
}

export function buildEventTaskPayload({
  event,
  listId,
  statusId,
  members,
  picIdOrName,
  subtasks,
  priority = "high",
}: BuildEventTaskPayloadParams): Omit<Task, "id" | "createdAt" | "updatedAt"> {
  const picMember = findMemberForPic(members, picIdOrName || event.picName);
  const assignees: User[] = picMember
    ? [picMember]
    : members[0]
    ? [members[0]]
    : [];

  const rawDate = event.startDate || event.date;
  const dueDate = rawDate ? rawDate.slice(0, 10) : undefined;

  const description = buildEventDescription({
    location: event.location,
    branchName: event.branchName,
    eventType: event.eventType,
    budget: event.budget,
    targetAttendee: event.targetAttendee,
    notes: event.notes,
  });

  return {
    listId,
    title: `[Field Event] ${event.name.trim()}`,
    description,
    statusId,
    priority,
    assignees,
    dueDate,
    orderIndex: 0,
    tags: [],
    subtasks,
    relatedMarcomId: event.id,
  };
}

/**
 * Maps a Field Event status (UPCOMING, ON_PROGRESS, COMPLETED, CANCELLED)
 * to an appropriate Task statusId from the destination Space statuses.
 */
export function mapEventStatusToTaskStatusId(
  eventStatus: string,
  statuses: Status[]
): string {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return "status-todo";
  }

  const normalized = (eventStatus || "").toUpperCase();

  if (normalized === "COMPLETED") {
    const doneStatus = statuses.find((s) => s.category === "done");
    if (doneStatus) return doneStatus.id;
    const closedStatus = statuses.find((s) => s.category === "closed");
    if (closedStatus) return closedStatus.id;
    const nameMatch = statuses.find((s) => {
      const n = s.name.toLowerCase();
      return n.includes("done") || n.includes("selesai") || n.includes("complete");
    });
    if (nameMatch) return nameMatch.id;
    return statuses[statuses.length - 1].id;
  }

  if (normalized === "CANCELLED") {
    const closedStatus = statuses.find((s) => s.category === "closed");
    if (closedStatus) return closedStatus.id;
    const doneStatus = statuses.find((s) => s.category === "done");
    if (doneStatus) return doneStatus.id;
    return statuses[statuses.length - 1].id;
  }

  if (normalized === "ON_PROGRESS") {
    const inProgressStatus = statuses.find((s) => s.category === "in_progress");
    if (inProgressStatus) return inProgressStatus.id;
    const nameMatch = statuses.find((s) => {
      const n = s.name.toLowerCase();
      return n.includes("progress") || n.includes("jalan") || n.includes("doing");
    });
    if (nameMatch) return nameMatch.id;
    return statuses[Math.min(1, statuses.length - 1)].id;
  }

  // Default / UPCOMING -> category open / todo
  const openStatus = statuses.find((s) => s.category === "open");
  if (openStatus) return openStatus.id;
  return statuses[0].id;
}

/**
 * Maps a Task status category & name to a Field Event status.
 */
export function mapTaskCategoryToEventStatus(
  category?: string,
  statusName?: string
): "UPCOMING" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED" {
  const cat = (category || "").toLowerCase();
  const name = (statusName || "").toLowerCase();

  if (cat === "done" || cat === "closed" || name.includes("done") || name.includes("selesai")) {
    return "COMPLETED";
  }
  if (cat === "in_progress" || cat === "review" || name.includes("progress") || name.includes("doing")) {
    return "ON_PROGRESS";
  }
  return "UPCOMING";
}

export interface EventDateRangeResult {
  formatted: string;
  durationDays: number;
  isMultiDay: boolean;
  startDateFormatted: string;
  endDateFormatted?: string;
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

  const getOrCreateDetail = (ev: typeof activeEvents[0]): EventConflictDetail => {
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

      // Overlap condition: startA <= endB && endA >= startB
      if (aStart <= bEnd && aEnd >= bStart) {
        const isSame = aBranch === bBranch;
        const detailA = getOrCreateDetail(a);
        const detailB = getOrCreateDetail(b);

        if (!detailA.conflictingEventIds.includes(b.id)) {
          detailA.conflictingEventIds.push(b.id);
        }
        if (!detailB.conflictingEventIds.includes(a.id)) {
          detailB.conflictingEventIds.push(a.id);
        }

        if (isSame) {
          detailA.sameBranchConflicts.push({
            eventId: b.id,
            eventName: b.name,
            branchName: b.branchName!,
            isSameBranch: true,
          });
          detailB.sameBranchConflicts.push({
            eventId: a.id,
            eventName: a.name,
            branchName: a.branchName!,
            isSameBranch: true,
          });
        } else {
          detailA.crossBranchConflicts.push({
            eventId: b.id,
            eventName: b.name,
            branchName: b.branchName!,
            isSameBranch: false,
          });
          detailB.crossBranchConflicts.push({
            eventId: a.id,
            eventName: a.name,
            branchName: a.branchName!,
            isSameBranch: false,
          });
        }
      }
    }
  }

  // Finalize messages and flags for each entry
  for (const [, detail] of conflictMap) {
    detail.sameBranchCount = detail.sameBranchConflicts.length;
    detail.crossBranchCount = detail.crossBranchConflicts.length;
    detail.hasSameBranchConflict = detail.sameBranchCount > 0;
    detail.hasCrossBranchConflict = detail.crossBranchCount > 0;

    const sameNames = detail.sameBranchConflicts.map((c) => c.eventName).join(", ");
    const crossBranches = Array.from(
      new Set(detail.crossBranchConflicts.map((c) => c.branchName))
    ).join(", ");
    const crossNames = detail.crossBranchConflicts.map((c) => c.eventName).join(", ");

    if (detail.hasSameBranchConflict && detail.hasCrossBranchConflict) {
      detail.message = `Venue clash at branch "${detail.branchName}" with "${sameNames}", and simultaneous cross-branch activation with ${crossBranches} ("${crossNames}")`;
    } else if (detail.hasSameBranchConflict) {
      detail.message = `Schedule clash at branch "${detail.branchName}" with "${sameNames}"`;
    } else if (detail.hasCrossBranchConflict) {
      detail.message = `Simultaneous cross-branch activation with ${crossBranches} ("${crossNames}")`;
    }
  }

  return conflictMap;
}

/**
 * Fires an async background PATCH to update the linked Field Event status
 * when a Task's status is changed in Kanban board or Task modal.
 */
export function syncFieldEventOnTaskStatusChange(
  task: Task | undefined,
  newStatusId: string,
  spaces: Space[]
): void {
  if (!task || !task.relatedMarcomId || !task.title?.startsWith("[Field Event]")) {
    return;
  }
  const space = findSpaceByListId(spaces, task.listId);
  const nextStatus = space?.statuses.find((s) => s.id === newStatusId);
  const mappedEventStatus = mapTaskCategoryToEventStatus(
    nextStatus?.category,
    nextStatus?.name
  );
  if (typeof window !== "undefined" && typeof fetch === "function") {
    fetch(`/api/marcom/events/${task.relatedMarcomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: mappedEventStatus }),
    })
      .then((res) => {
        if (res.ok) {
          useMarcomDataStore.getState().invalidateEvents();
        }
      })
      .catch(() => {});
  }
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
 * Strictly clamps visible bounds so that events starting prior to windowStart
 * or ending after windowEnd do not visually distort or stretch past their actual span.
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


