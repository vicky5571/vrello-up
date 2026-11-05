# Spec: Hard Browser Redirect on User Sign-Out

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0048-hard-browser-redirect-on-signout.md` (ADR-0048)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification defines the fix for the sign-out redirection defect in `src/components/layout/UserMenuDropdown.tsx`.

### Core Objectives:
1. **Guaranteed Redirection to `/login`:** Eliminate the soft-navigation loop where a signed-out user remains on the dashboard as a fallback "VIEWER" by executing an explicit full browser reload via `window.location.href = "/login"`.
2. **Instant Visual Feedback (<16ms):** Render an inline spinning `Loader2` icon and transition the copy from "Keluar (Sign Out)" to "Keluar..." immediately upon click.
3. **Double-Click & Thrashing Prevention:** Disable the sign-out trigger with `pointer-events-none opacity-70` during the pending network request to prevent concurrent signout triggers.
4. **Complete Client Memory Wipe:** Ensure all in-memory Zustand store data, React component state, and RSC router cache are discarded upon session termination.

---

## 2. User Experience Flow & Lifecycle

```
[User clicks "Keluar (Sign Out)"]
            │
            ▼
[Set isLoggingOut = true] ──▶ Button shows Loader2 spinner + "Keluar..." + disabled
            │
            ▼
[await signOut({ redirect: false })] ──▶ NextAuth clears session cookies via /api/auth/signout
            │
            ▼
[window.location.href = "/login"] ──▶ Hard browser navigation
            │
            ▼
[Browser destroys memory/stores] ──▶ Middleware intercepts unauthenticated request ──▶ /login renders cleanly
```

### State Transitions:
| State | `isLoggingOut` | Button Text | Button Icon | Pointer Events | On Click Handler |
|---|---|---|---|---|---|
| **Idle** | `false` | "Keluar (Sign Out)" | `LogOut` | Active | Executes `handleSignOut()` |
| **Pending** | `true` | "Keluar..." | `Loader2` (spinning) | `pointer-events-none` | Early return (No-op) |
| **Error** | `false` | "Keluar (Sign Out)" | `LogOut` | Active | Toast notification: "Gagal keluar. Silakan coba lagi." |

---

## 3. Component Implementation Specification

File: `src/components/layout/UserMenuDropdown.tsx`

### 3.1 Imports Update
Add `Loader2` from `lucide-react`:
```tsx
import { ShieldCheck, LogOut, User as UserIcon, Loader2 } from "lucide-react";
```
*(Remove `useRouter` from `next/navigation` since soft navigation is no longer used).*

### 3.2 State & Handler Implementation
```tsx
export function UserMenuDropdown({ onClose }: UserMenuDropdownProps) {
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);

  const profile = getEffectiveProfile({ sessionUser: session?.user });
  const isGoogle = Boolean(session?.user?.image);

  const handleNavigateProfile = () => {
    setActiveView("profile");
    onClose();
  };

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

### 3.3 Sign-Out Button Render Logic
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

## 4. Automated Test Contracts & Regression Guards

Create `src/components/layout/userMenuSignOut.test.ts`:
```ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("UserMenuDropdown sign-out contracts & invariants", async (t) => {
  const filePath = path.resolve(process.cwd(), "src/components/layout/UserMenuDropdown.tsx");
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
      !content.includes('router.push("/login")'),
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

## 5. Acceptance Criteria Checklist

- [ ] Clicking "Keluar (Sign Out)" in `UserMenuDropdown` triggers an immediate spinner icon and changes text to "Keluar...".
- [ ] The sign-out button is disabled and `pointer-events-none` prevents duplicate clicks during sign-out.
- [ ] Session cookies are deleted via `signOut({ redirect: false })`.
- [ ] The browser hard-navigates to `/login` via `window.location.href = "/login"`, cleanly terminating in-memory stores.
- [ ] User never gets stuck on the dashboard as a fallback "Pengguna VIEWER".
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm test` passes with 0 failures across all 152 test suites.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.



