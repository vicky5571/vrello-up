import type { MarcomMou } from "@/types";
import { FileText, CheckCircle, AlertTriangle, Coins } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { calculateMouValidity } from "./mouDateHelpers";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

export type { KpiCardItem };

export function buildMouKpiItems(
  mous: MarcomMou[],
  referenceNowMs: number = Date.now()
): KpiCardItem[] {
  const totalMous = mous.length;
  const activeCount = mous.filter((m) => m.status === "APPROVED").length;

  const urgentCount = mous.filter((m) => {
    if (m.status === "DONE" || m.status === "REJECTED") return false;
    const validity = calculateMouValidity(m.startDate, m.endDate, referenceNowMs);
    return validity.isExpired || validity.isExpiringSoon;
  }).length;

  const totalValue = mous.reduce(
    (acc, m) => acc + (m.compensationValue || 0),
    0
  );

  return [
    {
      label: "Total MOUs",
      value: totalMous,
      helper: "Registered agreements",
      icon: FileText,
      color: "blue",
    },
    {
      label: "Active Partnerships",
      value: activeCount,
      helper: "Approved & active",
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Expiring & Expired",
      value: urgentCount,
      helper: urgentCount > 0 ? "Urgent renewals needed" : "All agreements current",
      icon: AlertTriangle,
      color: urgentCount > 0 ? "amber" : undefined,
    },
    {
      label: "Total Plafon Commitment",
      value: formatIDR(totalValue),
      helper: "Across all partnerships",
      icon: Coins,
      color: "violet",
    },
  ];
}
