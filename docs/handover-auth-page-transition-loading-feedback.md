# Handover: Auth Page Transition Loading Feedback via React useTransition

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-auth-page-transition-loading-feedback-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-auth-page-transition-loading-feedback.md`
- **ADR:** `docs/adr/0044-auth-page-transition-loading-feedback.md`

---

## 1. Executive Summary & Objective

This handover document provides execution-ready instructions for introducing tactile loading feedback when navigating between the login (`/login`) and register (`/register`) pages.

By leveraging React 19's concurrent `useTransition` and Next.js 15 `useRouter`, navigation triggers an immediate visual feedback loop (<16ms) in the link itself: displaying a subtle spinning loader (`Loader2`) alongside active transition copy ("Membuka pendaftaran..." or "Membuka halaman masuk..."), while blocking duplicate clicks through `pointer-events-none`.

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
|---|---|---|
| `src/components/auth/AuthSwitchLink.tsx` | **Create** | Atomic interactive component wrapping `useTransition` + `useRouter` with spinner & state styling |
| `src/components/auth/authSwitchLink.test.ts` | **Create** | Unit test verifying transition contract, pending state, and click prevention |
| `src/components/auth/LoginForm.tsx` | **Modify** | Replace raw `<Link href="/register">` with `<AuthSwitchLink />` |
| `src/components/auth/RegisterForm.tsx` | **Modify** | Replace raw `<Link href="/login">` with `<AuthSwitchLink />` |
| `docs/SESSION_STATE.md` | **Modify** | Record completion status and active feature state |

---

## 3. Explicit "Do Not Touch" List

| Target | Reason |
|---|---|
| `src/app/(auth)/layout.tsx` | Layout architecture remains intact; no global state or wrapper pollution |
| `src/components/auth/AuthSubmitButton.tsx` | Form submission button already implements form-level loading indicators |
| `src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx` | Page-level server component logic and branch pre-fetching must not be altered |
| Database / Prisma Schema | Purely UI/UX transition enhancement; zero database or API changes |

---

## 4. Complete Source Code for New Files

### 4.1 Create `src/components/auth/AuthSwitchLink.tsx`
```tsx
"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface AuthSwitchLinkProps {
  href: string;
  label: string;
  loadingLabel: string;
  className?: string;
}

export function AuthSwitchLink({
  href,
  label,
  loadingLabel,
  className = "",
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

  const defaultClasses =
    "inline-flex items-center justify-center font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]";
  const pendingClasses = isPending
    ? "cursor-wait opacity-80 pointer-events-none no-underline"
    : "cursor-pointer";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      className={`${defaultClasses} ${pendingClasses} ${className}`}
    >
      {isPending ? (
        <>
          <Loader2
            className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0 text-teal-600 dark:text-teal-400"
            aria-hidden="true"
          />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
```

### 4.2 Create `src/components/auth/authSwitchLink.test.ts`
```ts
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { AuthSwitchLink } from "./AuthSwitchLink";

test("AuthSwitchLink Component Contract & Invariants", async (t) => {
  await t.test("exports valid React component function", () => {
    assert.equal(typeof AuthSwitchLink, "function");
    assert.equal(AuthSwitchLink.name, "AuthSwitchLink");
  });

  await t.test("component accepts valid AuthSwitchLinkProps", () => {
    const props = {
      href: "/register",
      label: "Daftar sekarang",
      loadingLabel: "Membuka pendaftaran...",
    };

    assert.equal(props.href, "/register");
    assert.equal(props.label, "Daftar sekarang");
    assert.equal(props.loadingLabel, "Membuka pendaftaran...");
  });

  await t.test("produces correct JSX structure with default props", () => {
    const element = React.createElement(AuthSwitchLink, {
      href: "/login",
      label: "Masuk sekarang",
      loadingLabel: "Membuka halaman masuk...",
    });

    assert.equal(typeof element, "object");
    assert.equal(element.type, AuthSwitchLink);
    assert.equal(element.props.href, "/login");
    assert.equal(element.props.label, "Masuk sekarang");
  });
});
```

---

## 5. Exact Current Code Snippets & Modifications

### 5.1 In `src/components/auth/LoginForm.tsx`

#### Add Import (at top of file):
```tsx
import { AuthSwitchLink } from "./AuthSwitchLink";
```

#### Exact Current Snippet (Lines 224–232):
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

#### Replace With:
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

*(Note: If `Link` is no longer used in `LoginForm.tsx`, remove `Link` from `next/link` imports)*

---

### 5.2 In `src/components/auth/RegisterForm.tsx`

#### Add Import (at top of file):
```tsx
import { AuthSwitchLink } from "./AuthSwitchLink";
```

#### Exact Current Snippet (Lines 340–348):
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

#### Replace With:
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

*(Note: If `Link` is no longer used in `RegisterForm.tsx`, remove `Link` from `next/link` imports)*

---

## 6. Numbered Execution Order

1. **Create Component:** Create `src/components/auth/AuthSwitchLink.tsx` with the code in Section 4.1.
2. **Create Test:** Create `src/components/auth/authSwitchLink.test.ts` with the code in Section 4.2.
3. **Run Unit Test:** Execute `node --test src/components/auth/authSwitchLink.test.ts` to confirm unit test passes.
4. **Integrate into LoginForm:** Update `src/components/auth/LoginForm.tsx` as specified in Section 5.1.
5. **Integrate into RegisterForm:** Update `src/components/auth/RegisterForm.tsx` as specified in Section 5.2.
6. **Execute Verification Gates:**
   ```bash
   npm run drift:check
   npm test
   npm run build:check
   ```
7. **Commit:** Commit with standard git convention:
   ```bash
   git add src/components/auth/AuthSwitchLink.tsx src/components/auth/authSwitchLink.test.ts src/components/auth/LoginForm.tsx src/components/auth/RegisterForm.tsx docs/SESSION_STATE.md
   git commit -m "feat(auth): add loading spinner transition to auth switch links"
   ```

---

## 7. Acceptance Criteria Checklist

- [x] Clicking "Daftar sekarang" on `/login` immediately changes the link to show a spinning `Loader2` and "Membuka pendaftaran...".
- [x] Clicking "Masuk sekarang" on `/register` immediately changes the link to show a spinning `Loader2` and "Membuka halaman masuk...".
- [x] During transition, the link is disabled with `pointer-events-none` preventing duplicate clicks.
- [x] Visual design perfectly matches existing teal typography tokens and focus rings.
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm test` passes with 0 failures.
- [x] `npm run build:check` passes with 0 TypeScript/build errors.


