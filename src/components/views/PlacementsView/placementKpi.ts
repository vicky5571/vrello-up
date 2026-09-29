import { Wallet, CheckCircle2, Radio, Clock } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { calculatePlacementKPIs } from "@/lib/marcom/placementAnalytics";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import type { MarcomPlacement } from "@/types";

export function buildPlacementKpiItems(placements: MarcomPlacement[]): KpiCardItem[] {
  const kpis = calculatePlacementKPIs(placements);

  return [
    {
      label: "Total Budget Terpakai",
      value: formatIDR(kpis.totalCost),
      helper:
        kpis.totalCount > 0
          ? `Rata-rata ${formatIDR(Math.round(kpis.totalCost / kpis.totalCount))} / titik`
          : "Belum ada pengeluaran",
      icon: Wallet,
      color: "emerald",
    },
    {
      label: "Tingkat Penyelesaian",
      value: `${kpis.completionRate}%`,
      helper: `${kpis.doneCount} dari ${kpis.totalCount} placement selesai`,
      icon: CheckCircle2,
      color: "blue",
    },
    {
      label: "Rasio Pemasangan",
      value: `${kpis.im3Count} : ${kpis.triCount}`,
      helper: `${kpis.im3Count} IM3 (Kuning) • ${kpis.triCount} 3 (Pink)`,
      icon: Radio,
      color: "amber",
    },
    {
      label: "Menunggu vs Selesai",
      value: `${kpis.pendingCount} Menunggu / ${kpis.doneCount} Selesai`,
      helper: `${kpis.notStartedCount} To Do • ${kpis.inProgressCount} In Progress${kpis.issueCount > 0 ? ` • ${kpis.issueCount} Kendala` : ""}`,
      icon: Clock,
      color: kpis.issueCount > 0 ? "rose" : "orange",
    },
  ];
}
