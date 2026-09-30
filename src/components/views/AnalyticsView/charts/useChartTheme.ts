"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export interface ChartTheme {
  /** Axis tick / label text color meeting WCAG AA contrast on both themes. */
  tick: string;
  /** Axis line stroke. */
  axisLine: string;
  /** Cartesian grid stroke. */
  grid: string;
  /** Tooltip container background. */
  tooltipBg: string;
}

const LIGHT: ChartTheme = {
  tick: "#475569", // slate-600 — 7.0:1 on white
  axisLine: "#cbd5e1", // slate-300
  grid: "#e2e8f0", // slate-200
  tooltipBg: "#0f172a", // slate-900
};

const DARK: ChartTheme = {
  tick: "#cbd5e1", // slate-300 — 9.6:1 on #18191B
  axisLine: "#334155", // slate-700
  grid: "#334155", // slate-700
  tooltipBg: "#0f172a", // slate-900
};

/**
 * Resolves theme-aware chart colors for Recharts axes, grids and tooltips.
 * Defaults to the light palette during SSR / before mount to avoid hydration
 * mismatches; the `mounted` guard ensures a smooth post-mount swap.
 */
export function useChartTheme(): { theme: ChartTheme; isDark: boolean } {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  return { theme: isDark ? DARK : LIGHT, isDark };
}
