import { VALID_TYPES, VALID_TIERS } from "@/app/api/marcom/outlets/outletsSearchFilter";
import { generateDraftOutletCode } from "@/lib/marcom/outletCodeGenerator";
import type { OutletType, OutletTier, OutletStatus } from "@/types";

export interface RawDraftOutletInput {
  name?: string;
  code?: string;
  type?: OutletType;
  tier?: OutletTier;
  branchId?: string;
  branchCode?: string;
  address?: string;
  city?: string;
  picName?: string;
  picPhone?: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateDraftOutletPayload(input: RawDraftOutletInput): ValidationResult {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push("Nama outlet wajib diisi (name).");
  }

  if (!input.branchId || input.branchId.trim().length === 0) {
    errors.push("Cabang outlet wajib dipilih (branchId).");
  }

  if (input.type && !VALID_TYPES.includes(input.type as (typeof VALID_TYPES)[number])) {
    errors.push(`Tipe outlet tidak valid (type): ${input.type}.`);
  }

  if (input.tier && !VALID_TIERS.includes(input.tier as (typeof VALID_TIERS)[number])) {
    errors.push(`Tier outlet tidak valid: ${input.tier}.`);
  }

  if (input.latitude !== undefined && input.latitude !== null) {
    if (typeof input.latitude !== "number" || Number.isNaN(input.latitude)) {
      errors.push("Latitude harus berupa angka valid.");
    }
  }

  if (input.longitude !== undefined && input.longitude !== null) {
    if (typeof input.longitude !== "number" || Number.isNaN(input.longitude)) {
      errors.push("Longitude harus berupa angka valid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface BuiltDraftOutletData {
  name: string;
  code: string;
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
  status: OutletStatus;
  active: boolean;
  submittedBy: string;
}

export function buildDraftOutletData(
  input: RawDraftOutletInput,
  submittedBy: string
): BuiltDraftOutletData {
  const branchCode = input.branchCode || "GEN";
  const code =
    input.code && input.code.trim().length > 0
      ? input.code.trim()
      : generateDraftOutletCode(branchCode);

  const parsedLat =
    typeof input.latitude === "number" && !Number.isNaN(input.latitude)
      ? input.latitude
      : null;
  const parsedLng =
    typeof input.longitude === "number" && !Number.isNaN(input.longitude)
      ? input.longitude
      : null;

  return {
    name: input.name?.trim() || "",
    code,
    type: input.type || "TRADITIONAL",
    tier: input.tier || "TIER_1",
    branchId: input.branchId || "",
    address: input.address?.trim() || "",
    city: input.city?.trim() || "",
    picName: input.picName?.trim() || "",
    picPhone: input.picPhone?.trim() || "",
    latitude: parsedLat,
    longitude: parsedLng,
    photoUrl: input.photoUrl?.trim() || "",
    status: "PENDING_APPROVAL",
    active: false,
    submittedBy,
  };
}
