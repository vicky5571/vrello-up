"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KpiCardItem {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "blue" | "amber" | "emerald" | "violet" | "teal" | "rose" | "orange" | "indigo";
}

const COLOR_MAP: Record<
  NonNullable<KpiCardItem["color"]>,
  { bg: string; text: string; ring?: string }
> = {
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  violet: {
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
  },
  teal: {
    bg: "bg-teal-500/10 dark:bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
  },
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

export function KpiSummaryCards({ items }: { items: KpiCardItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item, idx) => {
        const Icon = item.icon;
        const colorStyles = COLOR_MAP[item.color || "blue"];

        return (
          <div
            key={idx}
            className="flex items-center gap-3.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors"
          >
            <div className={cn("p-2.5 rounded-xl shrink-0", colorStyles.bg)}>
              <Icon className={cn("w-4 h-4", colorStyles.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                {item.label}
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate mt-0.5">
                {item.value}
              </div>
              {item.helper && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {item.helper}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

