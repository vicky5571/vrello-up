import type { EventStatus } from "@/types";

export type ActivityViewMode = "cards" | "table" | "calendar" | "timeline";

export const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; badge: string; text: string; bg: string; border: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/40",
  },
  ON_PROGRESS: {
    label: "On Progress",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/40",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/40",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-900/40",
  },
};

export const EVENT_TYPE_STYLES: Record<string, { label: string; badge: string }> = {
  Launch: { label: "Store Launch", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  Roadshow: { label: "Mall Roadshow", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  Exhibition: { label: "Exhibition", badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  Booth: { label: "Pop-up Booth", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  Workshop: { label: "Workshop", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  Community: { label: "Community", badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
};
