import type {
  OutletPipelineRow,
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

export type { OutletPipelineRow };

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
 * Normalizes MouStatus into the 5-state pipeline status union:
 * "APPROVED" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE"
 */
function normalizeMouStatus(status?: string | null): "APPROVED" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE" {
  if (!status) return "NONE";
  const upper = status.trim().toUpperCase();
  if (upper === "APPROVED" || upper === "DONE") return "APPROVED";
  if (upper === "SUBMITTED") return "SUBMITTED";
  if (upper === "REJECTED") return "REJECTED";
  if (upper === "DRAFT") return "DRAFT";
  return "DRAFT";
}

/**
 * Checks if a FieldEvent matches an outlet by explicit ID, location name, or branch affiliation.
 */
function matchesEvent(event: PipelineEventInput, outlet: PipelineOutletInput): boolean {
  if (event.outletId && event.outletId === outlet.id) {
    return true;
  }

  const oName = (outlet.name || "").trim().toLowerCase();
  const bName = (outlet.branch?.name || "").trim().toLowerCase();
  const bCity = (outlet.city || "").trim().toLowerCase();
  const bCode = (outlet.branch?.code || "").trim().toLowerCase();

  const eLoc = (event.location || "").trim().toLowerCase();
  const eName = (event.name || "").trim().toLowerCase();
  const eBranch = (event.branchName || "").trim().toLowerCase();

  // 1. Direct outlet name match in location or event title (ensure non-empty before includes)
  if (oName) {
    if (eLoc && (eLoc.includes(oName) || oName.includes(eLoc))) {
      return true;
    }
    if (eName && (eName.includes(oName) || oName.includes(eName))) {
      return true;
    }
  }

  // 2. Branch match
  if (event.branchId && (event.branchId === outlet.branchId || event.branchId === outlet.branch?.id)) {
    return true;
  }
  if (eBranch && (eBranch === bName || eBranch === bCity || (bCode && eBranch === bCode))) {
    return true;
  }

  return false;
}

/**
 * Checks if a ContentPost matches an outlet by explicit ID, title/caption mention, or branch affiliation.
 */
function matchesContent(content: PipelineContentInput, outlet: PipelineOutletInput): boolean {
  if (content.outletId && content.outletId === outlet.id) {
    return true;
  }

  const oName = (outlet.name || "").trim().toLowerCase();
  const bName = (outlet.branch?.name || "").trim().toLowerCase();
  const bCity = (outlet.city || "").trim().toLowerCase();
  const bCode = (outlet.branch?.code || "").trim().toLowerCase();

  const cTitle = (content.title || "").trim().toLowerCase();
  const cCaption = (content.caption || "").trim().toLowerCase();
  const cBranch = (content.branchName || "").trim().toLowerCase();

  // 1. Outlet name mention in title or caption (ensure non-empty before includes)
  if (oName) {
    if (cTitle && (cTitle.includes(oName) || oName.includes(cTitle))) {
      return true;
    }
    if (cCaption && (cCaption.includes(oName) || oName.includes(cCaption))) {
      return true;
    }
  }

  // 2. Branch match
  if (content.branchId && (content.branchId === outlet.branchId || content.branchId === outlet.branch?.id)) {
    return true;
  }
  if (cBranch && (cBranch === bName || cBranch === bCity || (bCode && cBranch === bCode))) {
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

    // --- 1. MoU Summary ---
    const totalMous = mous.length;
    let latestMouStatus: "APPROVED" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE" = "NONE";
    let totalCompensationValue = 0;

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
    }

    const hasApprovedMou = mous.some((m) => normalizeMouStatus(m.status) === "APPROVED");
    const isHealthy = latestMouStatus === "APPROVED";

    // --- 2. Placement Summary ---
    const totalPlacements = placements.length;
    let doneCount = 0;
    let totalPlacementCost = 0;
    let hasBlockedItems = false;

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
      if (statusUpper === "ISSUE" || (statusUpper !== "DONE" && isPermanent && !hasApprovedMou)) {
        hasBlockedItems = true;
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
      },
      placementSummary: {
        total: totalPlacements,
        doneCount,
        pendingCount,
        totalCost: totalPlacementCost,
        hasBlockedItems,
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
    };
  });
}

export interface PipelineFilterParams {
  q?: string | null;
  branchId?: string | null;
  tier?: string | null;
  bottleneckOnly?: boolean | string | null;
}

/**
 * Pure filter helper for pipeline rows.
 * Supports filtering by branch, tier, search query (name, code, city, picName), and bottleneck flag.
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

  const query = filters.q?.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (row) =>
        (row.name && row.name.toLowerCase().includes(query)) ||
        (row.code && row.code.toLowerCase().includes(query)) ||
        (row.city && row.city.toLowerCase().includes(query)) ||
        (row.picName && row.picName.toLowerCase().includes(query))
    );
  }

  const isBottleneck =
    filters.bottleneckOnly === true ||
    filters.bottleneckOnly === "true" ||
    filters.bottleneckOnly === "1";
  if (isBottleneck) {
    result = result.filter((row) => row.placementSummary.hasBlockedItems === true);
  }

  return result;
}
