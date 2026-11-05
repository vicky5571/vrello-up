# Spec: Auth Page Transition Loading Feedback via React useTransition

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0044-auth-page-transition-loading-feedback.md` (ADR-0044)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification defines the tactile visual loading feedback implementation when transitioning between authentication pages (`/login` and `/register`).

### Core Objectives:
1. **Instant Feedback (<16ms):** Eliminate perceived UI freezing when clicking "Daftar sekarang" (on `/login`) or "Masuk sekarang" (on `/register`) by immediately rendering a subtle spinner and active transition copy.
2. **Native React 19 Concurrent Transitions:** Utilize `useTransition()` from React 19 combined with `useRouter()` from Next.js 15, requiring zero external npm dependencies.
3. **Double-Click & Thrashing Prevention:** Guarantee that interactive links are disabled (`pointer-events-none cursor-wait`) during transition to prevent multiple asynchronous page requests from firing concurrently.
4. **Design Consistency:** Maintain exact existing typography, color tokens (`text-teal-700 dark:text-teal-400`), and accessible focus states.

---

## 2. User Experience Flow & Tactile Transitions

### 2.1 From Login to Register (`/login` -> `/register`)
1. User views `/login`. Below the submit button, the card displays:
   `Belum memiliki akun? [Daftar sekarang]`
2. User clicks **"Daftar sekarang"**.
3. **Immediate Visual Reaction:**
   - Link text smoothly transitions to inline spinner + text:
     `<Loader2 className="w-3.5 h-3.5 animate-spin inline-block mr-1.5" /> Membuka pendaftaran...`
   - Pointer events are disabled (`pointer-events-none`), preventing redundant clicks.
   - Cursor changes to `cursor-wait`.
4. Next.js fetches and compiles the `/register` RSC payload in the background.
5. As soon as the `/register` route hydrates, the registration view mounts cleanly.

### 2.2 From Register to Login (`/register` -> `/login`)
1. User views `/register`. Below the submit button, the card displays:
   `Sudah memiliki akun? [Masuk sekarang]`
2. User clicks **"Masuk sekarang"**.
3. **Immediate Visual Reaction:**
   - Link text smoothly transitions to inline spinner + text:
     `<Loader2 className="w-3.5 h-3.5 animate-spin inline-block mr-1.5" /> Membuka halaman masuk...`
   - Pointer events are disabled; duplicate submissions are blocked.
4. Next.js navigates smoothly to `/login`.

---

## 3. Component Architecture & Props Contract

### 3.1 `AuthSwitchLink` Component Specification
To adhere to the DRY principle and ensure uniform behavior across both forms, an atomic component `AuthSwitchLink` will be introduced in `src/components/auth/AuthSwitchLink.tsx`:

```tsx
export interface AuthSwitchLinkProps {
  href: string;
  label: string;
  loadingLabel: string;
  className?: string;
}
```

### 3.2 State Machine & Transition Hook
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthSwitchLink({
  href,
  label,
  loadingLabel,
  className,
}: AuthSwitchLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        "inline-flex items-center rounded font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]",
        isPending && "pointer-events-none opacity-80 cursor-wait",
        className
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

---

## 4. Integration Points in Existing Forms

### 4.1 In `LoginForm.tsx`
Replace:
```tsx
      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Belum memiliki akun?{" "}
        <Link
          href="/register"
          className="rounded font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]"
        >
          Daftar sekarang
        </Link>
      </p>
```
With:
```tsx
      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Belum memiliki akun?{" "}
        <AuthSwitchLink
          href="/register"
          label="Daftar sekarang"
          loadingLabel="Membuka pendaftaran..."
        />
      </p>
```

### 4.2 In `RegisterForm.tsx`
Replace:
```tsx
      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="rounded font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]"
        >
          Masuk sekarang
        </Link>
      </p>
```
With:
```tsx
      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Sudah memiliki akun?{" "}
        <AuthSwitchLink
          href="/login"
          label="Masuk sekarang"
          loadingLabel="Membuka halaman masuk..."
        />
      </p>
```

---

## 5. Acceptance Criteria & Non-Goals

### Acceptance Criteria
- [ ] Atomic component `AuthSwitchLink.tsx` is created in `src/components/auth/AuthSwitchLink.tsx`.
- [ ] `AuthSwitchLink` wraps `router.push()` in native React 19 `startTransition`.
- [ ] Clicking "Daftar sekarang" immediately displays `Loader2` rotating spinner and text `"Membuka pendaftaran..."`.
- [ ] Clicking "Masuk sekarang" immediately displays `Loader2` rotating spinner and text `"Membuka halaman masuk..."`.
- [ ] During transition (`isPending === true`), button is disabled and pointer-events are suppressed to prevent multiple rapid dispatches.
- [ ] Typography, text colors, and dark mode tokens match the design system 100%.
- [ ] Zero external libraries or npm dependencies are installed.
- [ ] Automated tests in `src/components/auth/authSwitchLink.test.ts` pass 100%.

### Non-Goals
- Installing third-party global progress bar libraries (e.g. nprogress).
- Modifying authentication submission logic, cookies, or backend endpoints.

---

## 6. Verification Plan

```bash
# Targeted test verifying AuthSwitchLink invariants
npx tsx --test src/components/auth/authSwitchLink.test.ts

# Invariant drift verification
npm run drift:check

# TypeScript compilation check
npm run build:check

# Full regression test suite
npm test
```

```

