# Plan: Hard Browser Redirect on User Sign-Out

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-hard-browser-redirect-on-signout-design.md`
- **Refs:** `docs/adr/0048-hard-browser-redirect-on-signout.md`

---

## 1. Executive Summary & Objective

Resolve the sign-out redirection defect in `UserMenuDropdown.tsx` by replacing soft-navigation (`router.push('/login')` + `router.refresh()`) with an explicit hard browser redirect (`window.location.href = "/login"`). This guarantees that signed-out users are immediately ejected to the login screen, completely purges in-memory client stores/caches, eliminates the fallback "Pengguna VIEWER" state, and adds inline `Loader2` feedback during signout.

---

## 2. File Manifest & Estimated LOC

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| **Create** | `src/components/layout/userMenuSignOut.test.ts` | ~45 LOC | TDD test verifying hard redirect, removal of `router.push`, and spinner state |
| **Modify** | `src/components/layout/UserMenuDropdown.tsx` | ~20 LOC diff | Implement `isLoggingOut` state, `Loader2` indicator, and `window.location.href = "/login"` |
| **Create** | `docs/handover-hard-browser-redirect-on-signout.md` | ~150 LOC | Execution-ready handover guide with verbatim code diffs and acceptance criteria |
| **Modify** | `docs/SESSION_STATE.md` | ~20 LOC diff | Record active plan & spec readiness |

---

## 3. Phased Implementation Roadmap

### Phase 1: Test Scaffold & Structural Invariants (TDD)
- [ ] Create `src/components/layout/userMenuSignOut.test.ts`.
- [ ] Implement test cases:
  - `uses hard browser redirect to /login on sign-out`
  - `does not use router.push for sign-out navigation`
  - `renders Loader2 spinning indicator during active signout`
- [ ] Run test: `node --test src/components/layout/userMenuSignOut.test.ts` (verifying contract expectations).

### Phase 2: Component Hardening in `UserMenuDropdown.tsx`
- [ ] In `src/components/layout/UserMenuDropdown.tsx`:
  - Import `Loader2` from `'lucide-react'`.
  - Remove `useRouter` import and `const router = useRouter();`.
  - Declare state: `const [isLoggingOut, setIsLoggingOut] = useState(false);`.
  - Refactor `handleSignOut`:
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
  - Update sign-out button:
    - Pass `disabled={isLoggingOut}`.
    - Conditionally append `pointer-events-none opacity-70 cursor-wait`.
    - Render `<Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-destructive" />` when `isLoggingOut` is true.
    - Render `"Keluar..."` when `isLoggingOut` is true, otherwise `"Keluar (Sign Out)"`.

### Phase 3: Non-Negotiable Verification & Handover Documentation
- [ ] Run full test suite: `npm test` across all 152 test suites (0 failures required).
- [ ] Run build check: `npm run build:check` (`tsc --noEmit`, 0 errors required).
- [ ] Run drift check: `npm run drift:check` (verify 75/75 spec-plan pairs and invariants).
- [ ] Create execution handover guide: `docs/handover-hard-browser-redirect-on-signout.md`.
- [ ] Update `docs/SESSION_STATE.md`.
- [ ] Commit planning artifacts with standard git convention.

---

## 4. Risks, Edge Cases & Verification Strategy

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **Network Failure during Sign-Out API Request** | NextAuth `/api/auth/signout` fails due to network disconnection | Caught in `try / catch`, resets `isLoggingOut = false`, displays error toast |
| **Rapid Double-Clicking (Rage-Clicking)** | Multiple simultaneous sign-out invocations | `if (isLoggingOut) return;` guard combined with `disabled` and `pointer-events-none` |
| **URL Parameter Pollution on Sign-Out** | Old view query parameters (`?mode=marcom&view=...`) carried over | Hard redirect explicitly sets destination to clean `/login` without search params |


