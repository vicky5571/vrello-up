"use client";

import { QuarterlyRecapTab } from "./QuarterlyRecapTab";
import type { MarcomPlacement, Branch } from "@/types";

export interface PlacementsRecapTabProps {
  placements: MarcomPlacement[];
  branches: Branch[];
  materials: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  onDrillDown: (filter: { quarter: string; campaignTheme?: string; materialName?: string }) => void;
  onRecordPlacement?: () => void;
}

export function PlacementsRecapTab({
  placements,
  branches,
  materials,
  onDrillDown,
  onRecordPlacement,
}: PlacementsRecapTabProps) {
  return (
    <div className="space-y-4">
      <QuarterlyRecapTab
        placements={placements}
        branches={branches}
        materials={materials}
        onDrillDown={onDrillDown}
        onRecordPlacement={onRecordPlacement}
      />
    </div>
  );
}
