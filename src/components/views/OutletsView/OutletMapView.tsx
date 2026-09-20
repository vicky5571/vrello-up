"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Store,
  ExternalLink,
  Edit2,
  Building2,
  Layers,
  FileText,
  MessageCircle,
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Search,
  AlertCircle,
  X,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MarcomOutlet } from "./OutletsView";
import {
  resolveOutletCoordinates,
  getOutletMarkerMeta,
} from "@/lib/marcom/outletAnalytics";
import { isValidCoordinate, buildGoogleMapsUrl } from "@/lib/marcom/locationUtils";
import { cn } from "@/lib/utils";

export interface OutletMapViewProps {
  outlets: MarcomOutlet[];
  onSelectOutlet: (outletId: string) => void;
  onEditOutlet?: (outlet: MarcomOutlet) => void;
  canManage?: boolean;
}

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

function createOutletPinIcon(
  leaflet: typeof L,
  outlet: MarcomOutlet,
) {
  const meta = getOutletMarkerMeta(outlet);
  const pinColor = meta.brandColor; // Yellow for IM3, Pink for 3
  const outletBrand = (outlet as unknown as { brand?: string }).brand;
  const isTri = outletBrand === "3" || outletBrand === "TRI";
  const brandCode = isTri ? "3" : "IM3";
  const contrastColor = isTri ? "#EC4899" : "#B45309";
  const activePipColor = outlet.active ? "#10B981" : "#94A3B8";

  return leaflet.divIcon({
    className: "!bg-transparent !border-0",
    html: `
      <div style="width: 38px; height: 48px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.38)); cursor: pointer; transition: transform 0.15s ease;">
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin Tear Drop Body -->
          <path d="M19 0C8.50659 0 0 8.50659 0 19C0 31.8 17.0 47.1 18.2 48.1C18.6 48.5 19.4 48.5 19.8 48.1C21.0 47.1 38 31.8 38 19C38 8.50659 29.4934 0 19 0Z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.8" />
          <!-- Inner White Badge Circle -->
          <circle cx="19" cy="19" r="11.5" fill="white" />
          <!-- Brand text or Store indicator -->
          <text x="19" y="${brandCode === '3' ? 24 : 22.5}" font-family="system-ui, -apple-system, sans-serif" font-size="${brandCode === '3' ? '14' : '10'}" font-weight="900" text-anchor="middle" fill="${contrastColor}">${brandCode}</text>
          <!-- Active Status Pip Indicator -->
          <circle cx="28.5" cy="9.5" r="4.5" fill="${activePipColor}" stroke="white" stroke-width="1.5" />
        </svg>
      </div>
    `,
    iconSize: [38, 48],
    iconAnchor: [19, 48],
    popupAnchor: [0, -44],
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

export function OutletMapView({
  outlets,
  onSelectOutlet,
  onEditOutlet,
  canManage = false,
}: OutletMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedOutlet, setSelectedOutlet] = useState<MarcomOutlet | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<"unmapped" | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedMouFilter, setSelectedMouFilter] = useState<string>("ALL");

  // Extract unique branches
  const branchOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const o of outlets) {
      if (o.branchId && o.branch) {
        map.set(o.branchId, { id: o.branchId, name: o.branch.name });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [outlets]);

  // Split outlets into mapped and unmapped
  const { mappedOutlets, unmappedOutlets } = useMemo(() => {
    const mapped: (MarcomOutlet & { lat: number; lng: number })[] = [];
    const unmapped: MarcomOutlet[] = [];

    for (const o of outlets) {
      const coords = resolveOutletCoordinates(o);
      if (
        coords.latitude !== null &&
        coords.longitude !== null &&
        isValidCoordinate(coords.latitude, coords.longitude)
      ) {
        mapped.push({
          ...o,
          lat: coords.latitude,
          lng: coords.longitude,
        });
      } else {
        unmapped.push(o);
      }
    }

    return { mappedOutlets: mapped, unmappedOutlets: unmapped };
  }, [outlets]);

  // Apply filters on mapped outlets
  const filteredMappedOutlets = useMemo(() => {
    return mappedOutlets.filter((o) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = o.name.toLowerCase().includes(q);
        const matchesCode = o.code.toLowerCase().includes(q);
        const matchesCity = (o.city || "").toLowerCase().includes(q);
        const matchesPic = (o.picName || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCity && !matchesPic) return false;
      }

      // Brand filter
      if (selectedBrand !== "ALL") {
        const outletBrand = (o as unknown as { brand?: string }).brand || "IM3";
        const brand = outletBrand.toUpperCase();
        if (selectedBrand === "TRI" && brand !== "3" && brand !== "TRI") return false;
        if (selectedBrand === "IM3" && (brand === "3" || brand === "TRI")) return false;
      }

      // Type filter
      if (selectedType !== "ALL" && o.type !== selectedType) {
        return false;
      }

      // Tier filter
      if (selectedTier !== "ALL" && (o.tier || "TIER_1") !== selectedTier) {
        return false;
      }

      // Branch filter
      if (selectedBranch !== "ALL" && o.branchId !== selectedBranch) {
        return false;
      }

      // MoU filter
      if (selectedMouFilter === "HAS_MOU" && (!o.mouCount || o.mouCount <= 0)) {
        return false;
      }
      if (selectedMouFilter === "NO_MOU" && o.mouCount && o.mouCount > 0) {
        return false;
      }

      return true;
    });
  }, [
    mappedOutlets,
    searchQuery,
    selectedBrand,
    selectedType,
    selectedTier,
    selectedBranch,
    selectedMouFilter,
  ]);

  // Render User Marker
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

  // Render Outlet Markers
  const renderMarkers = useCallback(
    (currentMapped: (MarcomOutlet & { lat: number; lng: number })[]) => {
      const map = mapInstanceRef.current;
      const L = leafletRef.current;
      const markersGroup = markersLayerRef.current;
      if (!map || !L || !markersGroup) return null;

      markersGroup.clearLayers();
      const bounds = L.latLngBounds([]);

      currentMapped.forEach((outlet) => {
        bounds.extend([outlet.lat, outlet.lng]);

        const icon = createOutletPinIcon(L, outlet);
        const marker = L.marker([outlet.lat, outlet.lng], {
          icon,
          zIndexOffset: 600,
        });

        marker.on("click", () => {
          setSelectedOutlet(outlet);
        });

        const meta = getOutletMarkerMeta(outlet);
        marker.bindTooltip(
          `<strong>[${meta.brandLabel}] ${outlet.name}</strong><br/>` +
            `<span style="color: #64748b;">${meta.typeLabel} • ${outlet.city || "Kota"}</span>`,
          { direction: "top", offset: [0, -44] },
        );

        markersGroup.addLayer(marker);
      });

      return bounds;
    },
    [],
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
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        scrollWheelZoom: false,
      });

      map.scrollWheelZoom.disable();

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

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: MAX_ZOOM,
        subdomains: "abcd",
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (pinchCleanup) pinchCleanup();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userCoords]);

  // Update markers when filtered outlets change
  useEffect(() => {
    if (!isMapReady) return;
    const bounds = renderMarkers(filteredMappedOutlets);
    const map = mapInstanceRef.current;

    // Only auto fit if bounds are valid and not manually locating
    if (map && bounds && bounds.isValid() && filteredMappedOutlets.length > 0 && !userCoords) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredMappedOutlets, isMapReady, renderMarkers, userCoords]);

  // Locate User
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

        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (map && L) {
          map.flyTo([lat, lng], 15, { duration: 1.2 });
          renderUserMarker(lat, lng, L);
          renderMarkers(filteredMappedOutlets);
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
    [renderUserMarker, renderMarkers, filteredMappedOutlets],
  );

  const handleFitAllMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || filteredMappedOutlets.length === 0) return;

    const bounds = L.latLngBounds([]);
    for (const o of filteredMappedOutlets) {
      bounds.extend([o.lat, o.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      toast.info(`Menampilkan ${filteredMappedOutlets.length} outlet pada peta`);
    }
  }, [filteredMappedOutlets]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBrand("ALL");
    setSelectedType("ALL");
    setSelectedTier("ALL");
    setSelectedBranch("ALL");
    setSelectedMouFilter("ALL");
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedBrand !== "ALL" ||
    selectedType !== "ALL" ||
    selectedTier !== "ALL" ||
    selectedBranch !== "ALL" ||
    selectedMouFilter !== "ALL";

  return (
    <div
      className={cn(
        "relative flex flex-col w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0 h-screen" : "h-[750px] min-h-[600px]",
      )}
    >
      {/* Top Filter & Control Header */}
      <div className="z-10 p-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative min-w-[180px] max-w-[260px] flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari toko, kode, kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            aria-label="Filter Brand"
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Semua Brand</option>
            <option value="IM3">IM3 (Kuning)</option>
            <option value="TRI">3 / Tri (Pink)</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter Store Type"
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Semua Tipe Toko</option>
            <option value="TRADITIONAL">Traditional</option>
            <option value="MODERN_RETAIL">Modern Retail</option>
            <option value="EXCLUSIVE">Exclusive / Official</option>
            <option value="CAMPUS_OUTLET">Campus Outlet</option>
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            aria-label="Filter Tier"
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Semua Tier</option>
            <option value="TIER_1">Tier 1 (Prioritas)</option>
            <option value="TIER_2">Tier 2 (Reguler)</option>
            <option value="TIER_3">Tier 3 (Basic)</option>
          </select>

          {/* Branch Filter */}
          {branchOptions.length > 0 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              aria-label="Filter Branch"
              className="max-w-[170px] truncate px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">Semua Branch</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* MoU Status Filter */}
          <select
            value={selectedMouFilter}
            onChange={(e) => setSelectedMouFilter(e.target.value)}
            aria-label="Filter MoU Status"
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Semua Status MoU</option>
            <option value="HAS_MOU">Memiliki MoU Aktif</option>
            <option value="NO_MOU">Belum Ada MoU</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-semibold cursor-pointer whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>

        {/* Right Status Counter & Unmapped Drawer Trigger */}
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            <Store className="w-3.5 h-3.5 text-orange-500" />
            <span>
              <strong>{filteredMappedOutlets.length}</strong> terpetakan
            </span>
          </div>

          {unmappedOutlets.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === "unmapped" ? null : "unmapped")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              title="Lihat daftar outlet yang belum memiliki koordinat GPS"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{unmappedOutlets.length} Belum GPS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative flex-1 w-full h-full bg-slate-100 dark:bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Custom Map Controls */}
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
          <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Perbesar Peta"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-200 dark:bg-slate-800" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Perkecil Peta"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitAllMarkers}
            className="p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Pusatkan ke Semua Outlet"
          >
            <Compass className="w-4 h-4 text-orange-600" />
          </button>

          <button
            type="button"
            onClick={() => handleCenterOnUser(true)}
            disabled={isLocating}
            className={cn(
              "p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer",
              isLocating ? "text-blue-500 animate-spin" : "text-slate-700 dark:text-slate-300 hover:text-blue-600",
            )}
            title="Lokasi Saya (GPS)"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Legend Box (Bottom Left) */}
        <div className="absolute left-4 bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 text-xs flex flex-col gap-2">
          <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Legenda Brand & Status
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 ring-2 ring-yellow-400/20" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">IM3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-500 border border-pink-600 ring-2 ring-pink-500/20" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">3 (Tri)</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Active</span>
            </div>
          </div>
        </div>

        {/* Selected Outlet Rich Preview Card (Bottom Center / Side) */}
        {selectedOutlet && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-5 z-30 w-[94%] max-w-lg bg-white/98 dark:bg-slate-900/98 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                  style={{
                    backgroundColor: getOutletMarkerMeta(selectedOutlet).brandColor,
                  }}
                >
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {selectedOutlet.code}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        getOutletMarkerMeta(selectedOutlet).badgeBg,
                        getOutletMarkerMeta(selectedOutlet).badgeText,
                      )}
                    >
                      {getOutletMarkerMeta(selectedOutlet).brandLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {getOutletMarkerMeta(selectedOutlet).typeLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedOutlet.name}
                  </h3>
                  {selectedOutlet.branch && (
                    <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      <span>{selectedOutlet.branch.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOutlet(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">PIC & Kontak</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {selectedOutlet.picName || "—"}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  {selectedOutlet.picPhone || "—"}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Aktivitas Marcom</div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-lime-500" />
                    <span>
                      <strong>{selectedOutlet.placementCount ?? 0}</strong> Placements
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      <strong>{selectedOutlet.mouCount ?? 0}</strong> MoU
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                {selectedOutlet.picPhone && (
                  <a
                    href={`https://wa.me/${selectedOutlet.picPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                    title="Kirim WhatsApp ke PIC"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {(() => {
                  const coords = resolveOutletCoordinates(selectedOutlet);
                  if (coords.latitude && coords.longitude) {
                    return (
                      <a
                        href={buildGoogleMapsUrl(coords.latitude, coords.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                        <span>Rute Maps</span>
                      </a>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex items-center gap-2">
                {canManage && onEditOutlet && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditOutlet(selectedOutlet);
                      setSelectedOutlet(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectOutlet(selectedOutlet.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Buka Profil 360°</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slide-over Drawer for Outlets without GPS */}
        {activeDrawer === "unmapped" && (
          <div className="absolute right-0 top-0 bottom-0 z-30 w-80 max-w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Outlet Belum Memiliki Titik GPS ({unmappedOutlets.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 mb-3">
              Klik salah satu outlet untuk melengkapi titik koordinat latitude & longitude di form profil toko.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {unmappedOutlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400">
                      {outlet.code}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {outlet.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {outlet.city || outlet.address || "Belum ada alamat"}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canManage && onEditOutlet && (
                      <button
                        type="button"
                        onClick={() => onEditOutlet(outlet)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-orange-600 hover:bg-orange-50 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                        title="Edit & Tambah Titik GPS"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectOutlet(outlet.id)}
                      className="p-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer"
                      title="Buka Profil 360°"
                    >
                      <Store className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
