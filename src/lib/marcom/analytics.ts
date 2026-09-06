export interface ReportSummaryInput {
  month?: string;
  summary?: {
    totalActivities?: number;
    completionRate?: number;
  } | null;
}
export interface ReportsSummary {
  total: number;
  totalActivities: number;
  completionRate: number;
}

export function summarizeReports(rows: ReportSummaryInput[]): ReportsSummary {
  const total = rows.length;
  let totalActivities = 0;
  let completionSum = 0;
  for (const row of rows) {
    totalActivities += row.summary?.totalActivities ?? 0;
    completionSum += row.summary?.completionRate ?? 0;
  }
  return {
    total,
    totalActivities,
    completionRate: total === 0 ? 0 : Math.round(completionSum / total),
  };
}

export interface BranchStatusInput {
  status?: string;
}

export interface BranchCompletion {
  total: number;
  done: number;
  completionRate: number;
}

export function summarizeBranches(branches: BranchStatusInput[]): BranchCompletion {
  const total = branches.length;
  const done = branches.filter((b) => b.status === "DONE").length;
  return {
    total,
    done,
    completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export interface MouStatusInput {
  status?: string;
}

export type MouFunnel = Record<string, number>;

export function summarizeMouFunnel(mous: MouStatusInput[]): MouFunnel {
  const funnel: MouFunnel = {};
  for (const mou of mous) {
    const status = mou.status ?? "UNKNOWN";
    funnel[status] = (funnel[status] ?? 0) + 1;
  }
  return funnel;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Calendar index of a report `month` value (January=0..December=11).
 * Accepts bare names ("September") and dashboard-style labels
 * ("September 2026"); unknown values yield -1 so they sort first
 * instead of throwing.
 */
export function monthIndex(month: string): number {
  const name = month.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return MONTH_NAMES.findIndex((m) => m.toLowerCase() === name);
}

export interface ReportPeriodInput {
  month: string;
  year: number;
}

/** Oldest-first calendar order for completion trends and report lists. */
export function compareReportPeriodAsc(a: ReportPeriodInput, b: ReportPeriodInput): number {
  return a.year - b.year || monthIndex(a.month) - monthIndex(b.month);
}

/** Newest-first calendar order (mirrors the reports API listing). */
export function compareReportPeriodDesc(a: ReportPeriodInput, b: ReportPeriodInput): number {
  return b.year - a.year || monthIndex(b.month) - monthIndex(a.month);
}
