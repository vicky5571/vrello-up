/**
 * Pure SLA evaluation rules and persistent deduplication cache.
 * Follows the Strangler Pattern (isolated from useWorkspaceStore god file).
 */

export interface MouSlaCandidate {
  id: string;
  partnerName: string;
  status: string;
  submissionDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt?: string | null;
}

export interface ContentSlaCandidate {
  id: string;
  title: string;
  status: string;
  updatedAt?: string | null;
  createdAt?: string | null;
  picName?: string | null;
}

export interface EventSlaCandidate {
  id: string;
  name: string;
  status?: string;
  startDate?: string | null;
  date?: string | null;
  eventType?: string;
  location?: string;
  branchName?: string;
  budget?: number;
  targetAttendee?: number;
  notes?: string;
  picName?: string;
}

export interface MouSlaEvaluation {
  escalatedMous: Array<{ mou: MouSlaCandidate; daysPending: number }>;
  expiringMous: Array<{ mou: MouSlaCandidate; daysLeft: number }>;
  expiredMous: Array<{ mou: MouSlaCandidate; daysExpired: number }>;
}

export interface ContentSlaEvaluation {
  overdueReviewContents: Array<{ content: ContentSlaCandidate; daysInReview: number }>;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MOU_ESCALATION_DAYS = 3;
const MOU_EXPIRING_DAYS = 30;
const CONTENT_REVIEW_ESCALATION_DAYS = 2;
const EVENT_LEAD_TIME_DAYS = 3;

/**
 * Evaluates MOUs for:
 * 1. SLA Breach: Sitting in SUBMITTED for > 3 days.
 * 2. Expiry Watchdog: APPROVED with end date within 30 days.
 * 3. Expired: APPROVED with end date in the past (requires manual human action: renew or mark done).
 */
export function evaluateMouSla(
  mous: MouSlaCandidate[],
  now: Date = new Date(),
): MouSlaEvaluation {
  const nowMs = now.getTime();
  const escalatedMous: MouSlaEvaluation["escalatedMous"] = [];
  const expiringMous: MouSlaEvaluation["expiringMous"] = [];
  const expiredMous: MouSlaEvaluation["expiredMous"] = [];

  for (const mou of mous) {
    // 1. Check SUBMITTED > 3 days
    if (mou.status === "SUBMITTED") {
      const submitDateStr = mou.submissionDate || mou.updatedAt;
      if (submitDateStr) {
        const submitMs = new Date(submitDateStr).getTime();
        if (!isNaN(submitMs)) {
          const elapsedDays = Math.floor((nowMs - submitMs) / MS_PER_DAY);
          if (elapsedDays >= MOU_ESCALATION_DAYS) {
            escalatedMous.push({ mou, daysPending: elapsedDays });
          }
        }
      }
    }

    // 2. Check Expiry within 30 days & Already Expired
    if ((mou.status === "APPROVED" || mou.status === "DONE") && mou.endDate) {
      const endMs = new Date(mou.endDate).getTime();
      if (!isNaN(endMs)) {
        const diffMs = endMs - nowMs;
        const daysLeft = Math.ceil(diffMs / MS_PER_DAY);
        if (daysLeft <= 0 && mou.status !== "DONE") {
          expiredMous.push({ mou, daysExpired: Math.abs(daysLeft) });
        } else if (daysLeft > 0 && daysLeft <= MOU_EXPIRING_DAYS) {
          expiringMous.push({ mou, daysLeft });
        }
      }
    }
  }

  return { escalatedMous, expiringMous, expiredMous };
}

/**
 * Evaluates Content Posts for SLA Breaches:
 * Posts sitting in IN_REVIEW for > 2 days.
 */
export function evaluateContentSla(
  contents: ContentSlaCandidate[],
  now: Date = new Date(),
): ContentSlaEvaluation {
  const nowMs = now.getTime();
  const overdueReviewContents: ContentSlaEvaluation["overdueReviewContents"] = [];

  for (const content of contents) {
    if (content.status === "IN_REVIEW") {
      const touchDateStr = content.updatedAt || content.createdAt;
      if (touchDateStr) {
        const touchMs = new Date(touchDateStr).getTime();
        if (!isNaN(touchMs)) {
          const elapsedDays = Math.floor((nowMs - touchMs) / MS_PER_DAY);
          if (elapsedDays >= CONTENT_REVIEW_ESCALATION_DAYS) {
            overdueReviewContents.push({ content, daysInReview: elapsedDays });
          }
        }
      }
    }
  }

  return { overdueReviewContents };
}

/**
 * Evaluates Field Events within H-3 lead time that do not yet have an active Kanban task.
 */
export function evaluateUpcomingEvents(
  events: EventSlaCandidate[],
  existingTaskMarcomIdsOrTitles: Set<string>,
  now: Date = new Date(),
): EventSlaCandidate[] {
  const nowMs = now.getTime();
  const leadTimeMs = EVENT_LEAD_TIME_DAYS * MS_PER_DAY;
  const eligibleEvents: EventSlaCandidate[] = [];

  for (const event of events) {
    if (event.status === "CANCELLED" || event.status === "COMPLETED") continue;
    const rawDate = event.startDate || event.date;
    if (!rawDate) continue;

    const startMs = new Date(rawDate).getTime();
    if (isNaN(startMs)) continue;

    const diffMs = startMs - nowMs;
    // Within 3 days and in the future (or today)
    if (diffMs > 0 && diffMs <= leadTimeMs) {
      // Check idempotency: task does not already exist
      const alreadyHasTask =
        existingTaskMarcomIdsOrTitles.has(event.id) ||
        existingTaskMarcomIdsOrTitles.has(event.name.trim().toLowerCase());

      if (!alreadyHasTask) {
        eligibleEvents.push(event);
      }
    }
  }

  return eligibleEvents;
}

// ---------------------------------------------------------------------------
// Persistent Alert Deduplication Cache (Anti-Spam on F5 reload)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "vrello_sla_dedup_v1";
const inMemoryCache = new Map<string, number>();

function getAlertStorage(): Map<string, number> {
  if (typeof window === "undefined" || !window.localStorage) {
    return inMemoryCache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return inMemoryCache;
    const parsed = JSON.parse(raw);
    const map = new Map<string, number>();
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number") map.set(k, v);
    }
    return map;
  } catch {
    return inMemoryCache;
  }
}

function saveAlertStorage(map: Map<string, number>): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    const obj = Object.fromEntries(map.entries());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Quota or storage unavailable
  }
}

/**
 * Checks whether an alert key has already been notified within the specified TTL.
 */
export function isAlertNotified(
  key: string,
  ttlMs = MS_PER_DAY,
  nowMs = Date.now(),
): boolean {
  const map = getAlertStorage();
  const lastTime = map.get(key);
  if (!lastTime) return false;
  return nowMs - lastTime < ttlMs;
}

/**
 * Marks an alert key as notified at the current timestamp.
 */
export function markAlertNotified(
  key: string,
  nowMs = Date.now(),
): void {
  const map = getAlertStorage();
  map.set(key, nowMs);
  inMemoryCache.set(key, nowMs);
  saveAlertStorage(map);
}

/**
 * Clears expired alerts from the deduplication cache.
 */
export function pruneAlertCache(
  ttlMs = MS_PER_DAY,
  nowMs = Date.now(),
): void {
  const map = getAlertStorage();
  let changed = false;
  for (const [k, time] of map.entries()) {
    if (nowMs - time >= ttlMs) {
      map.delete(k);
      inMemoryCache.delete(k);
      changed = true;
    }
  }
  if (changed) {
    saveAlertStorage(map);
  }
}

