import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getMonthDateRange, generateReportDraft } from "@/lib/marcom/reportDraftEngine";
import { MONTH_OPTIONS } from "@/lib/marcom/analytics";

function asJsonArray(value: unknown): Prisma.InputJsonValue {
  return (Array.isArray(value) ? value : []) as Prisma.InputJsonValue;
}

export interface SyncReportOptions {
  month?: string;
  year?: number;
  prismaClient?: any;
}

export interface SyncReportResult {
  action: "created" | "updated";
  reportId: string;
  month: string;
  year: number;
  totalActivities: number;
  completionRate: number;
  preservedCustomNarratives: boolean;
}

/**
 * Enumerates every (month, year) period chronologically between start and end.
 * Returns empty array if start is after end, or inputs are invalid.
 */
export function enumerateReportPeriods(
  startMonth: string,
  startYear: number,
  endMonth: string,
  endYear: number,
): { month: string; year: number }[] {
  const startIdx = MONTH_OPTIONS.indexOf(startMonth as any);
  const endIdx = MONTH_OPTIONS.indexOf(endMonth as any);
  if (startIdx === -1 || endIdx === -1) return [];
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return [];

  const startVal = startYear * 12 + startIdx;
  const endVal = endYear * 12 + endIdx;
  if (startVal > endVal) return [];

  const results: { month: string; year: number }[] = [];
  let currentVal = startVal;
  while (currentVal <= endVal) {
    const y = Math.floor(currentVal / 12);
    const mIdx = currentVal % 12;
    results.push({ month: MONTH_OPTIONS[mIdx], year: y });
    currentVal++;
  }
  return results;
}

/**
 * Resolves the immediately preceding calendar month and year for rollover syncs.
 */
export function resolvePreviousMonthPeriod(date: Date = new Date()): {
  month: string;
  year: number;
} {
  const currentMonthIdx = date.getMonth();
  if (currentMonthIdx === 0) {
    return { month: MONTH_OPTIONS[11], year: date.getFullYear() - 1 };
  }
  return { month: MONTH_OPTIONS[currentMonthIdx - 1], year: date.getFullYear() };
}

/**
 * Checks whether an existing narrative array has been customized by an admin.
 * If user customized it, returns true to prevent daily cron from overwriting.
 */
export function hasCustomNarratives(
  existingNarratives: unknown,
  defaultNarratives: string[],
): boolean {
  if (!Array.isArray(existingNarratives) || existingNarratives.length === 0) return false;
  // If lengths differ or content differs from standard synthesized bullets, consider custom
  if (existingNarratives.length !== defaultNarratives.length) return true;
  return existingNarratives.some(
    (item, idx) => String(item).trim() !== String(defaultNarratives[idx]).trim()
  );
}

/**
 * Performs atomic daily synchronization and monthly report kickoff.
 * - If report does not exist for (month, year): creates it automatically.
 * - If report exists: refreshes summary metrics and activities, but strictly preserves user-authored narratives.
 */
export async function syncMonthlyReport(opts?: SyncReportOptions): Promise<SyncReportResult> {
  const db = opts?.prismaClient ?? prisma;
  const now = new Date();
  const month = opts?.month?.trim() || MONTH_OPTIONS[now.getMonth()];
  const year = opts?.year ?? now.getFullYear();

  const { start, end } = getMonthDateRange(month, year);

  const [placements, mous, contents, events] = await Promise.all([
    db.placement.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        outlet: { select: { name: true, code: true } },
        material: { select: { name: true, type: true, requiresMou: true } },
      },
      orderBy: { date: "asc" },
    }),
    db.mou.findMany({
      where: {
        OR: [
          { startDate: { gte: start, lte: end } },
          { submissionDate: { gte: start, lte: end } },
          {
            AND: [
              { startDate: { lte: end } },
              { OR: [{ endDate: null }, { endDate: { gte: start } }] },
              { status: { in: ["APPROVED", "DONE"] } },
            ],
          },
        ],
      },
      orderBy: { startDate: "asc" },
    }),
    db.contentPost.findMany({
      where: { publishDate: { gte: start, lte: end } },
      orderBy: { publishDate: "asc" },
    }),
    db.fieldEvent.findMany({
      where: { startDate: { gte: start, lte: end } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const draft = generateReportDraft({
    month,
    year,
    placements,
    mous,
    contents,
    events,
  });

  const existing = await db.monthlyReport.findFirst({
    where: { month, year },
  });

  if (!existing) {
    const created = await db.monthlyReport.create({
      data: {
        month,
        year,
        summary: draft.summary as unknown as Prisma.InputJsonValue,
        activities: asJsonArray(draft.activities),
        achievements: asJsonArray(draft.achievements),
        keyIssues: asJsonArray(draft.keyIssues),
        actionPlans: asJsonArray(draft.actionPlans),
      },
    });

    return {
      action: "created",
      reportId: created.id,
      month,
      year,
      totalActivities: draft.summary.totalActivities,
      completionRate: draft.summary.completionRate,
      preservedCustomNarratives: false,
    };
  }

  // Preserve existing narrative arrays if admin modified them
  const isCustomAchievements = hasCustomNarratives(existing.achievements, draft.achievements);
  const isCustomIssues = hasCustomNarratives(existing.keyIssues, draft.keyIssues);
  const isCustomPlans = hasCustomNarratives(existing.actionPlans, draft.actionPlans);
  const preservedCustom = isCustomAchievements || isCustomIssues || isCustomPlans;

  const updated = await db.monthlyReport.update({
    where: { id: existing.id },
    data: {
      summary: draft.summary as unknown as Prisma.InputJsonValue,
      activities: asJsonArray(draft.activities),
      achievements: isCustomAchievements ? existing.achievements : asJsonArray(draft.achievements),
      keyIssues: isCustomIssues ? existing.keyIssues : asJsonArray(draft.keyIssues),
      actionPlans: isCustomPlans ? existing.actionPlans : asJsonArray(draft.actionPlans),
    },
  });

  return {
    action: "updated",
    reportId: updated.id,
    month,
    year,
    totalActivities: draft.summary.totalActivities,
    completionRate: draft.summary.completionRate,
    preservedCustomNarratives: preservedCustom,
  };
}

