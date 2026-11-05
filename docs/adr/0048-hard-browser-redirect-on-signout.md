# ADR 0048: Hard Browser Redirect on User Sign-Out

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's authentication lifecycle, when an authenticated user (such as a Supervisor or Admin) clicks **"Keluar (Sign Out)"** in the top navigation profile dropdown (`UserMenuDropdown.tsx`), the application previously executed:
```tsx
await signOut({ redirect: false });
toast.success("Berhasil keluar dari akun.");
router.push("/login");
router.refresh();
onClose();
```

This implementation produced a critical user experience defect and potential security confusion:
1. **Soft-Navigation Race Condition**: Next.js App Router's `router.push('/login')` executes as a client-side soft navigation (fetching RSC payloads asynchronously). While this request was in flight, the active bidirectional URL state synchronizer (`useUrlStateSync.ts`) detected state transitions and reconciled search parameters (`?mode=marcom&view=...`), interrupting or reverting the client route change.
2. **Persistent In-Memory State**: Client-side navigation preserves in-memory React component trees, Zustand stores, and RSC router caches. When the NextAuth session token was deleted, the permission resolver (`resolveEffectivePermissionsUser`) safely resolved to the fallback local workspace member, causing the UI to demote the user to `"Pengguna VIEWER"` while remaining visibly stuck on the operational dashboard instead of redirecting to `/login`.
3. **Lack of Visual Sign-Out Feedback**: The sign-out button provided no inline loading spinner or disabled state during the asynchronous sign-out request, prompting impatient users to click repeatedly (*rage-clicking*).

To ensure complete session termination, prevent data leakage in client memory, and guarantee that the user is cleanly ejected to the `/login` screen, a robust, fail-safe redirection architecture is required.

---

## 2. Decision Drivers

1. **Guaranteed Clean Slate (Zero Memory Retention)**: Sign-out must completely purge in-memory React state, in-memory Zustand store data, and browser RSC caches.
2. **Definitive Redirection**: Navigation to `/login` must not be interceptable, reversible, or delayed by client-side router hooks (`useUrlStateSync`).
3. **Instant User Feedback**: Clicking "Keluar (Sign Out)" must immediately show a loading state (`Loader2` spinner + disabled button) preventing duplicate clicks.
4. **Architectural Simplicity**: Zero external libraries; rely on native web platform standards (`window.location.href`).

---

## 3. Options Considered

### Option 1: Explicit Hard Browser Redirect via `window.location.href = "/login"` (Chosen)
- Call `await signOut({ redirect: false })` to cleanly delete auth session cookies.
- Execute `window.location.href = "/login"`, forcing the browser to perform a full document reload.
- Add an `isLoggingOut` loading state to `UserMenuDropdown.tsx` that renders a spinner and disables pointer events during execution.
- **Pros**:
  - Full document reload destroys all in-memory React trees, resets Zustand store cache, and purges RSC router cache.
  - Bypasses Next.js App Router client routing and `useUrlStateSync` race conditions completely.
  - Industry gold standard for authentication logout flows.
  - Instant tactile feedback prevents duplicate triggers.
- **Cons**: Triggers a standard browser page reload (which is the intended behavior when logging out of a secure application).

### Option 2: Native NextAuth Redirect (`signOut({ callbackUrl: "/login" })`)
- Delegate redirection to NextAuth's native mechanism.
- **Pros**: Idiomatic NextAuth method.
- **Cons**: NextAuth redirects through its internal `/api/auth/signout` server route, which can encounter redirect issues in local reverse-proxy or Docker environments if host origin headers mismatch.

### Option 3: Manual Storage Wipe + `router.replace("/login")` (SPA-Only Navigation)
- Manually call `useWorkspaceStore.persist.clearStorage()` and navigate via `router.replace("/login")`.
- **Pros**: Smooth SPA-like transition without full reload.
- **Cons**: Severe security and operational anti-pattern. RSC cache, closure state, and in-flight API promises remain in browser memory, leaving the application vulnerable to session race conditions and state leakage.

---

## 4. Decision & Architectural Changes

We decide to implement **Option 1**:

1. **Stateful Sign-Out in `src/components/layout/UserMenuDropdown.tsx`**:
   - Add local `isLoggingOut` state:
     ```tsx
     const [isLoggingOut, setIsLoggingOut] = useState(false);
     ```
   - Update `handleSignOut`:
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
   - Update button UI:
     - Render `Loader2` (`animate-spin`) when `isLoggingOut` is true.
     - Change label to `"Keluar..."` during active request.
     - Apply `disabled={isLoggingOut}` and `pointer-events-none opacity-70` to block duplicate clicks.

2. **Remove Redundant Soft-Router Calls**:
   - Delete `router.push("/login")` and `router.refresh()` from `UserMenuDropdown.tsx`.
   - Remove unused `useRouter` import if no other handlers require it.

---

## 5. Consequences & Blast Radius

### Positive Consequences
- **100% Reliable Ejection**: User is guaranteed to land on `/login` every time sign-out is triggered.
- **Complete Memory Cleanup**: Browser context reload cleans all persistent stores, cached tokens, and DOM trees.
- **Improved UX Feedback**: Users immediately see the spinner and disabled button, removing uncertainty during the 200–400ms network deletion request.

### Accepted Trade-offs
- None. Full page reload on logout is standard enterprise web security practice.



