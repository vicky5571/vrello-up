import type {
  OutletPipelineRow,
  PipelineUrgencyLevel,
  Outlet,
  OutletType,
  OutletTier,
  Mou,
  MouStatus,
  Placement,
  PlacementStatus,
  FieldEvent,
  EventStatus,
  ContentPost,
  PostPlatform,
  PostStatus,
} from "@/types";
import { isPermanentMaterial } from "@/lib/marcom/placementMouBridge";

export type { OutletPipelineRow, PipelineUrgencyLevel };

export interface PipelineOutletInput extends Omit<Partial<Outlet>, "type" | "tier" | "branch" | "mous" | "placements"> {
  id: string;
  code?: string;
  name: string;
  type?: OutletType | string;
  tier?: OutletTier | string;
  city?: string;
  address?: string;
  picName?: string;
  picPhone?: string;
  active?: boolean;
  branchId?: string;
  branch?: { id?: string; name?: string; code?: string };
  mous?: Array<Omit<Partial<Mou>, "status"> & { id?: string; status?: MouStatus | string; compensationValue?: number | null; [key: string]: unknown }>;
  placements?: Array<Omit<Partial<Placement>, "status" | "material"> & { id?: string; status?: PlacementStatus | string; cost?: number | null; material?: { id?: string; name?: string; type?: string } | null; [key: string]: unknown }>;
}

export interface PipelineEventInput extends Omit<Partial<FieldEvent>, "startDate" | "endDate" | "date" | "status"> {
  id?: string;
  name?: string;
  branchName?: string;
  location?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  date?: string | Date | null;
  status?: EventStatus | string;
  outletId?: string;
  branchId?: string;
}

export interface PipelineContentInput extends Omit<Partial<ContentPost>, "platform" | "publishDate" | "status" | "createdAt"> {
  id?: string;
  title?: string;
  branchName?: string;
  platform?: PostPlatform | string;
  status?: PostStatus | string;
  publishDate?: string | Date | null;
  createdAt?: string | Date | null;
  caption?: string;
  outletId?: string;
  branchId?: string;
}

/**
 * Normalizes MouStatus into the pipeline status union:
 * "APPROVED" | "DONE" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN"
 */
function normalizeMouStatus(status?: string | null): "APPROVED" | "DONE" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN" {
  if (!status) return "NONE";
  const upper = status.trim().toUpperCase();
  if (upper === "APPROVED") return "APPROVED";
  if (upper === "DONE") return "DONE";
  if (upper === "SUBMITTED") return "SUBMITTED";
  if (upper === "REJECTED") return "REJECTED";
  if (upper === "DRAFT") return "DRAFT";

  console.warn(`[marcom/pipelineEngine] Unrecognized MouStatus encountered: "${status}"`);
  return "UNKNOWN";
}

/**
 * Checks if a FieldEvent matches an outlet.
 * Strict matching:
 * 1. Explicit ID match (event.outletId === outlet.id) takes highest priority.
 * 2. If event has no outletId, fallback ONLY to exact name/code match (e.g. location or event name exactly equals outlet name or code).
 * Note: Branch-wide events without an outletId are NOT broadcast to every outlet in the branch.
 */
function matchesEvent(event: PipelineEventInput, outlet: PipelineOutletInput): boolean {
  if (event.outletId) {
    return event.outletId === outlet.id;
  }

  const oName = (outlet.name || "").trim().toLowerCase();
  const oCode = (outlet.code || "").trim().toLowerCase();
  const eLoc = (event.location || "").trim().toLowerCase();
  const eName = (event.name || "").trim().toLowerCase();

  // Fallback for legacy unlinked events: exact name or code match (prevent loose substrings)
  if (oName && oName.length >= 2) {
    if (eLoc === oName || eName === oName) return true;
  }
  if (oCode && oCode.length >= 2) {
    if (eLoc === oCode || eName === oCode) return true;
  }

  return false;
}

/**
 * Checks if a ContentPost matches an outlet.
 * Strict matching:
 * 1. Explicit ID match (content.outletId === outlet.id) takes highest priority.
 * 2. If content has no outletId, fallback ONLY to exact outlet name or explicit code tag in title.
 * Note: Branch-wide content without an outletId is NOT broadcast to every outlet in the branch.
 */
function matchesContent(content: PipelineContentInput, outlet: PipelineOutletInput): boolean {
  if (content.outletId) {
    return content.outletId === outlet.id;
  }

  const oName = (outlet.name || "").trim().toLowerCase();
  const oCode = (outlet.code || "").trim().toLowerCase();
  const cTitle = (content.title || "").trim().toLowerCase();

  // Fallback for legacy unlinked content: exact name or bracketed code in title
  if (oName && oName.length >= 3 && (cTitle === oName || cTitle.includes(`[${oName}]`))) {
    return true;
  }
  if (oCode && oCode.length >= 3 && (cTitle === oCode || cTitle.includes(`[${oCode}]`) || cTitle.includes(`(${oCode})`))) {
    return true;
  }

  return false;
}

/**
 * Pure Pipeline Rollup Engine:
 * Transforms multi-module Marcom entities (Outlets, MoUs, Placements, Events, Content)
 * into a single unified high-density operational row per outlet.
 */
export function buildOutletPipelineRows(
  outlets: PipelineOutletInput[],
  events: PipelineEventInput[] = [],
  contents: PipelineContentInput[] = [],
): OutletPipelineRow[] {
  if (!Array.isArray(outlets)) return [];

  const safeEvents = Array.isArray(events) ? events : [];
  const safeContents = Array.isArray(contents) ? contents : [];
  const now = Date.now();

  return outlets.map((outlet) => {
    const mous = Array.isArray(outlet.mous) ? outlet.mous : [];
    const placements = Array.isArray(outlet.placements) ? outlet.placements : [];

    // --- 1. MoU Summary & SLA Aging ---
    const totalMous = mous.length;
    let latestMouStatus: OutletPipelineRow["mouSummary"]["latestStatus"] = "NONE";
    let totalCompensationValue = 0;
    let mouDaysLeft: number | undefined;
    let mouIsExpiringSoon = false;
    let mouIsExpired = false;
    let mouDaysPendingApproval: number | undefined;
    let mouEndDateStr: string | undefined;

    if (totalMous > 0) {
      // Sort to get the most recent MoU (items with timestamps sorted before items without)
      const sortedMous = [...mous].sort((a, b) => {
        const dateA = a.startDate || a.submissionDate || ("createdAt" in a && typeof a.createdAt === "string" ? a.createdAt : "");
        const dateB = b.startDate || b.submissionDate || ("createdAt" in b && typeof b.createdAt === "string" ? b.createdAt : "");
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);
        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;
        return timeB - timeA;
      });

      const latestMou = sortedMous[0];
      latestMouStatus = normalizeMouStatus(latestMou?.status);

      for (const m of mous) {
        const val = typeof m.compensationValue === "number" && !Number.isNaN(m.compensationValue) ? m.compensationValue : 0;
        totalCompensationValue += val;
      }

      // SLA Aging for MoU
      if (latestMou?.endDate) {
        mouEndDateStr = typeof latestMou.endDate === "string" ? latestMou.endDate : new Date(latestMou.endDate).toISOString();
        const endMs = new Date(latestMou.endDate).getTime();
        if (!Number.isNaN(endMs)) {
          const diffMs = endMs - now;
          const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
          mouDaysLeft = daysLeft;
          if (daysLeft <= 0 && latestMouStatus !== "DONE") {
            mouIsExpired = true;
          } else if (daysLeft > 0 && daysLeft <= 30) {
            mouIsExpiringSoon = true;
          }
        }
      }

      if (latestMouStatus === "SUBMITTED") {
        const rawSubmitDate = latestMou.submissionDate || ("updatedAt" in latestMou && typeof latestMou.updatedAt === "string" ? latestMou.updatedAt : ("createdAt" in latestMou && typeof latestMou.createdAt === "string" ? latestMou.createdAt : ""));
        if (rawSubmitDate) {
          const submitMs = new Date(rawSubmitDate).getTime();
          if (!Number.isNaN(submitMs)) {
            mouDaysPendingApproval = Math.max(0, Math.floor((now - submitMs) / (24 * 60 * 60 * 1000)));
          }
        }
      }
    }

    const hasApprovedMou = mous.some((m) => normalizeMouStatus(m.status) === "APPROVED");
    const isHealthy = latestMouStatus === "APPROVED";

    // --- 2. Placement Summary & SLA Aging ---
    const totalPlacements = placements.length;
    let doneCount = 0;
    let totalPlacementCost = 0;
    let hasBlockedItems = false;
    let maxAgingDays = 0;
    let blockedCount = 0;

    for (const p of placements) {
      const statusUpper = (p.status || "").trim().toUpperCase();
      if (statusUpper === "DONE") {
        doneCount++;
      }

      const cost = typeof p.cost === "number" && !Number.isNaN(p.cost) && p.cost > 0 ? p.cost : 0;
      totalPlacementCost += cost;

      // Bottleneck detection:
      // An item is blocked if it has an explicit "ISSUE" status,
      // or if it is a pending/in-progress permanent material lacking an active approved MoU.
      const isPermanent = isPermanentMaterial(p.material);
      const isBlockedItem = statusUpper === "ISSUE" || (statusUpper !== "DONE" && isPermanent && !hasApprovedMou);

      if (isBlockedItem) {
        hasBlockedItems = true;
        blockedCount++;

        // Aging calculation based on last update / creation date
        const rawDate = ("updatedAt" in p && typeof p.updatedAt === "string" ? p.updatedAt : ("createdAt" in p && typeof p.createdAt === "string" ? p.createdAt : (p.date || "")));
        if (rawDate) {
          const pMs = new Date(rawDate).getTime();
          if (!Number.isNaN(pMs)) {
            const days = Math.max(0, Math.floor((now - pMs) / (24 * 60 * 60 * 1000)));
            if (days > maxAgingDays) {
              maxAgingDays = days;
            }
          }
        }
      }
    }

    // --- Urgency Level & Triage Classification ---
    const urgencyReasons: string[] = [];
    let urgencyLevel: PipelineUrgencyLevel = "NORMAL";

    // 1. Critical triggers
    if (mouIsExpired) {
      urgencyLevel = "CRITICAL";
      urgencyReasons.push("MoU Kadaluwarsa");
    } else if (mouDaysLeft !== undefined && mouDaysLeft <= 7 && latestMouStatus === "APPROVED") {
      urgencyLevel = "CRITICAL";
      urgencyReasons.push(`MoU Berakhir H-${mouDaysLeft}`);
    }

    if (hasBlockedItems && maxAgingDays > 7) {
      urgencyLevel = "CRITICAL";
      urgencyReasons.push(`POSM Tertahan ${maxAgingDays} Hari`);
    }

    if (mouDaysPendingApproval !== undefined && mouDaysPendingApproval > 3) {
      urgencyLevel = "CRITICAL";
      urgencyReasons.push(`MoU Menunggu Persetujuan ${mouDaysPendingApproval} Hari`);
    }

    // 2. Warning triggers (if not already CRITICAL)
    if (urgencyLevel !== "CRITICAL") {
      if (mouDaysLeft !== undefined && mouDaysLeft <= 30 && latestMouStatus === "APPROVED") {
        urgencyLevel = "WARNING";
        urgencyReasons.push(`MoU Berakhir H-${mouDaysLeft}`);
      }
      if (hasBlockedItems) {
        urgencyLevel = "WARNING";
        if (maxAgingDays > 0) {
          urgencyReasons.push(`POSM Tertahan ${maxAgingDays} Hari`);
        } else {
          urgencyReasons.push("POSM Terkendala");
        }
      }
    }

    const pendingCount = totalPlacements - doneCount;

    // --- 3. Field Events Summary ---
    const matchedEvents = safeEvents.filter((evt) => matchesEvent(evt, outlet));
    const totalEvents = matchedEvents.length;
    let upcomingCount = 0;

    for (const evt of matchedEvents) {
      const statusUpper = (evt.status || "").trim().toUpperCase();
      if (statusUpper === "UPCOMING") {
        upcomingCount++;
      }
    }

    // Determine nearest event: prioritize upcoming/future events chronologically
    let nearestEventName: string | undefined;
    let nearestEventDate: string | undefined;
    let nearestEventStatus: string | undefined;

    if (totalEvents > 0) {
      const sortedEvents = [...matchedEvents].sort((a, b) => {
        const rawDateA = a.startDate || a.date;
        const rawDateB = b.startDate || b.date;
        if (!rawDateA && !rawDateB) return 0;
        if (!rawDateA) return 1;
        if (!rawDateB) return -1;

        const timeA = new Date(rawDateA).getTime();
        const timeB = new Date(rawDateB).getTime();
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);

        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;

        const isFutureA = timeA >= now - 86400000;
        const isFutureB = timeB >= now - 86400000;

        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;
        if (isFutureA && isFutureB) return timeA - timeB; // Soonest upcoming first
        return timeB - timeA; // Most recent past event first
      });

      const nearest = sortedEvents[0];
      if (nearest) {
        nearestEventName = nearest.name;
        const rawDate = nearest.startDate || nearest.date;
        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!Number.isNaN(parsed.getTime())) {
            nearestEventDate = parsed.toISOString();
          }
        }
        nearestEventStatus = nearest.status;
      }
    }

    // --- 4. Content Media Summary ---
    const matchedContents = safeContents.filter((cnt) => matchesContent(cnt, outlet));
    const totalContents = matchedContents.length;
    let publishedCount = 0;
    let inReviewCount = 0;

    for (const cnt of matchedContents) {
      const statusUpper = (cnt.status || "").trim().toUpperCase();
      if (statusUpper === "PUBLISHED") {
        publishedCount++;
      } else if (statusUpper === "IN_REVIEW") {
        inReviewCount++;
      }
    }

    let latestPlatform: string | undefined;
    if (totalContents > 0) {
      // Sort to get the most recent content (items with timestamps sorted before items without)
      const sortedContents = [...matchedContents].sort((a, b) => {
        const dateA = a.publishDate || a.createdAt || "";
        const dateB = b.publishDate || b.createdAt || "";
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);
        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;
        return timeB - timeA;
      });
      latestPlatform = sortedContents[0]?.platform;
    }

    // --- Final Row Output ---
    return {
      id: outlet.id,
      code: outlet.code || "",
      name: outlet.name || "",
      type: outlet.type || "",
      tier: outlet.tier || "",
      city: outlet.city || "",
      address: outlet.address || "",
      picName: outlet.picName || "",
      picPhone: outlet.picPhone || "",
      active: outlet.active ?? true,
      branch: {
        id: outlet.branch?.id || outlet.branchId || "",
        name: outlet.branch?.name || "",
        code: outlet.branch?.code || "",
      },
      mouSummary: {
        total: totalMous,
        latestStatus: latestMouStatus,
        compensationValue: totalCompensationValue,
        isHealthy,
        daysLeft: mouDaysLeft,
        isExpiringSoon: mouIsExpiringSoon,
        isExpired: mouIsExpired,
        daysPendingApproval: mouDaysPendingApproval,
        endDate: mouEndDateStr,
      },
      placementSummary: {
        total: totalPlacements,
        doneCount,
        pendingCount,
        totalCost: totalPlacementCost,
        hasBlockedItems,
        maxAgingDays,
        blockedCount,
      },
      eventSummary: {
        total: totalEvents,
        upcomingCount,
        nearestEventName,
        nearestEventDate,
        status: nearestEventStatus,
      },
      contentSummary: {
        total: totalContents,
        publishedCount,
        inReviewCount,
        latestPlatform,
      },
      urgencyLevel,
      urgencyReasons,
    };
  });
}

export interface PipelineFilterParams {
  q?: string | null;
  search?: string | null;
  branchId?: string | null;
  tier?: string | null;
  bottleneckOnly?: boolean | string | null;
  urgencyLevel?: PipelineUrgencyLevel | "ALL" | null;
}

/**
 * Pure filter helper for pipeline rows.
 * Supports filtering by branch, tier, search query (name, code, city, picName, address), bottleneck flag, and SLA urgency level.
 */
export function filterPipelineRows(
  rows: OutletPipelineRow[],
  filters: PipelineFilterParams
): OutletPipelineRow[] {
  let result = rows;

  const branchId = filters.branchId;
  if (branchId && branchId.toUpperCase() !== "ALL") {
    result = result.filter((row) => row.branch.id === branchId);
  }

  const tier = filters.tier;
  if (tier && tier.toUpperCase() !== "ALL") {
    result = result.filter((row) => row.tier === tier);
  }

  const query = (filters.q ?? filters.search)?.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (row) =>
        (row.name && row.name.toLowerCase().includes(query)) ||
        (row.code && row.code.toLowerCase().includes(query)) ||
        (row.city && row.city.toLowerCase().includes(query)) ||
        (row.picName && row.picName.toLowerCase().includes(query)) ||
        (row.address && row.address.toLowerCase().includes(query))
    );
  }

  const isBottleneck =
    filters.bottleneckOnly === true ||
    filters.bottleneckOnly === "true" ||
    filters.bottleneckOnly === "1";
  if (isBottleneck) {
    result = result.filter((row) => row.placementSummary.hasBlockedItems === true);
  }

  const urgency = filters.urgencyLevel;
  if (urgency && urgency.toUpperCase() !== "ALL") {
    result = result.filter((row) => row.urgencyLevel === urgency);
  }

  return result;
}
