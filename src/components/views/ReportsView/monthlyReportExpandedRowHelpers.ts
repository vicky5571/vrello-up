export interface ParsedActivityItem {
  category: "POSM" | "MOU" | "CONTENT" | "EVENT" | "GENERAL";
  title: string;
  detail?: string;
}

export function parseActivityDisplay(item: unknown): ParsedActivityItem {
  if (!item) return { category: "GENERAL", title: "—" };
  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    const rawType = String(record.type || "").toUpperCase();
    const rawTitle = String(record.title || record.name || "—");
    const rawDetail = typeof record.detail === "string" ? record.detail : undefined;

    let category: ParsedActivityItem["category"] = "GENERAL";
    if (rawType.includes("PLACEMENT") || rawTitle.startsWith("[POSM]")) category = "POSM";
    else if (rawType.includes("MOU") || rawTitle.startsWith("[MOU]")) category = "MOU";
    else if (rawType.includes("CONTENT") || rawTitle.startsWith("[KONTEN]")) category = "CONTENT";
    else if (rawType.includes("EVENT") || rawTitle.startsWith("[EVENT]")) category = "EVENT";

    const cleanTitle = rawTitle.replace(/^\[(POSM|MOU|KONTEN|EVENT)\]\s*/i, "").trim();
    return { category, title: cleanTitle, detail: rawDetail };
  }
  const str = String(item);
  let category: ParsedActivityItem["category"] = "GENERAL";
  if (str.startsWith("[POSM]")) category = "POSM";
  else if (str.startsWith("[MOU]")) category = "MOU";
  else if (str.startsWith("[KONTEN]")) category = "CONTENT";
  else if (str.startsWith("[EVENT]")) category = "EVENT";

  const cleanTitle = str.replace(/^\[(POSM|MOU|KONTEN|EVENT)\]\s*/i, "").trim();
  const [titlePart, ...detailParts] = cleanTitle.split(" · ");
  return {
    category,
    title: titlePart || cleanTitle,
    detail: detailParts.join(" · ") || undefined,
  };
}

export interface MonthlyReportSupportingDoc {
  id: string;
  name: string;
  fileType: string;
  filePath: string;
}

export interface MonthlyReportExpandedItem {
  id: string;
  month: string;
  year: number;
  activities?: unknown[];
  achievements?: unknown[];
  keyIssues?: unknown[];
  actionPlans?: unknown[];
  summary?: unknown;
}

export interface MonthlyReportExpandedRowProps<T extends MonthlyReportExpandedItem = MonthlyReportExpandedItem> {
  report: T;
  periodLabel: string;
  supporting: MonthlyReportSupportingDoc[];
  canManage: boolean;
  isDeletingId: string | null;
  onDeleteReport: (report: T) => void | Promise<void>;
  onPrintReport?: (report: T) => void | Promise<void>;
}

export const CATEGORY_STYLES: Record<
  ParsedActivityItem["category"],
  { bg: string; text: string }
> = {
  POSM: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/60",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  MOU: {
    bg: "bg-violet-50 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-800/60",
    text: "text-violet-700 dark:text-violet-300",
  },
  CONTENT: {
    bg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/60",
    text: "text-sky-700 dark:text-sky-300",
  },
  EVENT: {
    bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/60",
    text: "text-amber-700 dark:text-amber-300",
  },
  GENERAL: {
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
  },
};
