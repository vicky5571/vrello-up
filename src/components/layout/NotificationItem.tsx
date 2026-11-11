"use client";

import type { AppNotification } from "@/lib/productivity/notifications";
import { cn } from "@/lib/utils";
import { KIND_META, timeAgo } from "./notificationCenterConfig";

interface NotificationItemProps {
  notification: AppNotification;
  isUnread: boolean;
  onSelect: (n: AppNotification) => void;
}

export function NotificationItem({
  notification: n,
  isUnread,
  onSelect,
}: NotificationItemProps) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(n)}
      className={cn(
        "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer",
        isUnread
          ? "bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          : "hover:bg-slate-100/70 dark:hover:bg-white/5",
      )}
    >
      <span
        className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          meta.className,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
          {n.title}
        </span>
        {n.body && (
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {n.body}
          </span>
        )}
        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          {timeAgo(n.createdAt)}
        </span>
      </span>
      {isUnread && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
      )}
    </button>
  );
}
