# TopNav Avatar & Profile Session Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate profile and avatar desynchronization in the top navigation bar by prioritizing active NextAuth session data (`session.user`), displaying real avatar images with initials fallback, and synchronizing active user identity.

**Architecture:** Extract pure profile resolution and initials computation helpers into `userProfileHelpers.ts` with comprehensive unit tests. Update `TopNav.tsx` to resolve effective profile from `session.user` with fallback to Zustand `users[0]`, rendering user image when available or initials text. Update `UserMenuDropdown.tsx` to consume the same helper for unified presentation. Synchronize `session.user.id` to `useWorkspaceStore.currentUserId`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, NextAuth v5, Zustand 5, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-topnav-avatar-profile-sync-design.md`

## Global Constraints

- Coordinator and component files must remain strictly $\le 250$ LOC (`TopNav.tsx`, `UserMenuDropdown.tsx`).
- Single Source of Truth: No duplicate domain interfaces outside `src/types/index.ts`. Helper types stay strictly in `userProfileHelpers.ts`.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`) must pass with 0 errors.

---

### Task 1: Create `userProfileHelpers.ts` and Unit Test Suite

**Files:**
- Create: `src/components/layout/userProfileHelpers.ts`
- Create: `src/components/layout/userProfileHelpers.test.ts`

**Interfaces:**
- Consumes: None (pure domain logic)
- Produces:
  ```typescript
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

  export function getInitials(name?: string | null, email?: string | null): string;
  export function getEffectiveProfile(params: ResolveProfileParams): EffectiveUserProfile;
  ```

- [ ] **Step 1: Write failing unit test in `src/components/layout/userProfileHelpers.test.ts`**

```typescript
// src/components/layout/userProfileHelpers.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getInitials,
  getEffectiveProfile,
} from "./userProfileHelpers";

describe("userProfileHelpers: getInitials", () => {
  it("extracts 2-letter uppercase initials from multi-word names", () => {
    assert.equal(getInitials("Vicky Pratama"), "VP");
    assert.equal(getInitials("Alex Rivera"), "AR");
    assert.equal(getInitials("Budi Santoso Putra"), "BS");
  });

  it("extracts 1-letter uppercase initial from single-word names", () => {
    assert.equal(getInitials("Vicky"), "V");
    assert.equal(getInitials("Admin"), "A");
  });

  it("handles irregular leading, trailing, and multiple internal spaces", () => {
    assert.equal(getInitials("   Sarah    Chen   "), "SC");
    assert.equal(getInitials(" hendra "), "H");
  });

  it("falls back to email initial when name is null, undefined, or empty", () => {
    assert.equal(getInitials(null, "vicky@example.com"), "V");
    assert.equal(getInitials("", "admin@vrelloup.dev"), "A");
    assert.equal(getInitials("   ", "staff@vrelloup.dev"), "S");
  });

  it("returns fallback 'U' when both name and email are missing or empty", () => {
    assert.equal(getInitials(null, null), "U");
    assert.equal(getInitials("", ""), "U");
    assert.equal(getInitials("   ", "   "), "U");
  });
});

describe("userProfileHelpers: getEffectiveProfile", () => {
  it("prioritizes authenticated sessionUser over fallbackUser", () => {
    const sessionUser = {
      id: "usr-google-999",
      name: "Budi Santoso",
      email: "budi@indosat.com",
      image: "https://lh3.googleusercontent.com/avatar.jpg",
      role: "supervisor",
    };
    const fallbackUser = {
      id: "user-1",
      name: "Alex Rivera",
      email: "alex@vrelloup.dev",
      avatar: "https://example.com/alex.jpg",
      role: "admin",
    };

    const profile = getEffectiveProfile({ sessionUser, fallbackUser });
    assert.equal(profile.name, "Budi Santoso");
    assert.equal(profile.email, "budi@indosat.com");
    assert.equal(profile.image, "https://lh3.googleusercontent.com/avatar.jpg");
    assert.equal(profile.role, "supervisor");
    assert.equal(profile.initials, "BS");
    assert.equal(profile.isAuthenticated, true);
  });

  it("falls back to fallbackUser when sessionUser is null or undefined", () => {
    const fallbackUser = {
      id: "user-1",
      name: "Alex Rivera",
      email: "alex@vrelloup.dev",
      avatar: "https://example.com/alex.jpg",
      role: "admin",
    };

    const profile = getEffectiveProfile({ sessionUser: null, fallbackUser });
    assert.equal(profile.name, "Alex Rivera");
    assert.equal(profile.email, "alex@vrelloup.dev");
    assert.equal(profile.image, "https://example.com/alex.jpg");
    assert.equal(profile.role, "admin");
    assert.equal(profile.initials, "AR");
    assert.equal(profile.isAuthenticated, false);
  });

  it("provides safe default values when both parameters are empty", () => {
    const profile = getEffectiveProfile({});
    assert.equal(profile.name, "Pengguna");
    assert.equal(profile.email, "");
    assert.equal(profile.image, null);
    assert.equal(profile.role, "viewer");
    assert.equal(profile.initials, "U");
    assert.equal(profile.isAuthenticated, false);
  });

  it("preserves sessionUser with missing image by keeping image as null", () => {
    const sessionUser = {
      id: "usr-cred-123",
      name: "Siti Rahma",
      email: "siti@indosat.com",
      image: null,
      role: "staff",
    };
    const profile = getEffectiveProfile({ sessionUser });
    assert.equal(profile.name, "Siti Rahma");
    assert.equal(profile.image, null);
    assert.equal(profile.initials, "SR");
    assert.equal(profile.isAuthenticated, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --import ./test/register-alias.mjs src/components/layout/userProfileHelpers.test.ts`  
Expected: FAIL with `Cannot find module './userProfileHelpers'`

- [ ] **Step 3: Implement `src/components/layout/userProfileHelpers.ts`**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --import ./test/register-alias.mjs src/components/layout/userProfileHelpers.test.ts`  
Expected: PASS (9 passed)

- [ ] **Step 5: Commit helper module**

```bash
git add src/components/layout/userProfileHelpers.ts src/components/layout/userProfileHelpers.test.ts
git commit -m "feat(layout): add userProfileHelpers for authoritative session profile resolution"
```

---

### Task 2: Integrate `userProfileHelpers` and Session Sync into `TopNav.tsx`

**Files:**
- Modify: `src/components/layout/TopNav.tsx`

**Interfaces:**
- Consumes:
  - `getEffectiveProfile` from `@/components/layout/userProfileHelpers`
  - `useSession` from `next-auth/react`
  - `useWorkspaceStore` (`users`, `currentUserId`, `setCurrentUserId`)
- Produces:
  - Session-synchronized top navigation bar with authoritative avatar rendering and image error recovery.

- [ ] **Step 1: Update `TopNav.tsx` implementation**

Replace the manual `me` and `initials` calculation in `TopNav.tsx` with `getEffectiveProfile`. Add image error recovery state and session ID store synchronization:

```tsx
// In src/components/layout/TopNav.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { TopNavBreadcrumbs } from "./TopNavBreadcrumbs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { ProjectsFilterBar } from "./ProjectsFilterBar";
import { getEffectiveProfile } from "./userProfileHelpers";
import { Search, Download } from "lucide-react";

export function TopNav() {
  const users = useWorkspaceStore((s) => s.users);
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const setCurrentUserId = useWorkspaceStore((s) => s.setCurrentUserId);
  const appMode = useWorkspaceStore((s) => s.appMode);
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);

  const me = users.find((u) => u.id === currentUserId) ?? users[0];
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(
    () => getEffectiveProfile({ sessionUser: session?.user, fallbackUser: me }),
    [session?.user, me],
  );

  // Synchronize active session user ID to Zustand store if present and differing
  useEffect(() => {
    if (session?.user?.id && currentUserId !== session.user.id) {
      setCurrentUserId(session.user.id);
    }
  }, [session?.user?.id, currentUserId, setCurrentUserId]);

  // Reset image error state whenever the effective profile image URL changes
  useEffect(() => {
    setImageError(false);
  }, [profile.image]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative z-30 flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
      <header className="h-11 px-4 flex items-center justify-between gap-3 bg-white dark:bg-[#18191B]">
        {/* Left: Breadcrumbs */}
        <TopNavBreadcrumbs variant="full" />

        {/* Center: Command Palette Trigger */}
        <div
          onClick={openCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/40"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search marketing, ops & projects...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExportCenterOpen(true)}
            title="Export Center"
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <NotificationCenter />
          <ThemeToggle />

          {/* Profile Avatar / User Menu */}
          <div ref={userMenuRef} className="relative ml-1 flex items-center gap-1.5">
            <button
              type="button"
              title={
                profile.isAuthenticated
                  ? `Signed in as ${profile.name} (${profile.email})`
                  : `Active profile: ${profile.name}`
              }
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="relative w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px] shadow-2xs cursor-pointer overflow-hidden"
            >
              {profile.image && !imageError ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{profile.initials}</span>
              )}

              {profile.isAuthenticated && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900 z-10" />
              )}
            </button>

            {isUserMenuOpen && (
              <UserMenuDropdown
                onClose={() => setIsUserMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </header>
      {appMode === "tasks" && <ProjectsFilterBar />}
    </div>
  );
}
```

- [ ] **Step 2: Run build check to verify TypeScript compilation**

Run: `npm run build:check`  
Expected: PASS (0 errors)

- [ ] **Step 3: Verify coordinator file size**

Run: `wc -l src/components/layout/TopNav.tsx`  
Expected: $\le 250$ LOC (~135 LOC)

- [ ] **Step 4: Commit TopNav changes**

```bash
git add src/components/layout/TopNav.tsx
git commit -m "fix(layout): synchronize TopNav avatar and profile with active NextAuth session"
```

---

### Task 3: Refactor `UserMenuDropdown.tsx` for Parity & Robustness

**Files:**
- Modify: `src/components/layout/UserMenuDropdown.tsx`

**Interfaces:**
- Consumes:
  - `getEffectiveProfile` from `@/components/layout/userProfileHelpers`
  - `useSession` from `next-auth/react`
- Produces:
  - Synchronized user profile inspector card matching TopNav trigger avatar.

- [ ] **Step 1: Update `UserMenuDropdown.tsx` implementation**

Consume `getEffectiveProfile({ sessionUser: session?.user })` to ensure 100% parity with `TopNav.tsx`:

```tsx
// In src/components/layout/UserMenuDropdown.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getEffectiveProfile } from "./userProfileHelpers";

export interface UserMenuDropdownProps {
  onClose: () => void;
}

export function UserMenuDropdown({ onClose }: UserMenuDropdownProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);

  const profile = getEffectiveProfile({ sessionUser: session?.user });
  const isGoogle = Boolean(session?.user?.image);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Berhasil keluar dari akun.");
      router.push("/login");
      router.refresh();
      onClose();
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-card shadow-xl border border-border p-2 z-50 text-xs">
      {/* Profile Header Card */}
      <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
            {profile.image && !imageError ? (
              <img
                src={profile.image}
                alt={profile.name}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground truncate">
                {profile.name}
              </span>
              <span
                className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  profile.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : profile.role === "supervisor"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : profile.role === "staff"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {profile.role}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {profile.email}
            </div>
          </div>
        </div>

        {isGoogle && (
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Google Verified Account</span>
          </div>
        )}
      </div>

      {/* Sign Out Button */}
      <div className="mt-2 pt-1 border-t border-border/40">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-medium text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Sign Out)</span>
          </div>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build check to verify compilation**

Run: `npm run build:check`  
Expected: PASS (0 errors)

- [ ] **Step 3: Verify coordinator file size**

Run: `wc -l src/components/layout/UserMenuDropdown.tsx`  
Expected: $\le 250$ LOC (~95 LOC)

- [ ] **Step 4: Commit UserMenuDropdown changes**

```bash
git add src/components/layout/UserMenuDropdown.tsx
git commit -m "refactor(layout): unify UserMenuDropdown profile resolution with userProfileHelpers"
```

---

### Task 4: Complete Verification Gates and Documentation Update

**Files:**
- Modify: `docs/SESSION_STATE.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/plans/README.md`

- [ ] **Step 1: Run drift check**

Run: `npm run drift:check`  
Expected: `✅ No drift detected. All invariants pass.`

- [ ] **Step 2: Run smoke tests**

Run: `npm run test:smoke`  
Expected: `ℹ pass 85, fail 0`

- [ ] **Step 3: Run full test suite**

Run: `npm test`  
Expected: `ℹ pass 613+ (0 failures)`

- [ ] **Step 4: Run Next.js strict build check**

Run: `npm run build:check`  
Expected: `0 TypeScript errors`

- [ ] **Step 5: Update documentation indexes in specs/plans README and SESSION_STATE.md**

Update:
- `docs/superpowers/specs/README.md` adding `2026-11-01 | topnav-avatar-profile-sync | Done`
- `docs/superpowers/plans/README.md` adding `2026-11-01 | topnav-avatar-profile-sync | 4 phases | Done`
- `docs/SESSION_STATE.md` with session summary and completed items

- [ ] **Step 6: Commit all documentation changes**

```bash
git add docs/superpowers/specs/README.md docs/superpowers/plans/README.md docs/SESSION_STATE.md
git commit -m "docs: document TopNav avatar profile session synchronization fix"
```

