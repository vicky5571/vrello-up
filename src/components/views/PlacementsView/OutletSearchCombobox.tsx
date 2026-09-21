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
import {
  formatCoordinates,
  extractRecentPlacementMaterials,
  getBrandBadgeMeta,
  type OutletSearchResult,
  type OutletSelectionPayload,
  type OutletPlacementMaterial,
  type OutletPlacementSummary,
} from "./outletSearchComboboxHelpers";

export {
  formatCoordinates,
  extractRecentPlacementMaterials,
  getBrandBadgeMeta,
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
  placeholder = "Cari nama outlet atau kode (cth: O-SMG-001)...",
  disabled = false,
  className,
  autoFocus = false,
  required = false,
  id = "outlet-search-combobox",
}: OutletSearchComboboxProps) {
  const { branches, fetchBranches } = useMarcomDataStore();
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
  const [isOpen, setIsOpen] = useState(false);
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

  // Debounced search with 300ms timer
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: "15",
        });
        if (workspaceId) {
          params.set("workspaceId", workspaceId);
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
          if (
            typeof document !== "undefined" &&
            document.activeElement === inputRef.current
          ) {
            setIsOpen(true);
          }
          setHighlightedIndex(-1);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setFetchError("Gagal mencari outlet. Periksa koneksi.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, workspaceId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    onSelectOutlet(outlet);
  };

  const handleClear = () => {
    setInternalSelected(null);
    setIsChanging(false);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    onSelectOutlet(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleChangeClick = () => {
    setIsChanging(true);
    setIsOpen(false);
    setSearchQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        if (results.length > 0) setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        if (results.length > 0) setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter") {
      if (isOpen) {
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        } else if (results.length > 0) {
          handleSelect(results[0]);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      if (isChanging && currentOutlet) {
        setIsChanging(false);
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

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Selected State Card */}
      {showCard && currentOutlet && (
        <div className="rounded-xl border border-lime-500/40 bg-lime-50/20 dark:bg-lime-950/10 dark:border-lime-500/30 p-3 shadow-xs">
          {/* Top Row: Name, Code, Brand, Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-lime-500/10 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400 flex items-center justify-center shrink-0 mt-0.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {currentOutlet.name}
                  </span>
                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    [{currentOutlet.code}]
                  </span>
                  {renderBrandBadge(currentOutlet.brand)}
                  {currentOutlet.tier && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                      {currentOutlet.tier}
                    </span>
                  )}
                </div>
                {/* Address & City */}
                {(currentOutlet.address || currentOutlet.city) && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {[currentOutlet.address, currentOutlet.city]
                        .filter(Boolean)
                        .join(", ")}
                      {currentOutlet.branch?.name
                        ? ` (${currentOutlet.branch.name})`
                        : ""}
                    </span>
                  </div>
                )}
                {/* PIC Info */}
                {currentOutlet.picName && (
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    PIC:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {currentOutlet.picName}
                    </strong>
                    {currentOutlet.picPhone && ` • ${currentOutlet.picPhone}`}
                  </div>
                )}
              </div>
            </div>

            {/* Clear / Change Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleChangeClick}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Ganti outlet"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Ganti</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Section: GPS status and History tags */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
            {/* Coordinates Status */}
            <div className="flex items-center gap-2">
              {coords.isSet ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>📍 {coords.text}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>⚠️ {coords.text}</span>
                </span>
              )}
            </div>

            {/* Recent Placement History */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Riwayat:
              </span>
              {recentTags.length > 0 ? (
                recentTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Belum ada riwayat pemasangan
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Input View */}
      {(!showCard || isChanging) && (
        <div className="space-y-1.5">
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
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls={`${id}-listbox`}
              aria-activedescendant={
                highlightedIndex >= 0 && results[highlightedIndex]
                  ? `${id}-opt-${results[highlightedIndex].id}`
                  : undefined
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              required={required && !currentOutlet}
              autoFocus={autoFocus || isChanging}
              autoComplete="off"
              className={cn(
                "w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all",
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
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
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

          {/* Autocomplete Dropdown Listbox */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col">
              {/* Header result count */}
              <div className="px-3 py-1.5 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                <span>
                  {results.length > 0
                    ? `Ditemukan ${results.length} outlet`
                    : "Pencarian Outlet"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Gunakan ↑↓ lalu Enter
                </span>
              </div>

              {/* Empty state */}
              {results.length === 0 && !isLoading && (
                <div className="p-4 text-center space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tidak ada outlet yang cocok dengan &quot;{searchQuery}&quot;
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Toko belum terdaftar? Ajukan Toko Baru</span>
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
                    className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1"
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
                            "flex flex-col gap-1 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors",
                            isHighlighted
                              ? "bg-lime-50 dark:bg-lime-950/40 text-slate-900 dark:text-slate-100"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                          )}
                        >
                          {/* First line: Code, Name, Brand, Tier */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              [{outlet.code}]
                            </span>
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {outlet.name}
                            </span>
                            {renderBrandBadge(outlet.brand)}
                            {outlet.tier && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                • {outlet.tier}
                              </span>
                            )}
                          </div>

                          {/* Second line: Address / City / GPS */}
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 truncate min-w-0">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">
                                {[outlet.address, outlet.city]
                                  .filter(Boolean)
                                  .join(", ") || "Alamat belum ada"}
                              </span>
                            </div>

                            {hasCoordinates ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 font-medium">
                                📍 GPS Ada
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                                ⚠️ GPS Kosong
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
                                    className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px]"
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

                  {/* Dropdown footer action to submit new store */}
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <button
                      type="button"
                      onClick={() => {
                        if (onRequestNewOutlet) {
                          onRequestNewOutlet(searchQuery);
                        } else {
                          setIsDraftModalOpen(true);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-center text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Toko tidak ditemukan? Ajukan Toko Baru</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
