import type { OutletItem as MarcomOutlet } from "@/types";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export function validateOutletForm(outlet: Partial<MarcomOutlet>): {
  isValid: boolean;
  error?: string;
} {
  const code = outlet.code?.trim();
  const name = outlet.name?.trim();
  const type = outlet.type;
  const tier = outlet.tier || "TIER_1";
  const branchId = outlet.branchId?.trim();

  if (!code || !name || !type || !tier || !branchId) {
    return {
      isValid: false,
      error: "Code, name, type, tier, and branch are required",
    };
  }

  return { isValid: true };
}

export function buildOutletPayload(outlet: Partial<MarcomOutlet>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: outlet.code?.trim(),
    name: outlet.name?.trim(),
    type: outlet.type,
    tier: outlet.tier || "TIER_1",
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
    throw new Error(validation.error || "Code, name, type, tier, and branch are required");
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
