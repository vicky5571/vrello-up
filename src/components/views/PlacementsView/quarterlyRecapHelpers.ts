import { DEFAULT_THEME_FALLBACK } from "@/lib/marcom/posmQuarterlyAnalytics";
import type { QuarterlyTargetMap } from "@/types";

export interface DrillDownFilter {
  quarter: string;
  campaignTheme?: string;
  materialId?: string;
  materialName?: string;
}

/**
 * Returns consistent localStorage key for storing targets per quarter.
 */
export function formatTargetKey(quarter: string): string {
  return `vrello_posm_targets_${quarter.trim()}`;
}

/**
 * Maps completion percentage to semantic Tailwind progress bar colors.
 */
export function getProgressBarColorClass(percentage: number): string {
  if (percentage <= 0) return "bg-slate-300 dark:bg-slate-700";
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

/**
 * Sanitizes drill-down parameters so the receiving table view can filter cleanly.
 */
export function sanitizeDrillDownFilter(input: DrillDownFilter): DrillDownFilter {
  const quarter = input.quarter.trim();
  const theme = (input.campaignTheme || "").trim();

  // If the user clicks on "Reguler / Tanpa Tema", drill-down without strict theme filter
  const isDefaultTheme = theme === DEFAULT_THEME_FALLBACK || theme === "";
  const campaignTheme = isDefaultTheme ? "" : theme;

  return {
    quarter,
    campaignTheme,
    materialId: input.materialId?.trim(),
    materialName: input.materialName?.trim(),
  };
}

/**
 * Safely loads targets from localStorage with error catching.
 */
export function loadQuarterlyTargets(
  quarter: string
): QuarterlyTargetMap {
  if (typeof window === "undefined") return {};
  try {
    const key = formatTargetKey(quarter);
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as QuarterlyTargetMap;
  } catch {
    return {};
  }
}

/**
 * Safely saves targets to localStorage with error catching.
 */
export function saveQuarterlyTargets(
  quarter: string,
  targets: QuarterlyTargetMap
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = formatTargetKey(quarter);
    localStorage.setItem(key, JSON.stringify(targets));
    return true;
  } catch {
    return false;
  }
}
