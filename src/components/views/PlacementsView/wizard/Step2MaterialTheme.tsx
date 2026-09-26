"use client";

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isPermanentMaterial, type MouSummaryInfo, type MouValidationResult } from "@/lib/marcom/placementMouBridge";
import {
  shouldShowMouSection,
  isPaidPlacement,
  togglePaidPlacement,
} from "./placementWizardHelpers";
import type { MarcomPlacement } from "@/types";

export const POSM_MATERIALS = [
  { label: "Poster", matchKeywords: ["poster"] },
  { label: "Shopblind", matchKeywords: ["shopblind", "shop blind"] },
  { label: "Stiker Etalase", matchKeywords: ["stiker", "etalase", "sticker"] },
  { label: "Bottom Etalase", matchKeywords: ["bottom", "etalase"] },
  { label: "Shop Sign / Neonbox", matchKeywords: ["sign", "neonbox", "neon box", "signboard", "branding"] },
  { label: "Banner", matchKeywords: ["banner"] },
  { label: "Other", matchKeywords: ["other", "lainnya"] },
];

export const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"] as const;
export const CAMPAIGN_THEMES = [
  "Product Hero",
  "Gemini",
  "Freedom Internet",
  "Taktis Merdeka",
] as const;

interface Step2MaterialThemeProps {
  placement: Partial<MarcomPlacement>;
  setPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  materialsList: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  mousList: MouSummaryInfo[];
  outletMous: MouSummaryInfo[];
  selectedMat?: { id: string; name: string; type?: string; requiresMou?: boolean };
  selectedMou?: MouSummaryInfo;
  mouValidation: MouValidationResult;
  onViewDocMou: (mou: MouSummaryInfo) => void;
}

export function Step2MaterialTheme({
  placement,
  setPlacement,
  materialsList,
  outletMous,
  selectedMat,
  selectedMou,
  mouValidation,
  onViewDocMou,
}: Step2MaterialThemeProps) {
  const [isMouManuallyExpanded, setIsMouManuallyExpanded] = useState(false);
  const [isAuxFieldsExpanded, setIsAuxFieldsExpanded] = useState(
    Boolean(placement.cost || placement.dimensions)
  );

  const activeChipLabel = (() => {
    if (!selectedMat) return null;
    const nameLower = selectedMat.name.toLowerCase();
    const typeLower = (selectedMat.type || "").toLowerCase();
    for (const chip of POSM_MATERIALS) {
      if (chip.matchKeywords.some((kw) => nameLower.includes(kw) || typeLower.includes(kw))) {
        return chip.label;
      }
    }
    return null;
  })();

  const handleSelectPosmChip = (chip: (typeof POSM_MATERIALS)[number]) => {
    let matchedId = "";
    for (const kw of chip.matchKeywords) {
      const match = materialsList.find(
        (m) =>
          m.name.toLowerCase().includes(kw) ||
          (m.type && m.type.toLowerCase().includes(kw))
      );
      if (match) {
        matchedId = match.id;
        break;
      }
    }
    if (!matchedId && materialsList.length > 0) {
      matchedId = materialsList[0].id;
    }
    if (matchedId) {
      setPlacement((prev) => (prev ? { ...prev, materialId: matchedId } : prev));
    }
  };

  const isPermanent = isPermanentMaterial({
    name: selectedMat?.name,
    type: selectedMat?.type,
    requiresMou: selectedMat?.requiresMou,
  });

  const showMou = shouldShowMouSection({
    cost: placement.cost,
    isPermanentAsset: isPermanent,
    mouId: placement.mouId,
    isManuallyExpanded: isMouManuallyExpanded,
  });

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Dimensi 1: Material POSM Chips */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Material POSM *
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {POSM_MATERIALS.map((chip) => {
            const isActive = activeChipLabel === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSelectPosmChip(chip)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                  isActive
                    ? "bg-lime-600 text-white border-lime-700 shadow-2xs ring-2 ring-lime-500/30"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Master Data Select */}
        <select
          required
          value={placement.materialId || ""}
          onChange={(e) =>
            setPlacement((prev) => (prev ? { ...prev, materialId: e.target.value } : prev))
          }
          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
        >
          <option value="">Pilih Material Katalog Master Data...</option>
          {materialsList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.requiresMou ? "(Wajib MoU)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Dimensi 2: Kuartal & Tema Kampanye */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Kuartal Alokasi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Kuartal Alokasi *
          </label>
          <div className="grid grid-cols-4 gap-1">
            {QUARTERS.map((q) => {
              const isSelected = (placement.quarter || "Q3 2026") === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() =>
                    setPlacement((prev) => (prev ? { ...prev, quarter: q } : prev))
                  }
                  className={cn(
                    "py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center",
                    isSelected
                      ? "bg-lime-600 text-white border-lime-700 shadow-2xs ring-1 ring-lime-500/40"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  )}
                >
                  {q}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tema Kampanye */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Tema Kampanye</span>
          </label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {CAMPAIGN_THEMES.map((theme) => {
              const isSelected = placement.campaignTheme === theme;
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() =>
                    setPlacement((prev) =>
                      prev
                        ? { ...prev, campaignTheme: isSelected ? "" : theme }
                        : prev
                    )
                  }
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-all cursor-pointer",
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  )}
                >
                  {theme}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Atau ketik tema khusus..."
            value={placement.campaignTheme || ""}
            onChange={(e) =>
              setPlacement((prev) =>
                prev ? { ...prev, campaignTheme: e.target.value } : prev
              )
            }
            className="w-full px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Dimensi Biaya: Bebas Biaya vs Pemasangan Berbayar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Skema Biaya & Legalitas *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setPlacement((prev) => (prev ? togglePaidPlacement(prev, false) : prev));
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              !isPaidPlacement(placement.cost)
                ? "bg-lime-500/15 text-lime-900 dark:text-lime-200 border-lime-500/60 shadow-2xs ring-1 ring-lime-500/40"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            )}
          >
            <span>🏷️ Bebas Biaya (Rp 0)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPlacement((prev) => (prev ? togglePaidPlacement(prev, true) : prev));
              setIsMouManuallyExpanded(true);
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              isPaidPlacement(placement.cost)
                ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/60 shadow-2xs ring-1 ring-amber-500/40"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            )}
          >
            <span>💰 Pemasangan Berbayar</span>
          </button>
        </div>

        {/* Input Biaya if Paid */}
        {isPaidPlacement(placement.cost) && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 space-y-1.5 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Nominal Sewa / Kompensasi Outlet (Rp) *
              </label>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                Wajib MoU
              </span>
            </div>
            <input
              type="number"
              placeholder="e.g. 500000"
              value={placement.cost != null && placement.cost > 0 ? String(placement.cost) : ""}
              onChange={(e) =>
                setPlacement((prev) =>
                  prev
                    ? {
                        ...prev,
                        cost: e.target.value ? Number(e.target.value) : undefined,
                      }
                    : prev
                )
              }
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-600 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* Progressive Disclosure: MOU Linking Section */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        {!showMou ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Materi Bebas MoU (Rp 0 sewa)
            </span>
            <button
              type="button"
              onClick={() => setIsMouManuallyExpanded(true)}
              className="text-[11px] font-bold text-lime-600 dark:text-lime-400 hover:underline cursor-pointer"
            >
              + Tautkan Dokumen MoU
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tautkan Dokumen MoU (Perjanjian Branding / Sewa)
              </label>
              {!placement.cost && !isPermanent && (
                <button
                  type="button"
                  onClick={() => setIsMouManuallyExpanded(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Tutup MoU
                </button>
              )}
            </div>

            <select
              value={placement.mouId || ""}
              onChange={(e) =>
                setPlacement((prev) =>
                  prev ? { ...prev, mouId: e.target.value || null } : prev
                )
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
            >
              <option value="">Tanpa MoU (Materi Bebas Kontrak)</option>
              {outletMous.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.status}] {m.partnerName || m.outletName || m.id} ({m.mouType} - Rp{" "}
                  {m.compensationValue?.toLocaleString("id-ID") || "0"})
                </option>
              ))}
            </select>

            {/* Selected MOU Document Preview */}
            {selectedMou && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                  <FileText className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />
                  <span className="font-semibold truncate">
                    {selectedMou.partnerName || "Perjanjian Kerjasama"} ({selectedMou.mouType})
                  </span>
                </div>
                {selectedMou.docPath && (
                  <button
                    type="button"
                    onClick={() => onViewDocMou(selectedMou)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-fuchsia-600 hover:underline shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Lihat Berkas</span>
                  </button>
                )}
              </div>
            )}

            {/* Validation Banner */}
            {mouValidation.severity !== "none" && (
              <div
                className={cn(
                  "p-2 rounded-lg border text-xs flex items-start gap-2",
                  mouValidation.severity === "warning"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                )}
              >
                {mouValidation.severity === "warning" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{mouValidation.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Auxiliary Details (Dimensions, Cost, PIC, Date) */}
      <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAuxFieldsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Detail Tambahan (Dimensi, PIC, Tanggal)
          </span>
          {isAuxFieldsExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isAuxFieldsExpanded && (
          <div className="p-3 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in-50 duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dimensi Fisik Material
              </label>
              <input
                type="text"
                placeholder="e.g. 2x1 meter, Lebar 80cm"
                value={placement.dimensions || ""}
                onChange={(e) =>
                  setPlacement((prev) =>
                    prev ? { ...prev, dimensions: e.target.value } : prev
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama PIC Sales
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budi"
                  value={placement.picName || ""}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev ? { ...prev, picName: e.target.value } : prev
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tanggal Pemasangan
                </label>
                <input
                  type="date"
                  value={placement.date ? placement.date.slice(0, 10) : ""}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev ? { ...prev, date: e.target.value } : prev
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
