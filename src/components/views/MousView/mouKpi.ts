import type { MarcomMou } from "@/types";
import { CheckCircle, Clock, Coins } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

export type { KpiCardItem };

export function buildMouKpiItems(mous: MarcomMou[]): KpiCardItem[] {
  const activeCount = mous.filter((m) => m.status === "APPROVED").length;
  const pendingCount = mous.filter((m) => m.status === "SUBMITTED").length;
  const totalValue = mous.reduce(
    (acc, m) => acc + (m.compensationValue || 0),
    0
  );

  return [
    {
      label: "Active MOUs",
      value: activeCount,
      helper: "Approved agreements",
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Pending Approval",
      value: pendingCount,
      helper: "Submitted for review",
      icon: Clock,
      color: "amber",
    },
    {
      label: "Total Compensation Value",
      value: formatIDR(totalValue),
      helper: "Across all partnerships",
      icon: Coins,
      color: "blue",
    },
  ];
}
