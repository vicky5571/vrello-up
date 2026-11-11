import {
  Bell,
  UserPlus,
  FileCheck,
  ArrowLeftRight,
  AlarmClock,
  AlertTriangle,
} from "lucide-react";
import type { NotificationKind } from "@/lib/productivity/notifications";

export const KIND_META: Record<
  NotificationKind,
  { label: string; icon: typeof Bell; className: string }
> = {
  borrow_compensation: {
    label: "Kompensasi ganti rugi",
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  borrow_overdue: {
    label: "Equipment overdue",
    icon: AlarmClock,
    className: "bg-rose-500/10 text-rose-500",
  },
  assignment: {
    label: "Assignments",
    icon: UserPlus,
    className: "bg-blue-500/10 text-blue-500",
  },
  mou_approval: {
    label: "MOU approvals",
    icon: FileCheck,
    className: "bg-violet-500/10 text-violet-500",
  },
  mou_expiry: {
    label: "MOU expiry",
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  status: {
    label: "Status changes",
    icon: ArrowLeftRight,
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  overdue: {
    label: "Overdue",
    icon: AlarmClock,
    className: "bg-rose-500/10 text-rose-500",
  },
};

export const KIND_ORDER: NotificationKind[] = [
  "borrow_compensation",
  "borrow_overdue",
  "overdue",
  "mou_expiry",
  "mou_approval",
  "assignment",
  "status",
];

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
