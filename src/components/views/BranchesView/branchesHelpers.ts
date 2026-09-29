import { Building2, Store, FileText, CheckCircle2 } from "lucide-react";
import type { MarcomBranch, BranchStatus } from "@/types";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

export function calculateBranchKpis(branches: MarcomBranch[]): KpiCardItem[] {
  const totalBranches = branches.length;
  const activeBranches = branches.filter(
    (b) => b.status === "DONE" || b.status === "ON_PROGRESS"
  ).length;

  const totalOutlets = branches.reduce((sum, b) => sum + (b.outletCount ?? 0), 0);
  const totalMous = branches.reduce((sum, b) => sum + (b.mouCount ?? 0), 0);

  const branchesWithProgress = branches.filter((b) => b.progress != null);
  const avgProgress =
    branchesWithProgress.length > 0
      ? Math.round(
          branchesWithProgress.reduce((sum, b) => sum + (b.progress ?? 0), 0) /
            branchesWithProgress.length
        )
      : 0;

  return [
    {
      label: "Total Branches",
      value: totalBranches,
      helper: `${activeBranches} Active / Operational`,
      icon: Building2,
      color: "blue",
    },
    {
      label: "Outlets Network",
      value: totalOutlets,
      helper: "Retail points supported",
      icon: Store,
      color: "orange",
    },
    {
      label: "Active Partnerships",
      value: totalMous,
      helper: "MOUs & legal contracts",
      icon: FileText,
      color: "violet",
    },
    {
      label: "Avg Program Progress",
      value: `${avgProgress}%`,
      helper: "Regional rollout metric",
      icon: CheckCircle2,
      color: "emerald",
    },
  ];
}

export function getBranchProgressColor(progress?: number | null): {
  barClass: string;
  textClass: string;
} {
  const val = progress ?? 0;
  if (val >= 100) {
    return {
      barClass: "bg-emerald-500",
      textClass: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (val >= 50) {
    return {
      barClass: "bg-cyan-500",
      textClass: "text-cyan-600 dark:text-cyan-400",
    };
  }
  if (val > 0) {
    return {
      barClass: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    barClass: "bg-slate-300 dark:bg-slate-700",
    textClass: "text-slate-400 dark:text-slate-500",
  };
}

export function getBranchStatusBadge(status?: BranchStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "DONE":
      return {
        label: "Done",
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      };
    case "ON_PROGRESS":
      return {
        label: "In Progress",
        badgeClass:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      };
    case "PENDING":
    default:
      return {
        label: "Pending",
        badgeClass:
          "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
      };
  }
}
