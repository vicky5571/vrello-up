// src/components/layout/userProfileHelpers.ts

export interface EffectiveUserProfile {
  name: string;
  email: string;
  image: string | null;
  role: string;
  initials: string;
  isAuthenticated: boolean;
}

export interface ResolveProfileParams {
  sessionUser?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
  fallbackUser?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
  } | null;
}

/**
 * Extracts 1 or 2 letter uppercase initials from a name or email.
 * Falls back to "U" if neither produces valid characters.
 */
export function getInitials(name?: string | null, email?: string | null): string {
  const cleanName = (name ?? "").trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    }
  }

  const cleanEmail = (email ?? "").trim();
  if (cleanEmail) {
    return cleanEmail[0].toUpperCase();
  }

  return "U";
}

/**
 * Resolves an authoritative, normalized user profile prioritizing active NextAuth session data,
 * falling back gracefully to workspace store state or clean default strings.
 */
export function getEffectiveProfile(params: ResolveProfileParams): EffectiveUserProfile {
  const { sessionUser, fallbackUser } = params;

  if (sessionUser) {
    const name = sessionUser.name?.trim() || fallbackUser?.name?.trim() || "Pengguna";
    const email = sessionUser.email?.trim() || fallbackUser?.email?.trim() || "";
    const image = sessionUser.image?.trim() || fallbackUser?.avatar?.trim() || null;
    const role = sessionUser.role?.trim() || fallbackUser?.role || "viewer";
    const initials = getInitials(name, email);

    return {
      name,
      email,
      image,
      role,
      initials,
      isAuthenticated: true,
    };
  }

  if (fallbackUser) {
    const name = fallbackUser.name?.trim() || "Pengguna";
    const email = fallbackUser.email?.trim() || "";
    const image = fallbackUser.avatar?.trim() || null;
    const role = fallbackUser.role || "viewer";
    const initials = getInitials(name, email);

    return {
      name,
      email,
      image,
      role,
      initials,
      isAuthenticated: false,
    };
  }

  return {
    name: "Pengguna",
    email: "",
    image: null,
    role: "viewer",
    initials: "U",
    isAuthenticated: false,
  };
}
