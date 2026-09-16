"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Crosshair,
  ExternalLink,
  Trash2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Navigation,
} from "lucide-react";
import type * as L from "leaflet";
import {
  parseGoogleMapsUrl,
  isValidCoordinate,
  buildGoogleMapsUrl,
  type Coordinates,
} from "@/lib/marcom/locationUtils";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  shareLocationUrl: string | undefined;
  locationNotes: string | undefined;
  onChange: (data: {
    latitude: number | null;
    longitude: number | null;
    shareLocationUrl: string;
    locationNotes: string;
  }) => void;
}

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta
const DEFAULT_ZOOM = 13;

function createPinIcon(leaflet: typeof L) {
  return leaflet.divIcon({
    className: "custom-location-pin",
    html: `
      <div style="transform: translate(-50%, -100%); cursor: grab;">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 14 40.5 15.2 41.7C15.6 42.1 16.4 42.1 16.8 41.7C18 40.5 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#10B981" />
          <circle cx="16" cy="16" r="6" fill="white" />
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [0, 0],
  });
}

export function LocationPicker({
  latitude,
  longitude,
  shareLocationUrl = "",
  locationNotes = "",
  onChange,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const leafletRef = useRef<typeof L | null>(null);

  const [inputUrl, setInputUrl] = useState(shareLocationUrl || "");
  const [notes, setNotes] = useState(locationNotes || "");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const hasCoords = isValidCoordinate(latitude ?? Number.NaN, longitude ?? Number.NaN);

  // Initialize Leaflet mini-map
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (isCancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const initialCenter: [number, number] = hasCoords
        ? [latitude as number, longitude as number]
        : DEFAULT_CENTER;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: hasCoords ? 15 : DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      const pinIcon = createPinIcon(L);

      if (hasCoords) {
        const marker = L.marker([latitude as number, longitude as number], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          if (isValidCoordinate(pos.lat, pos.lng)) {
            onChange({
              latitude: pos.lat,
              longitude: pos.lng,
              shareLocationUrl: inputUrl,
              locationNotes: notes,
            });
          }
        });

        markerRef.current = marker;
      }

      // Map click handler to place or move marker
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (!isValidCoordinate(lat, lng)) return;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            icon: pinIcon,
            draggable: true,
          }).addTo(map);

          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            if (isValidCoordinate(pos.lat, pos.lng)) {
              onChange({
                latitude: pos.lat,
                longitude: pos.lng,
                shareLocationUrl: inputUrl,
                locationNotes: notes,
              });
            }
          });

          markerRef.current = marker;
        }

        map.panTo([lat, lng]);
        onChange({
          latitude: lat,
          longitude: lng,
          shareLocationUrl: inputUrl,
          locationNotes: notes,
        });
      });

      // In case container had 0 height before render
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
        markerRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync external coordinate changes to map marker
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;

    if (hasCoords) {
      const lat = latitude as number;
      const lng = longitude as number;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const L = leafletRef.current;
        const marker = L.marker([lat, lng], {
          icon: createPinIcon(L),
          draggable: true,
        }).addTo(mapInstanceRef.current);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          if (isValidCoordinate(pos.lat, pos.lng)) {
            onChange({
              latitude: pos.lat,
              longitude: pos.lng,
              shareLocationUrl: inputUrl,
              locationNotes: notes,
            });
          }
        });

        markerRef.current = marker;
      }

      mapInstanceRef.current.setView([lat, lng], 16);
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [latitude, longitude, hasCoords]);

  // Handle URL paste / text change with auto-parse
  const handleUrlChange = useCallback(
    async (text: string) => {
      setInputUrl(text);
      setLocationError(null);

      if (!text.trim()) {
        onChange({
          latitude: null,
          longitude: null,
          shareLocationUrl: "",
          locationNotes: notes,
        });
        return;
      }

      // 1. Try immediate client-side parse
      const direct = parseGoogleMapsUrl(text);
      if (direct) {
        onChange({
          latitude: direct.latitude,
          longitude: direct.longitude,
          shareLocationUrl: text,
          locationNotes: notes,
        });
        return;
      }

      // 2. If it's a URL (like maps.app.goo.gl or goo.gl/maps), resolve via API
      if (text.startsWith("http://") || text.startsWith("https://")) {
        setIsResolving(true);
        try {
          const res = await fetch(`/api/marcom/resolve-location?url=${encodeURIComponent(text)}`);
          if (res.ok) {
            const data = await res.json();
            if (isValidCoordinate(data.latitude, data.longitude)) {
              onChange({
                latitude: data.latitude,
                longitude: data.longitude,
                shareLocationUrl: text,
                locationNotes: notes,
              });
              return;
            }
          }
          setLocationError("Tidak dapat menemukan koordinat dari link tersebut.");
        } catch {
          setLocationError("Gagal menghubungi resolver lokasi.");
        } finally {
          setIsResolving(false);
        }
      } else {
        setLocationError("Format tidak dikenali. Masukkan URL Google Maps atau koordinat lat,lng.");
      }
    },
    [notes, onChange],
  );

  // Handle Device Geolocation (GPS)
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);
        setGpsAccuracy(acc);

        const mapsUrl = buildGoogleMapsUrl(lat, lng);
        setInputUrl(mapsUrl);

        onChange({
          latitude: lat,
          longitude: lng,
          shareLocationUrl: mapsUrl,
          locationNotes: notes,
        });
      },
      (error) => {
        setIsLocating(false);
        let msg = "Gagal mengambil lokasi GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin akses lokasi ditolak oleh browser/perangkat.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Informasi lokasi tidak tersedia saat ini.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Waktu permintaan GPS habis (timeout).";
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  // Clear location
  const handleClearLocation = () => {
    setInputUrl("");
    setGpsAccuracy(null);
    setLocationError(null);
    onChange({
      latitude: null,
      longitude: null,
      shareLocationUrl: "",
      locationNotes: notes,
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Lokasi & Shareloc (GPS)
          </label>
        </div>
        {hasCoords && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Terpetakan
          </span>
        )}
      </div>

      {/* Input Link / Coordinate */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste link Google Maps / shareloc WA / koordinat lat,lng..."
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {isResolving && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGetDeviceLocation}
            disabled={isLocating}
            title="Ambil titik koordinat dari GPS perangkat Anda saat ini"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            <span>{isLocating ? "Mencari GPS..." : "GPS Saya"}</span>
          </button>
        </div>

        {locationError && (
          <p className="text-[11px] text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{locationError}</span>
          </p>
        )}

        {gpsAccuracy && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Navigation className="w-3 h-3 shrink-0" />
            <span>Akurasi GPS perangkat: ±{gpsAccuracy} meter</span>
          </p>
        )}
      </div>

      {/* Mini-map Leaflet canvas */}
      <div className="space-y-1">
        <div
          ref={mapContainerRef}
          className="w-full h-44 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs relative z-0"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Klik peta atau geser pin hijau untuk mengatur titik presisi
          </span>
          {hasCoords && (
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
              {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
            </span>
          )}
        </div>
      </div>

      {/* Coordinates readout bar & External link */}
      {hasCoords && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <a
              href={buildGoogleMapsUrl(latitude as number, longitude as number)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Buka di Google Maps</span>
            </a>
          </div>

          <button
            type="button"
            onClick={handleClearLocation}
            className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Hapus Titik Lokasi</span>
          </button>
        </div>
      )}

      {/* Location Notes / Landmark */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Catatan Patokan Lokasi (Opsional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            onChange({
              latitude: latitude ?? null,
              longitude: longitude ?? null,
              shareLocationUrl: inputUrl,
              locationNotes: e.target.value,
            });
          }}
          placeholder="Contoh: Sayap kiri lantai 1 dekat pintu masuk utama"
          className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
