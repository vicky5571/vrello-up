import type { OutletItem as MarcomOutlet } from "@/types";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface OutletFormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  error?: string; // keep for backward compatibility
}

export function validateOutletForm(outlet: Partial<MarcomOutlet>): OutletFormValidationResult {
  const errors: Record<string, string> = {};

  if (!outlet.code || !outlet.code.trim()) {
    errors.code = "Outlet code is required";
  }
  if (!outlet.name || !outlet.name.trim()) {
    errors.name = "Outlet name is required";
  }
  if (!outlet.type || !String(outlet.type).trim()) {
    errors.type = "Outlet type is required";
  }
  if (!outlet.branchId || !outlet.branchId.trim()) {
    errors.branchId = "Parent branch is required";
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    error: isValid ? undefined : "Code, name, type, and branch are required",
  };
}

export function buildOutletPayload(outlet: Partial<MarcomOutlet>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: outlet.code?.trim(),
    name: outlet.name?.trim(),
    type: outlet.type,
    brand: outlet.brand || "IM3",
    branchId: outlet.branchId,
    city: outlet.city?.trim() || "",
    address: outlet.address?.trim() || "",
    picName: outlet.picName?.trim() || "",
    picPhone: outlet.picPhone?.trim() || "",
  };

  if (
    outlet.latitude !== undefined &&
    outlet.latitude !== null &&
    (outlet.latitude as unknown) !== "" &&
    !Number.isNaN(Number(outlet.latitude))
  ) {
    payload.latitude = Number(outlet.latitude);
  }

  if (
    outlet.longitude !== undefined &&
    outlet.longitude !== null &&
    (outlet.longitude as unknown) !== "" &&
    !Number.isNaN(Number(outlet.longitude))
  ) {
    payload.longitude = Number(outlet.longitude);
  }

  return payload;
}

export async function handleSaveOutletApi(
  outlet: Partial<MarcomOutlet>,
  isEdit?: boolean
): Promise<{ success: boolean; data?: unknown }> {
  const validation = validateOutletForm(outlet);
  if (!validation.isValid) {
    throw new Error(validation.error || "Code, name, type, and branch are required");
  }

  const isEditMode = isEdit !== undefined ? isEdit : Boolean(outlet.id);
  const url = isEditMode ? `/api/marcom/outlets/${outlet.id}` : "/api/marcom/outlets";
  const method = isEditMode ? "PATCH" : "POST";
  const payload = buildOutletPayload(outlet);

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to save outlet (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  return { success: true, data };
}

export function getCurrentGpsLocation(): Promise<GpsCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return reject(new Error("Geolocation tidak didukung oleh browser Anda"));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        resolve({ latitude, longitude });
      },
      (err) => {
        reject(new Error(`Gagal mendeteksi lokasi GPS: ${err.message}`));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export function parseCoordinateString(input: string): { latitude: number; longitude: number } | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  // match comma or whitespace separated coordinates: e.g. "-6.9932, 110.4203" or "-6.9932 110.4203"
  const parts = trimmed.split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
}

export function resetOutletFormForNextEntry(
  current: Partial<MarcomOutlet>
): Partial<MarcomOutlet> {
  return {
    branchId: current.branchId,
    brand: current.brand ?? "IM3",
    city: current.city ?? "",
    code: "",
    name: "",
    type: undefined,
    address: "",
    picName: "",
    picPhone: "",
    latitude: undefined,
    longitude: undefined,
  };
}

export function generateSuggestedOutletCode(branchCode?: string): string {
  const cleanBranch = (branchCode || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "GEN";
  // generates a clean recognizable prefix e.g. OUT-BR001-XXXX or OUT-SMG-XXXX
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `OUT-${cleanBranch}-${randomSuffix}`;
}


