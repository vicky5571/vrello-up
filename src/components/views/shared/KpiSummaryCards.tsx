"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardItem {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "blue" | "amber" | "emerald" | "violet" | "teal" | "rose" | "orange" | "indigo" | "pink";
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  active?: boolean;
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
  pink: {
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
  },
  indigo: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

export function KpiSummaryCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        count === 2 && "sm:grid-cols-2",
        count === 3 && "sm:grid-cols-3",
        count >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs animate-pulse"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="w-20 h-2.5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="w-14 h-5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="w-28 h-2 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface KpiSummaryCardsProps {
  items?: KpiCardItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  className?: string;
}

export function KpiSummaryCards({
  items,
  isLoading = false,
  skeletonCount = 4,
  className,
}: KpiSummaryCardsProps) {
  if (isLoading) {
    return <KpiSummaryCardsSkeleton count={skeletonCount} className={className} />;
  }

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        items.length === 2 && "sm:grid-cols-2",
        items.length === 3 && "sm:grid-cols-3",
        items.length >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const colorStyles = (item.color && COLOR_MAP[item.color]) || COLOR_MAP.blue;
        const isClickable = typeof item.onClick === "function";

        return (
          <div
            key={idx}
            onClick={item.onClick}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
            className={cn(
              "flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-all text-left",
              isClickable &&
                "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50",
              item.active &&
                "ring-2 ring-primary/60 border-primary/40 bg-slate-50/80 dark:bg-slate-800/50",
            )}
          >
            <div className={cn("p-2.5 rounded-xl shrink-0", colorStyles.bg)}>
              <Icon className={cn("w-4 h-4", colorStyles.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                  {item.label}
                </div>
                {item.trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-full shrink-0",
                      item.trend.positive === true &&
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      item.trend.positive === false &&
                        "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      item.trend.positive === undefined &&
                        "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {item.trend.positive === true && <TrendingUp className="w-2.5 h-2.5" />}
                    {item.trend.positive === false && <TrendingDown className="w-2.5 h-2.5" />}
                    {item.trend.positive === undefined && <Minus className="w-2.5 h-2.5" />}
                    <span>{item.trend.value}</span>
                    {item.trend.label && (
                      <span className="opacity-70 font-normal ml-0.5">{item.trend.label}</span>
                    )}
                  </span>
                )}
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate mt-0.5">
                {item.value}
              </div>
              {item.helper && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
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

KpiSummaryCards.Skeleton = KpiSummaryCardsSkeleton;
