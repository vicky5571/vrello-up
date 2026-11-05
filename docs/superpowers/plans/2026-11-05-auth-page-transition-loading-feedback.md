# Plan: Auth Page Transition Loading Feedback via React useTransition

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-auth-page-transition-loading-feedback-design.md`
- **Refs:** `docs/adr/0044-auth-page-transition-loading-feedback.md`

---

## 1. Executive Summary & Objective

Provide tactile, zero-delay visual loading feedback when users switch between the `/login` and `/register` pages by introducing an atomic `<AuthSwitchLink />` component powered by React 19 `useTransition()` and Next.js 15 `useRouter()`.

### Key Outcomes:
- **Instant Reaction:** Immediate spinner and descriptive text ("Membuka pendaftaran..." / "Membuka halaman masuk...") upon click (<16ms).
- **Double Navigation Prevention:** Automatic `pointer-events-none` and `cursor-wait` during pending transitions to eliminate rage-clicking and duplicated RSC fetches.
- **Zero External Dependencies:** Built entirely with native React 19 and Next.js primitives without bloating the bundle.

---

## 2. File Manifest & Estimated LOC

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| **Create** | `src/components/auth/AuthSwitchLink.tsx` | ~45 LOC | Atomic button/link component wrapping `useTransition` + `useRouter` with spinner & state styling |
| **Create** | `src/components/auth/authSwitchLink.test.ts` | ~60 LOC | Unit test validating props contract, fallback state, and pending transition behavior |
| **Modify** | `src/components/auth/LoginForm.tsx` | ~10 LOC diff | Replace `<Link href="/register">` with `<AuthSwitchLink />` |
| **Modify** | `src/components/auth/RegisterForm.tsx` | ~10 LOC diff | Replace `<Link href="/login">` with `<AuthSwitchLink />` |
| **Create** | `docs/handover-auth-page-transition-loading-feedback.md` | ~180 LOC | Execution-ready handover guide with exact snippets and verification checklist |
| **Modify** | `docs/SESSION_STATE.md` | ~25 LOC diff | Update session status to reflect active feature & handover readiness |

---

## 3. Phased Implementation Roadmap

### Phase 1: Test Scaffold & Behavioral Contract (TDD)
- [ ] Create `src/components/auth/authSwitchLink.test.ts`.
- [ ] Define test cases:
  - `renders default state with proper text and link styling`
  - `renders pending loading state with spinner and loading label`
  - `disables interaction when transition is active`
  - `invokes router.push inside startTransition callback`
- [ ] Run test with `npx tsx --test src/components/auth/authSwitchLink.test.ts` (verifying contract setup).

### Phase 2: Atomic `AuthSwitchLink` Implementation
- [ ] Create `src/components/auth/AuthSwitchLink.tsx` with `'use client'`.
- [ ] Import `useTransition` from `'react'`, `useRouter` from `'next/navigation'`, and `Loader2` from `'lucide-react'`.
- [ ] Define `AuthSwitchLinkProps`:
  ```tsx
  export interface AuthSwitchLinkProps {
    href: string;
    label: string;
    loadingLabel: string;
    className?: string;
  }
  ```
- [ ] Implement transition logic:
  ```tsx
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isPending) return;
    startTransition(() => {
      router.push(href);
    });
  };
  ```
- [ ] Implement conditional rendering for normal label vs. `Loader2` + `loadingLabel`.
- [ ] Ensure accessible keyboard interaction and styling consistent with existing auth link design.

### Phase 3: Integration into LoginForm & RegisterForm
- [ ] Update `src/components/auth/LoginForm.tsx`:
  - Import `AuthSwitchLink`.
  - Replace `<Link href="/register">Daftar sekarang</Link>` with:
    ```tsx
    <AuthSwitchLink
      href="/register"
      label="Daftar sekarang"
      loadingLabel="Membuka pendaftaran..."
    />
    ```
- [ ] Update `src/components/auth/RegisterForm.tsx`:
  - Import `AuthSwitchLink`.
  - Replace `<Link href="/login">Masuk sekarang</Link>` with:
    ```tsx
    <AuthSwitchLink
      href="/login"
      label="Masuk sekarang"
      loadingLabel="Membuka halaman masuk..."
    />
    ```

### Phase 4: Non-Negotiable Verification & Handover Documentation
- [ ] Run drift check: `npm run drift:check` (must pass 0 errors).
- [ ] Run full test suite: `npm test` (all suites must pass).
- [ ] Run typescript & build check: `npm run build:check`.
- [ ] Create execution handover artifact: `docs/handover-auth-page-transition-loading-feedback.md`.
- [ ] Update `docs/SESSION_STATE.md` with completed plan and ready-for-execution status.
- [ ] Commit all planning artifacts.

---

## 4. Risks, Edge Cases & Verification Strategy

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **RSC Network Latency / Compilation Pause** | Page switch may take 500ms+ on slow network or cold dev server | `isPending` stays true until target RSC stream arrives and mounts, showing persistent spinner |
| **Multiple Rapid Clicks (Rage-Clicking)** | Fires duplicate navigation requests, polluting router history | `pointer-events-none cursor-wait` and `if (isPending) return;` guard block secondary clicks |
| **Keyboard Accessibility** | User cannot tab or press Enter/Space to navigate | Render as native `<button type="button">` with focus-visible rings matching existing auth design |
| **Theme Compatibility** | Spinner or text unreadable in dark mode | Use Tailwind dark mode classes (`text-teal-700 dark:text-teal-400`) matching exact existing design tokens |


