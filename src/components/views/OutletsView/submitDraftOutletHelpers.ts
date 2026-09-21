import type { OutletType, OutletTier } from "@/types";
import type { RawDraftOutletInput } from "@/app/api/marcom/outlets/draft/draftOutletHelpers";

export interface DraftFormData {
  name: string;
  type: OutletType;
  tier: OutletTier;
  branchId: string;
  address: string;
  city: string;
  picName: string;
  picPhone: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateDraftForm(form: DraftFormData): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!form.name || form.name.trim().length === 0) {
    errors.name = "Nama toko / outlet wajib diisi.";
  }

  if (!form.branchId || form.branchId.trim().length === 0) {
    errors.branchId = "Cabang wajib dipilih.";
  }

  if (!form.photoUrl || form.photoUrl.trim().length === 0) {
    errors.photoUrl = "Foto tampak depan toko wajib disertakan untuk verifikasi atasan.";
  }

  if (
    form.latitude === null ||
    form.latitude === undefined ||
    form.longitude === null ||
    form.longitude === undefined
  ) {
    errors.coordinates = "Titik koordinat GPS wajib didapatkan di lokasi fisik toko.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatCoordinatesPreview(
  lat?: number | null,
  lng?: number | null
): string {
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return "Belum Terdeteksi";
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function buildDraftSubmissionPayload(form: DraftFormData): RawDraftOutletInput {
  return {
    name: form.name.trim(),
    type: form.type,
    tier: form.tier,
    branchId: form.branchId,
    address: form.address.trim(),
    city: form.city.trim(),
    picName: form.picName.trim(),
    picPhone: form.picPhone.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    photoUrl: form.photoUrl.trim(),
  };
}
