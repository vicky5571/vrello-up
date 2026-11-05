# Handover: Hard Browser Redirect on User Sign-Out

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-hard-browser-redirect-on-signout-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-hard-browser-redirect-on-signout.md`
- **ADR:** `docs/adr/0048-hard-browser-redirect-on-signout.md`

---

## 1. Executive Summary & Objective

This handover document provides execution-ready instructions for resolving the sign-out redirection defect in `UserMenuDropdown.tsx`.

By replacing Next.js soft navigation (`router.push('/login')` + `router.refresh()`) with an explicit full browser reload (`window.location.href = "/login"`), signed-out users are immediately ejected to `/login`. This permanently eliminates the race condition with `useUrlStateSync.ts`, flushes client-side in-memory Zustand and RSC caches, prevents the fallback "Pengguna VIEWER" state, and provides tactile `Loader2` feedback during sign-out.

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
|---|---|---|
| `src/components/layout/userMenuSignOut.test.ts` | **Create** | TDD test verifying hard browser redirect, no `router.push`, and spinner state |
| `src/components/layout/UserMenuDropdown.tsx` | **Modify** | Implement `isLoggingOut` state, `Loader2` indicator, and `window.location.href = "/login"` |
| `docs/SESSION_STATE.md` | **Modify** | Record active plan & spec readiness |

---

## 3. Explicit "Do Not Touch" List

| Target | Reason |
|---|---|
| `src/middleware.ts` | Edge middleware already protects authenticated paths and rejects unauthenticated requests |
| `src/auth.config.ts` | Session and authentication configuration is working as intended |
| `src/components/layout/userProfileHelpers.ts` | Profile fallback resolver functions are working properly |
| `src/components/layout/TopNav.tsx` | TopNav shell and layout remain untouched |

---

## 4. Exact Code Modification Instructions

### 4.1 Create `src/components/layout/userMenuSignOut.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("UserMenuDropdown sign-out contracts & invariants", async (t) => {
  const filePath = path.resolve(process.cwd(), "src/components/layout/UserMenuDropdown.tsx");
  assert.ok(fs.existsSync(filePath), "UserMenuDropdown.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("uses hard browser redirect to /login on sign-out", () => {
    assert.ok(
      content.includes('window.location.href = "/login"') ||
      content.includes("window.location.href = '/login'"),
      "Must execute hard browser navigation to /login"
    );
  });

  await t.test("does not use router.push for sign-out navigation", () => {
    assert.ok(
      !content.includes('router.push("/login")') && !content.includes("router.push('/login')"),
      "Must not rely on soft client-side router navigation for sign-out"
    );
  });

  await t.test("renders Loader2 spinning indicator during active signout", () => {
    assert.ok(
      content.includes("<Loader2"),
      "Must render Loader2 spinner when isLoggingOut is active"
    );
    assert.ok(
      content.includes("isLoggingOut"),
      "Must track isLoggingOut state"
    );
  });
});
```

---

### 4.2 In `src/components/layout/UserMenuDropdown.tsx`

#### Change 1: Imports & Component Signature (Lines 3–20)
**Current Snippet:**
```tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { getEffectiveProfile } from "./userProfileHelpers";
import { AppImage } from "@/components/ui/AppImage";

export interface UserMenuDropdownProps {
  onClose: () => void;
}

export function UserMenuDropdown({ onClose }: UserMenuDropdownProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
```

**Replace With:**
```tsx
import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { getEffectiveProfile } from "./userProfileHelpers";
import { AppImage } from "@/components/ui/AppImage";

export interface UserMenuDropdownProps {
  onClose: () => void;
}

export function UserMenuDropdown({ onClose }: UserMenuDropdownProps) {
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
```

#### Change 2: `handleSignOut` Handler (Lines 30–40)
**Current Snippet:**
```tsx
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
```

**Replace With:**
```tsx
  const handleSignOut = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  };
```

#### Change 3: Sign-Out Button UI (Lines 107–116)
**Current Snippet:**
```tsx
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
```

**Replace With:**
```tsx
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-medium text-xs transition-colors cursor-pointer ${
            isLoggingOut ? "pointer-events-none opacity-70 cursor-wait" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-destructive" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isLoggingOut ? "Keluar..." : "Keluar (Sign Out)"}</span>
          </div>
        </button>
```

---

## 5. Numbered Execution Order

1. **Create Test:** Create `src/components/layout/userMenuSignOut.test.ts` as specified in Section 4.1.
2. **Update Component:** Modify `src/components/layout/UserMenuDropdown.tsx` as specified in Section 4.2.
3. **Run Unit Test:** Run `node --test src/components/layout/userMenuSignOut.test.ts` to confirm tests pass.
4. **Execute Verification Gates:**
   ```bash
   npm run drift:check
   npm test
   npm run build:check
   ```
5. **Commit:**
   ```bash
   git add src/components/layout/userMenuSignOut.test.ts src/components/layout/UserMenuDropdown.tsx docs/SESSION_STATE.md
   git commit -m "fix(auth): hard browser redirect to login page on sign-out"
   ```

---

## 6. Acceptance Criteria Checklist

- [ ] Clicking "Keluar (Sign Out)" triggers `handleSignOut`.
- [ ] Button immediately renders spinning `Loader2` and text changes to "Keluar...".
- [ ] Duplicate clicks are blocked via `disabled` and `pointer-events-none`.
- [ ] Session cookies are deleted via `await signOut({ redirect: false })`.
- [ ] Hard browser navigation `window.location.href = "/login"` runs, cleanly destroying memory/store caches.
- [ ] The user is never left stuck on the dashboard as a fallback "Pengguna VIEWER".
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm test` passes with 0 failures across all 152 test suites.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.


