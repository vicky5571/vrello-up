"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Loader2,
  MapPin,
  AlertTriangle,
  X,
  RefreshCw,
  Store,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubmitDraftOutletModal } from "@/components/views/OutletsView/SubmitDraftOutletModal";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { rankOutletsByRelevance } from "@/app/api/marcom/outlets/outletsSearchFilter";
import type { Brand } from "@/types";
import {
  formatCoordinates,
  extractRecentPlacementMaterials,
  getBrandBadgeMeta,
  formatOutletCodeDisplay,
  isDraftOutletRecord,
  type OutletSearchResult,
  type OutletSelectionPayload,
  type OutletPlacementMaterial,
  type OutletPlacementSummary,
} from "./outletSearchComboboxHelpers";


export {
  formatCoordinates,
  extractRecentPlacementMaterials,
  getBrandBadgeMeta,
  formatOutletCodeDisplay,
  isDraftOutletRecord,
  type OutletSearchResult,
  type OutletSelectionPayload,
  type OutletPlacementMaterial,
  type OutletPlacementSummary,
};


export interface OutletSearchComboboxProps {
  selectedOutletId?: string;
  selectedOutlet?: OutletSearchResult | null;
  onSelectOutlet: (outlet: OutletSelectionPayload) => void;
  onRequestNewOutlet?: (searchQuery: string) => void;
  workspaceId?: string;
  brand?: Brand | string;
  onSetBrand?: (brand: Brand) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  id?: string;
}

export function renderBrandBadge(brand?: string | null) {
  const meta = getBrandBadgeMeta(brand);
  if (!meta) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold border shrink-0",
        meta.isIM3
          ? "bg-yellow-400/20 text-yellow-900 dark:text-yellow-200 border-yellow-400/50"
          : meta.is3
          ? "bg-pink-500/20 text-pink-900 dark:text-pink-200 border-pink-500/50"
          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          meta.isIM3 ? "bg-yellow-500" : meta.is3 ? "bg-pink-500" : "bg-slate-400"
        )}
      />
      {meta.normalizedBrand}
    </span>
  );
}

export function OutletSearchCombobox({
  selectedOutletId,
  selectedOutlet,
  onSelectOutlet,
  onRequestNewOutlet,
  workspaceId = "ws-main",
  brand,
  onSetBrand,
  placeholder = "Cari nama outlet atau kode (cth: O-SMG-001)...",
  disabled = false,
  className,
  autoFocus = false,
  required = false,
  id = "outlet-search-combobox",
}: OutletSearchComboboxProps) {
  const branches = useMarcomDataStore((s) => s.branches);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);
  const cachedOutlets = useMarcomDataStore((s) => s.outlets);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);


  useEffect(() => {
    if (branches.length === 0) {
      fetchBranches().catch(() => {});
    }
  }, [branches.length, fetchBranches]);

  const [internalSelected, setInternalSelected] =
    useState<OutletSearchResult | null>(selectedOutlet ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<OutletSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isChanging, setIsChanging] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const currentOutlet =
    selectedOutlet !== undefined ? selectedOutlet : internalSelected;

  // Sync with selectedOutletId if selectedOutlet is not explicitly supplied
  useEffect(() => {
    if (selectedOutlet !== undefined) {
      setInternalSelected(selectedOutlet);
      return;
    }

    if (!selectedOutletId) {
      setInternalSelected(null);
      return;
    }

    if (internalSelected?.id === selectedOutletId) {
      return;
    }

    let isMounted = true;
    const fetchSelectedOutlet = async () => {
      try {
        const url = `/api/marcom/outlets/${encodeURIComponent(selectedOutletId)}${
          workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""
        }`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data && data.id) {
          setInternalSelected(data);
        }
      } catch {
        // Gracefully ignore fetch errors for initial outlet hydration
      }
    };

    fetchSelectedOutlet();
    return () => {
      isMounted = false;
    };
  }, [selectedOutletId, selectedOutlet, workspaceId, internalSelected?.id]);

  // Debounced search on typing; strictly no-op when searchQuery is empty to save resources
  useEffect(() => {
    // If an outlet is already selected and we're not actively in changing mode, skip searching
    if (currentOutlet && !isChanging) {
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setFetchError(null);
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    const controller = new AbortController();

    const fetchOutlets = async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: "15",
        });
        if (workspaceId) {
          params.set("workspaceId", workspaceId);
        }
        if (brand && brand !== "ALL") {
          params.set("brand", brand);
        }

        const res = await fetch(`/api/marcom/outlets?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!controller.signal.aborted) {
          setResults(Array.isArray(json.data) ? json.data : []);
          setHighlightedIndex(-1);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (cachedOutlets && cachedOutlets.length > 0) {
          const lowerTokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
          const matched = cachedOutlets.filter((o) => {
            if (brand && brand !== "ALL") {
              const oBrand = (o.brand || "").toUpperCase();
              const targetBrand = brand.toUpperCase() === "3" ? "TRI" : brand.toUpperCase();
              if (oBrand !== targetBrand) return false;
            }
            if (lowerTokens.length === 0) return true;
            const code = (o.code || "").toLowerCase();
            const name = (o.name || "").toLowerCase();
            const city = (o.city || "").toLowerCase();
            const pic = (o.picName || "").toLowerCase();
            return lowerTokens.every(
              (tok) =>
                code.includes(tok) ||
                name.includes(tok) ||
                city.includes(tok) ||
                pic.includes(tok)
            );
          });
          const ranked = rankOutletsByRelevance(matched, trimmed).slice(0, 15);
          setResults(ranked as unknown as OutletSearchResult[]);
          setHighlightedIndex(-1);
          setFetchError(null);
        } else {
          setFetchError("Gagal mencari outlet. Periksa koneksi.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchOutlets, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, workspaceId, brand, cachedOutlets, currentOutlet, isChanging]);

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as
        | HTMLElement
        | undefined;
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (outlet: OutletSearchResult) => {
    setInternalSelected(outlet);
    setIsChanging(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    onSelectOutlet(outlet);
  };

  const handleClear = () => {
    setInternalSelected(null);
    setIsChanging(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    onSelectOutlet(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleChangeClick = () => {
    setIsChanging(true);
    setSearchQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelect(results[highlightedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (isChanging && currentOutlet) {
        setIsChanging(false);
      } else {
        setSearchQuery("");
      }
    }
  };

  const showCard = Boolean(currentOutlet) && !isChanging;
  const coords = formatCoordinates(
    currentOutlet?.latitude,
    currentOutlet?.longitude
  );
  const recentTags = extractRecentPlacementMaterials(
    currentOutlet?.placements
  );
  const formattedCode = formatOutletCodeDisplay(currentOutlet?.code);
  const isDraft = isDraftOutletRecord(currentOutlet);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Selected State Card (Option 2 Design) */}
      {showCard && currentOutlet && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-4 sm:p-5 shadow-xs transition-all space-y-3">
          {/* Top Row: Store Icon, Name, Code, and Action Buttons */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400 flex items-center justify-center shrink-0 mt-0.5 border border-lime-500/20 shadow-2xs">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {currentOutlet.name}
                  </span>
                  {formattedCode && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0">
                      {formattedCode}
                    </span>
                  )}
                  {isDraft && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      ⏳ Menunggu ACC Atasan
                    </span>
                  )}
                </div>

                {/* Structured Metadata: Address, PIC */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 text-[11px] font-medium shrink-0 mt-0.5">Alamat:</span>
                    <span className="text-slate-700 dark:text-slate-200">
                      {[currentOutlet.address, currentOutlet.city]
                        .filter(Boolean)
                        .join(", ") || "Alamat belum tercatat"}
                      {currentOutlet.branch?.name ? ` (${currentOutlet.branch.name})` : ""}
                    </span>
                  </div>

                  {currentOutlet.picName && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px] font-medium">PIC:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {currentOutlet.picName}
                        {currentOutlet.picPhone ? ` • ${currentOutlet.picPhone}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Ganti Outlet and Remove */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleChangeClick}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                title="Ganti outlet lain"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Ganti Outlet</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Draft Notice if applicable */}
          {isDraft && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
              Outlet ini berstatus draf pengajuan baru. Anda dapat melanjutkan pencatatan pemasangan material ini; data akan otomatis terhubung ke kode resmi setelah di-ACC oleh Atasan / Admin.
            </div>
          )}

          {/* Horizontal Divider */}
          <div className="border-t border-slate-100 dark:border-slate-700/80 my-2" />

          {/* Bottom Bar: Verified GPS Badge (Left) & Brand Provider with Override (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {/* Left: Verified GPS Pill */}
            <div>
              {coords.isSet ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Verified GPS: {coords.text}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Titik GPS Belum Diatur</span>
                </span>
              )}
            </div>

            {/* Right: Brand Provider Confirmation & Override */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Brand:
              </span>
              {onSetBrand ? (
                <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => onSetBrand("IM3")}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      (brand === "IM3" || !brand)
                        ? "bg-yellow-400 text-yellow-950 shadow-xs"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-900" />
                    <span>IM3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetBrand("TRI")}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      brand === "TRI" || brand === "3"
                        ? "bg-pink-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>3 / Tri</span>
                  </button>
                </div>
              ) : (
                renderBrandBadge(currentOutlet.brand)
              )}
            </div>
          </div>

          {/* Riwayat Pemasangan Tags (if any) */}
          {recentTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-400">
                Riwayat:
              </span>
              {recentTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Input View */}
      {(!showCard || isChanging) && (
        <div className="space-y-2.5">
          {isChanging && currentOutlet && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>
                Mengganti outlet saat ini: <strong>{currentOutlet.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleCancelChange}
                className="text-xs font-semibold text-lime-600 dark:text-lime-400 hover:underline cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}

          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              id={id}
              type="text"
              role="combobox"
              aria-expanded={true}
              aria-autocomplete="list"
              aria-controls={`${id}-listbox`}
              aria-activedescendant={
                highlightedIndex >= 0 && results[highlightedIndex]
                  ? `${id}-opt-${results[highlightedIndex].id}`
                  : undefined
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              required={required && !currentOutlet}
              autoFocus={autoFocus || isChanging}
              autoComplete="off"
              className={cn(
                "w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all shadow-2xs",
                fetchError && "border-red-400 focus:ring-red-400"
              )}
            />

            {/* Spinner or Clear Input */}
            <div className="absolute right-2.5 flex items-center gap-1">
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-lime-500 animate-spin" />
              )}
              {!isLoading && searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                  title="Hapus teks pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {fetchError && (
            <p className="text-[11px] text-red-500 px-1">{fetchError}</p>
          )}

          {/* Inline Results / Placeholder Panel */}
          <div className="w-full bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            {/* Header when searching */}
            {searchQuery.trim() ? (
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 shrink-0">
                <span className="flex items-center gap-1.5">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 text-lime-500 animate-spin" />
                      <span>Mencari outlet...</span>
                    </>
                  ) : results.length > 0 ? (
                    `Ditemukan ${results.length} outlet`
                  ) : (
                    "Pencarian Outlet"
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Gunakan ↑↓ lalu Enter atau klik outlet
                </span>
              </div>
            ) : null}

            {/* Initial Guide / Placeholder text when no query entered */}
            {!searchQuery.trim() && (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ketik nama toko atau kode outlet untuk mencari
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  Ketik minimal 1 karakter (misal: nama toko, kode O-SMG-001, atau nama jalan/kota) untuk mulai mencari.
                </p>
              </div>
            )}

            {/* Empty state when searching but no matches */}
            {searchQuery.trim() && results.length === 0 && !isLoading && (
              <div className="p-5 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tidak ada outlet yang cocok dengan &quot;{searchQuery.trim()}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onRequestNewOutlet) {
                      onRequestNewOutlet(searchQuery);
                    } else {
                      setIsDraftModalOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Outlet belum terdaftar? Ajukan Outlet Baru</span>
                </button>
              </div>
            )}

            {/* Items List */}
            {results.length > 0 && (
              <>
                <ul
                  ref={listRef}
                  id={`${id}-listbox`}
                  role="listbox"
                  className="overflow-y-auto max-h-60 sm:max-h-72 divide-y divide-slate-100 dark:divide-slate-700/50 p-1.5"
                >
                  {results.map((outlet, index) => {
                    const isHighlighted = highlightedIndex === index;
                    const outletRecentMaterials =
                      extractRecentPlacementMaterials(outlet.placements);
                    const hasCoordinates =
                      typeof outlet.latitude === "number" &&
                      typeof outlet.longitude === "number";

                    return (
                      <li
                        key={outlet.id}
                        id={`${id}-opt-${outlet.id}`}
                        role="option"
                        aria-selected={isHighlighted}
                        onClick={() => handleSelect(outlet)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          "flex flex-col gap-1.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border",
                          isHighlighted
                            ? "bg-lime-500/10 dark:bg-lime-500/15 border-lime-500/30 shadow-2xs text-slate-900 dark:text-slate-100"
                            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200"
                        )}
                      >
                        {/* First line: Code, Name, Brand */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {outlet.code && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                              {outlet.code}
                            </span>
                          )}
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {outlet.name}
                          </span>
                          {renderBrandBadge(outlet.brand)}
                        </div>

                        {/* Second line: Address / City / GPS */}
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 truncate min-w-0">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {[outlet.address, outlet.city]
                                .filter(Boolean)
                                .join(", ") || "Alamat belum ada"}
                              {outlet.branch?.name ? ` (${outlet.branch.name})` : ""}
                            </span>
                          </div>

                          {hasCoordinates ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>GPS Ada</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                              Titik GPS Kosong
                            </span>
                          )}
                        </div>

                        {/* Third line: Recent Placement History preview */}
                        {outletRecentMaterials.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                            <span>Riwayat:</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {outletRecentMaterials.slice(0, 3).map((mat) => (
                                <span
                                  key={mat}
                                  className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px]"
                                >
                                  {mat}
                                </span>
                              ))}
                              {outletRecentMaterials.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{outletRecentMaterials.length - 3} lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Footer action to submit new store */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50">
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestNewOutlet) {
                        onRequestNewOutlet(searchQuery);
                      } else {
                        setIsDraftModalOpen(true);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Outlet tidak ditemukan? Ajukan Outlet Baru</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <SubmitDraftOutletModal
            isOpen={isDraftModalOpen}
            onClose={() => setIsDraftModalOpen(false)}
            initialName={searchQuery}
            branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
            workspaceId={workspaceId}
            onSuccess={(created) => {
              handleSelect({
                id: created.id,
                code: created.code,
                name: created.name,
                brand: created.brand,
                latitude: created.latitude,
                longitude: created.longitude,
                address: created.address,
                city: created.city,
                picName: created.picName,
              });
              setIsDraftModalOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
