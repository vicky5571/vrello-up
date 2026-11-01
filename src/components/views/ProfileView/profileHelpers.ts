// src/components/views/ProfileView/profileHelpers.ts

export interface BranchLookupItem {
  id: string;
  name: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Formats a user's assigned branches into readable badges.
 * Super Admins are automatically designated as nationwide scope.
 */
export function formatBranchBadges(
  assignedBranchIds: string[] = [],
  allBranches: BranchLookupItem[] = [],
  role?: string,
): string[] {
  const cleanRole = (role || "").trim().toLowerCase();

  if (cleanRole === "admin") {
    return ["Semua Cabang (Nasional)"];
  }

  if (!assignedBranchIds || assignedBranchIds.length === 0) {
    return ["Belum Ada Penugasan Cabang"];
  }

  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]));

  return assignedBranchIds.map((id) => branchMap.get(id) || id);
}

/**
 * Validates password update form fields prior to submission.
 */
export function validatePasswordForm(
  currentPassword?: string,
  newPassword?: string,
  confirmPassword?: string,
): PasswordValidationResult {
  const current = (currentPassword || "").trim();
  const next = (newPassword || "").trim();
  const confirm = (confirmPassword || "").trim();

  if (!current) {
    return {
      valid: false,
      error: "Password saat ini wajib diisi untuk verifikasi keamanan.",
    };
  }

  if (next.length < 8) {
    return {
      valid: false,
      error: "Password baru minimal 8 karakter.",
    };
  }

  if (next !== confirm) {
    return {
      valid: false,
      error: "Konfirmasi password baru tidak cocok.",
    };
  }

  return { valid: true };
}

/**
 * Validates and trims an avatar URL or data URI, returning null if invalid or empty.
 */
export function sanitizeAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  const clean = url.trim();
  if (!clean) return null;

  if (clean.startsWith("data:image/")) {
    return clean;
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return clean;
    }
  } catch {
    return null;
  }

  return null;
}

