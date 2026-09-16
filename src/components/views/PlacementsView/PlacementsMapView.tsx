"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  MapPin,
  Store,
  ExternalLink,
  Edit2,
  CheckSquare,
  AlertCircle,
  Compass,
  Maximize2,
  X,
  ChevronRight,
  Filter,
  Eye,
} from "lucide-react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MarcomPlacement, PlacementStatus } from "./PlacementsView";
import {
  isValidCoordinate,
  buildGoogleMapsUrl,
} from "@/lib/marcom/locationUtils";
import { cn, formatIDR } from "@/lib/utils";

interface PlacementsMapViewProps {
  placements: MarcomPlacement[];
  onEditPlacement: (placement: MarcomPlacement) => void;
  onTrackAsTask: (placement: MarcomPlacement) => void;
  canManage: boolean;
}

const STATUS_CONFIG: Record<
  PlacementStatus,
  { label: string; color: string; bg: string; text: string; ring: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "#64748B",
    bg: "bg-slate-500/10",
    text: "text-slate-500 dark:text-slate-400",
    ring: "#94A3B8",
  },
  ON_PROGRESS: {
    label: "On Progress",
    color: "#D97706",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "#F59E0B",
  },
  DONE: {
    label: "Done",
    color: "#10B981",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "#34D399",
  },
  ISSUE: {
    label: "Issue",
    color: "#E11D48",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "#FB7185",
  },
};

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta
const DEFAULT_ZOOM = 11;

function createStatusPinIcon(leaflet: typeof L, status: PlacementStatus) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;
  const pinColor = config.color;

  return leaflet.divIcon({
    className: "custom-status-pin",
    html: `
      <div style="transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); cursor: pointer;">
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 28.5 15.1 42.6 16.2 43.7C16.6 44.1 17.4 44.1 17.8 43.7C18.9 42.6 34 28.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${pinColor}" />
          <circle cx="17" cy="17" r="10" fill="white" />
          <circle cx="17" cy="17" r="5" fill="${pinColor}" />
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [0, 0],
    popupAnchor: [0, -36],
  });
}

export function PlacementsMapView({
  placements,
  onEditPlacement,
  onTrackAsTask,
  canManage,
}: PlacementsMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedPlacement, setSelectedPlacement] = useState<MarcomPlacement | null>(null);
  const [isUnmappedDrawerOpen, setIsUnmappedDrawerOpen] = useState(false);

  // Split into mapped and unmapped
  const mappedPlacements = useMemo(
    () =>
      placements.filter((p) =>
        isValidCoordinate(p.latitude ?? Number.NaN, p.longitude ?? Number.NaN),
      ),
    [placements],
  );

  const unmappedPlacements = useMemo(
    () =>
      placements.filter(
        (p) => !isValidCoordinate(p.latitude ?? Number.NaN, p.longitude ?? Number.NaN),
      ),
    [placements],
  );

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (isCancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false, // We provide custom clean controls
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Attribution
      L.control
        .attribution({ position: "bottomright", prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Invalidate size after layout mounts
      setTimeout(() => {
        if (!isCancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when mapped placements change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !L || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    mappedPlacements.forEach((placement) => {
      const lat = placement.latitude as number;
      const lng = placement.longitude as number;
      bounds.extend([lat, lng]);

      const icon = createStatusPinIcon(L, placement.status);
      const marker = L.marker([lat, lng], { icon });

      // Click event selects placement to view rich card
      marker.on("click", () => {
        setSelectedPlacement(placement);
      });

      // Simple tooltip on hover
      marker.bindTooltip(
        `<strong>${placement.outlet?.name || "Outlet"}</strong><br/>${placement.material?.name || "Material"} (${placement.status.replace("_", " ")})`,
        { direction: "top", offset: [0, -32] },
      );

      markersGroup.addLayer(marker);
    });

    if (mappedPlacements.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [mappedPlacements]);

  // Handle Fit All Pins
  const handleFitAll = useCallback(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || mappedPlacements.length === 0) return;

    const bounds = L.latLngBounds(
      mappedPlacements.map((p) => [p.latitude as number, p.longitude as number]),
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [mappedPlacements]);

  // Center on single placement
  const handleCenterOn = useCallback((placement: MarcomPlacement) => {
    const map = mapInstanceRef.current;
    if (
      !map ||
      !isValidCoordinate(placement.latitude ?? Number.NaN, placement.longitude ?? Number.NaN)
    )
      return;

    map.setView([placement.latitude as number, placement.longitude as number], 16, {
      animate: true,
    });
    setSelectedPlacement(placement);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xs">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Stats & Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{mappedPlacements.length} Terpetakan</span>
          </div>
          {unmappedPlacements.length > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setIsUnmappedDrawerOpen(true)}
                className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{unmappedPlacements.length} Belum Ada Titik</span>
              </button>
            </>
          )}
        </div>

        {/* Legend pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md text-[11px] font-semibold">
          {Object.entries(STATUS_CONFIG).map(([st, cfg]) => (
            <div key={st} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-slate-600 dark:text-slate-300">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Right Map Zoom & Reset Actions */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom In"
          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold text-base"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold text-base"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleFitAll}
          title="Lihat Semua Pin"
          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Selected Marker Detail Card (Bottom or Floating) */}
      {selectedPlacement && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 pointer-events-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-orange-500 shrink-0" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {selectedPlacement.outlet?.name || "Outlet"}
                </h3>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kode: {selectedPlacement.outlet?.code || selectedPlacement.outletId}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                  STATUS_CONFIG[selectedPlacement.status]?.bg,
                  STATUS_CONFIG[selectedPlacement.status]?.text,
                )}
              >
                {selectedPlacement.status.replace("_", " ")}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlacement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Material
              </span>
              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {selectedPlacement.material?.name || selectedPlacement.materialId}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Dimensi
              </span>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {selectedPlacement.dimensions || "—"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                PIC
              </span>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {selectedPlacement.picName || "—"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Biaya
              </span>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {typeof selectedPlacement.cost === "number"
                  ? formatIDR(selectedPlacement.cost)
                  : "—"}
              </div>
            </div>
          </div>

          {selectedPlacement.locationNotes && (
            <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Patokan Lokasi
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                {selectedPlacement.locationNotes}
              </p>
            </div>
          )}

          {selectedPlacement.photoUrl && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-28 bg-slate-100 dark:bg-slate-800">
              <img
                src={selectedPlacement.photoUrl}
                alt="Installation proof"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            {isValidCoordinate(
              selectedPlacement.latitude ?? Number.NaN,
              selectedPlacement.longitude ?? Number.NaN,
            ) && (
              <a
                href={buildGoogleMapsUrl(
                  selectedPlacement.latitude as number,
                  selectedPlacement.longitude as number,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer text-center"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Rute Maps</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => onEditPlacement(selectedPlacement)}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-lime-600" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onTrackAsTask(selectedPlacement)}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Track Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Unmapped Placements Drawer */}
      {isUnmappedDrawerOpen && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 z-30 pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Belum Ada Titik Lokasi ({unmappedPlacements.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsUnmappedDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {unmappedPlacements.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                Semua placement sudah terpetakan! 🎉
              </div>
            ) : (
              unmappedPlacements.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {p.outlet?.name || "Outlet"}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase",
                        STATUS_CONFIG[p.status]?.bg,
                        STATUS_CONFIG[p.status]?.text,
                      )}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Material: {p.material?.name || p.materialId}
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUnmappedDrawerOpen(false);
                        onEditPlacement(p);
                      }}
                      className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Set Titik Lokasi</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
