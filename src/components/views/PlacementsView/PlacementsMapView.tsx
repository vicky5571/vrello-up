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
  Crosshair,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MarcomPlacement, PlacementStatus } from "./PlacementsView";
import {
  isValidCoordinate,
  buildGoogleMapsUrl,
} from "@/lib/marcom/locationUtils";
import { getBrandMeta, BRAND_CONFIG } from "@/lib/marcom/brandUtils";
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
    label: "To Do",
    color: "#64748B",
    bg: "bg-slate-500/10",
    text: "text-slate-500 dark:text-slate-400",
    ring: "#94A3B8",
  },
  ON_PROGRESS: {
    label: "In Progress",
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

const DISPLAY_STATUS_KEYS: PlacementStatus[] = ["NOT_STARTED", "ON_PROGRESS", "DONE"];

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

function createBrandPinIcon(
  leaflet: typeof L,
  brand?: string,
  status: PlacementStatus = "NOT_STARTED",
) {
  const brandMeta = getBrandMeta(brand);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;
  const pinColor = brandMeta.color; // Yellow (#EAB308) for IM3, Pink (#EC4899) for 3
  const brandCode = brandMeta.shortLabel;
  const textColor = brandMeta.contrastColor;
  const statusPipColor = statusCfg.color;

  return leaflet.divIcon({
    className: "!bg-transparent !border-0",
    html: `
      <div style="width: 36px; height: 46px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); cursor: pointer; transition: transform 0.15s ease;">
        <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin Body: Yellow for IM3, Pink for 3 -->
          <path d="M18 0C8.05888 0 0 8.05888 0 18C0 30.2 16.1 45.1 17.2 46.1C17.6 46.5 18.4 46.5 18.8 46.1C19.9 45.1 36 30.2 36 18C36 8.05888 27.9411 0 18 0Z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.5" />
          <!-- Inner White Badge Circle -->
          <circle cx="18" cy="18" r="11" fill="white" />
          <!-- Brand text: IM3 or 3 -->
          <text x="18" y="${brandCode === '3' ? 22.5 : 21.5}" font-family="system-ui, -apple-system, sans-serif" font-size="${brandCode === '3' ? '13' : '9.5'}" font-weight="900" text-anchor="middle" fill="${textColor}">${brandCode}</text>
          <!-- Status Pip Indicator -->
          <circle cx="27" cy="9" r="4.5" fill="${statusPipColor}" stroke="white" stroke-width="1.5" />
        </svg>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  });
}

function createUserLocationIcon(leaflet: typeof L) {
  return leaflet.divIcon({
    className: "!bg-transparent !border-0",
    html: `
      <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.4); pointer-events: none;" class="animate-ping"></span>
        <span style="position: relative; width: 14px; height: 14px; background-color: #2563eb; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.35);"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasCenteredOnUserRef = useRef(false);

  const [selectedPlacement, setSelectedPlacement] = useState<MarcomPlacement | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<"mapped" | "unmapped" | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(userCoords ? 15 : DEFAULT_ZOOM);

  const handleSliderZoom = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const targetZoom = Number(e.target.value);
    setCurrentZoom(targetZoom);
    mapInstanceRef.current?.setZoom(targetZoom);
  }, []);

  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

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

  const renderUserMarker = useCallback((lat: number, lng: number, L: typeof import("leaflet")) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: createUserLocationIcon(L),
        zIndexOffset: 200,
      });
      marker.bindTooltip("<strong>Lokasi Anda Saat Ini</strong>", {
        direction: "top",
        offset: [0, -14],
      });
      marker.addTo(map);
      userMarkerRef.current = marker;
    }
  }, []);

  const renderMarkers = useCallback(
    (currentMappedPlacements: MarcomPlacement[]) => {
      const map = mapInstanceRef.current;
      const L = leafletRef.current;
      const markersGroup = markersLayerRef.current;
      if (!map || !L || !markersGroup) return null;

      markersGroup.clearLayers();
      const bounds = L.latLngBounds([]);

      currentMappedPlacements.forEach((placement) => {
        const lat = placement.latitude;
        const lng = placement.longitude;
        if (!isValidCoordinate(lat ?? Number.NaN, lng ?? Number.NaN)) return;
        bounds.extend([lat as number, lng as number]);

        const icon = createBrandPinIcon(L, placement.brand, placement.status);
        const marker = L.marker([lat as number, lng as number], {
          icon,
          zIndexOffset: 600,
        });

        // Click event selects placement to view rich card
        marker.on("click", () => {
          setSelectedPlacement(placement);
        });

        const brandMeta = getBrandMeta(placement.brand);

        // Simple tooltip on hover
        marker.bindTooltip(
          `<strong>[${brandMeta.shortLabel}] ${placement.outlet?.name || "Outlet"}</strong><br/>${placement.material?.name || "Material"} (${STATUS_CONFIG[placement.status]?.label || placement.status})`,
          { direction: "top", offset: [0, -42] },
        );

        markersGroup.addLayer(marker);
      });

      return bounds;
    },
    [],
  );

  const handleCenterOnUser = useCallback(
    (showFeedback = true) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        if (showFeedback) toast.error("Geolocation tidak didukung pada browser ini");
        return;
      }

      setIsLocating(true);
      const onGeoSuccess = (pos: GeolocationPosition) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords([lat, lng]);
        hasCenteredOnUserRef.current = true;

        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (map && L) {
          map.flyTo([lat, lng], 15, { duration: 1.2 });
          renderUserMarker(lat, lng, L);
          renderMarkers(mappedPlacements);
        }
        if (showFeedback) {
          toast.success("Berhasil menemukan lokasi Anda");
        }
      };

      const onGeoFallback = () => {
        navigator.geolocation.getCurrentPosition(
          onGeoSuccess,
          (err) => {
            setIsLocating(false);
            console.warn("Geolocation warning:", err.message);
            if (showFeedback) {
              toast.error("Gagal mendeteksi lokasi GPS: " + err.message);
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
        );
      };

      navigator.geolocation.getCurrentPosition(
        onGeoSuccess,
        onGeoFallback,
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 },
      );
    },
    [renderUserMarker, renderMarkers, mappedPlacements],
  );

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;
    let pinchCleanup: (() => void) | null = null;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (isCancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: userCoords ?? DEFAULT_CENTER,
        zoom: userCoords ? 15 : DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomControl: false, // We provide custom clean controls
        attributionControl: false,
        touchZoom: true, // Allow 2-finger pinch on touchscreen devices
        scrollWheelZoom: false, // Explicitly disable scroll up/down zoom
      });

      // Ensure native scroll wheel zoom is completely disabled in Leaflet
      map.scrollWheelZoom.disable();

      // Only permit pinch gestures (on trackpad, pinch dispatches WheelEvent with ctrlKey: true).
      // Standard scroll up/down (ctrlKey: false) is completely ignored.
      const container = mapContainerRef.current;
      const scrollHandler = map.scrollWheelZoom as unknown as {
        _delta?: number;
        _onWheelScroll?: (e: WheelEvent) => void;
      };
      scrollHandler._delta = 0;

      const handlePinchOnlyWheel = (e: WheelEvent) => {
        if (!e.ctrlKey) return;
        if (typeof scrollHandler._onWheelScroll === "function") {
          scrollHandler._onWheelScroll.call(scrollHandler, e);
        }
      };

      if (container) {
        container.addEventListener("wheel", handlePinchOnlyWheel, { passive: false });
        pinchCleanup = () => {
          container.removeEventListener("wheel", handlePinchOnlyWheel);
        };
      }

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
      setIsMapReady(true);

      // Keep currentZoom state in sync with Leaflet zoom events
      map.on("zoom zoomend", () => {
        if (!isCancelled) {
          setCurrentZoom(Math.round(map.getZoom()));
        }
      });

      // Render initial markers immediately so they are never missed
      renderMarkers(mappedPlacements);

      // Invalidate size after layout mounts
      setTimeout(() => {
        if (!isCancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      // Auto-zoom to user current location immediately for the initial view
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        setIsLocating(true);
        const onInitialGeoSuccess = (pos: GeolocationPosition) => {
          if (isCancelled || !mapInstanceRef.current) return;
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords([lat, lng]);
          hasCenteredOnUserRef.current = true;

          // Smooth animated auto-zoom directly into user's location
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
          renderUserMarker(lat, lng, L);
          renderMarkers(mappedPlacements);
        };

        const onInitialGeoFallback = () => {
          if (isCancelled) return;
          // Fallback to standard accuracy if high accuracy timed out or is slow
          navigator.geolocation.getCurrentPosition(
            onInitialGeoSuccess,
            (fallbackErr) => {
              if (isCancelled) return;
              setIsLocating(false);
              console.warn("Initial user geolocation unavailable:", fallbackErr.message);
              // Fallback: If user location denied/failed and placements exist, fit bounds to placements
              if (!hasCenteredOnUserRef.current && mapInstanceRef.current) {
                const bounds = renderMarkers(mappedPlacements);
                if (bounds && bounds.isValid()) {
                  mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
              }
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
          );
        };

        navigator.geolocation.getCurrentPosition(
          onInitialGeoSuccess,
          onInitialGeoFallback,
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 },
        );
      } else {
        const bounds = renderMarkers(mappedPlacements);
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      setIsMapReady(false);
      hasCenteredOnUserRef.current = false;
      if (pinchCleanup) {
        pinchCleanup();
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when mapped placements change or when map becomes ready
  useEffect(() => {
    if (!isMapReady) return;
    renderMarkers(mappedPlacements);
  }, [mappedPlacements, isMapReady, renderMarkers]);

  // Handle Fit All Pins
  const handleFitAll = useCallback(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || mappedPlacements.length === 0) return;

    const bounds = renderMarkers(mappedPlacements);
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [mappedPlacements, renderMarkers]);

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
          <button
            type="button"
            onClick={() =>
              setActiveDrawer((prev) => (prev === "mapped" ? null : "mapped"))
            }
            title="Klik untuk melihat daftar placement terpetakan"
            className={cn(
              "flex items-center gap-1.5 font-bold transition-colors cursor-pointer rounded-md py-0.5 px-1 -mx-1",
              activeDrawer === "mapped"
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                : "text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400",
            )}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{mappedPlacements.length} Terpetakan</span>
          </button>
          {userCoords && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => handleCenterOnUser(false)}
                title="Klik untuk pusatkan ke lokasi Anda"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                <span>Area Anda</span>
              </button>
            </>
          )}
          {unmappedPlacements.length > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() =>
                  setActiveDrawer((prev) => (prev === "unmapped" ? null : "unmapped"))
                }
                title="Klik untuk melihat daftar placement yang belum memiliki koordinat"
                className={cn(
                  "inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer rounded-md py-0.5 px-1 -mx-1",
                  activeDrawer === "unmapped"
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                    : "text-amber-600 dark:text-amber-400 hover:underline",
                )}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{unmappedPlacements.length} Belum Ada Titik</span>
              </button>
            </>
          )}
        </div>

        {/* Legend pills: Brand & Status */}
        <div className="hidden lg:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md text-[11px] font-semibold">
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-750">
            <span className="text-[10px] uppercase font-bold text-slate-400">Brand:</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-400/15 text-yellow-800 dark:text-yellow-300 border border-yellow-400/30">
              <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
              <span>IM3 (Kuning)</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">
              <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
              <span>3 (Pink)</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
            {DISPLAY_STATUS_KEYS.map((st) => {
              const cfg = STATUS_CONFIG[st];
              return (
                <div key={st} className="flex items-center gap-1 px-1 py-0.5 rounded-md">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Right Map Zoom Slider (+/-) & Utility Actions */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Zoom Control Group: + Button, Vertical Scroll/Slider Bar, - Button */}
        <div className="flex flex-col items-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-md p-1">
          {/* Zoom In (+) */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={currentZoom >= MAX_ZOOM}
            title="Zoom In (+)"
            aria-label="Zoom In"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Vertical Scroll / Slider Bar (Extended Height for Smooth Control) */}
          <div className="relative flex flex-col items-center justify-center h-60 w-9 my-1">
            {/* Subtle Zoom Reference Ticks */}
            <div className="absolute left-1.5 flex flex-col justify-between h-48 py-1 pointer-events-none opacity-40">
              {[18, 15, 11, 8, 5].map((lvl) => (
                <span
                  key={lvl}
                  className={cn(
                    "rounded-full transition-all duration-150",
                    currentZoom === lvl
                      ? "w-2 h-0.5 bg-emerald-500"
                      : "w-1 h-0.5 bg-slate-400 dark:bg-slate-500",
                  )}
                />
              ))}
            </div>

            {/* Background Track with Emerald Fill */}
            <div className="w-1.5 h-52 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex flex-col justify-end pointer-events-none">
              <div
                className="w-full bg-emerald-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(0, Math.min(100, ((currentZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100))}%`,
                }}
              />
            </div>

            {/* Draggable knob / thumb indicator */}
            <div
              className="absolute w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{
                bottom: `calc(16px + ${Math.max(0, Math.min(1, (currentZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM))) * 192}px)`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            {/* Invisible native range input overlay for intuitive drag & click */}
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={1}
              value={currentZoom}
              onChange={handleSliderZoom}
              title={`Level Zoom: ${currentZoom}`}
              aria-label="Slider Zoom Peta"
              className="absolute w-52 h-8 -rotate-90 origin-center opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* Current Zoom Level Badge */}
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 pb-0.5 select-none tracking-tight">
            {currentZoom}x
          </span>

          {/* Zoom Out (-) */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={currentZoom <= MIN_ZOOM}
            title="Zoom Out (-)"
            aria-label="Zoom Out"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Center on User & Fit All */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCenterOnUser(true)}
            title="Pusatkan ke Lokasi Saya Saat Ini"
            className={cn(
              "w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/90 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer",
              isLocating
                ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40"
                : "text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700",
            )}
          >
            <Crosshair className={cn("w-4 h-4", isLocating && "animate-spin text-blue-600")} />
          </button>
          <button
            type="button"
            onClick={handleFitAll}
            title="Lihat Semua Pin"
            className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/90 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
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
              {/* Brand Badge */}
              {(() => {
                const bMeta = getBrandMeta(selectedPlacement.brand);
                return (
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", bMeta.badgeClass)}>
                    {bMeta.label}
                  </span>
                );
              })()}
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

      {/* Mapped Placements Drawer */}
      {activeDrawer === "mapped" && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 z-30 pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Placement Terpetakan ({mappedPlacements.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {mappedPlacements.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                Belum ada placement yang terpetakan.
              </div>
            ) : (
              mappedPlacements.map((p) => {
                const bMeta = getBrandMeta(p.brand);
                const isSelected = selectedPlacement?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleCenterOn(p)}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all text-xs space-y-1.5 cursor-pointer",
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {p.outlet?.name || "Outlet"}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase", bMeta.badgeClass)}>
                          {bMeta.shortLabel}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                            STATUS_CONFIG[p.status]?.bg,
                            STATUS_CONFIG[p.status]?.text,
                          )}
                        >
                          {STATUS_CONFIG[p.status]?.label || p.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {p.material?.name || p.materialId}
                      {p.locationNotes ? ` • ${p.locationNotes}` : ""}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                      </span>
                      <div className="flex items-center gap-2">
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDrawer(null);
                              onEditPlacement(p);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Edit Placement"
                          >
                            <Edit2 className="w-3 h-3 text-lime-600" />
                          </button>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          <span>Pusatkan</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Unmapped Placements Drawer */}
      {activeDrawer === "unmapped" && (
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
              onClick={() => setActiveDrawer(null)}
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
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const bMeta = getBrandMeta(p.brand);
                        return (
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase", bMeta.badgeClass)}>
                            {bMeta.shortLabel}
                          </span>
                        );
                      })()}
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                          STATUS_CONFIG[p.status]?.bg,
                          STATUS_CONFIG[p.status]?.text,
                        )}
                      >
                        {STATUS_CONFIG[p.status]?.label || p.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Material: {p.material?.name || p.materialId}
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDrawer(null);
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
