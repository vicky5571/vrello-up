# ADR-0044: Auth Page Transition Loading Feedback via React useTransition

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Operations Coordinator, UX Team
- **Informed:** Core Development Team

## 1. Context & Business Problem

In Vrello Up's authentication gateway, candidates and staff frequently navigate between the login screen (`/login`) and the registration screen (`/register`). 

Currently, the footer navigation links in `LoginForm.tsx` ("Daftar sekarang") and `RegisterForm.tsx` ("Masuk sekarang") rely on standard unenhanced `next/link` components. When clicked:
1. Next.js App Router begins a client-side navigation fetching the React Server Component (RSC) payload from the server.
2. During this asynchronous fetch (which takes anywhere from 200ms to over 1 second depending on network latency and server rendering), **zero visual feedback is presented to the user**.
3. The link text remains static without any spinner, cursor alteration, or disabled state.
4. Users frequently perceive the interface as frozen or assume their click did not register, leading to multiple redundant clicks (*rage clicking*) and navigation queue thrashing.

## 2. Options Considered

### Option 1: Link-Level Tactile Feedback via React `useTransition` & `useRouter` — [CHOSEN]
- **Concept:** Replace the bare `<Link>` elements with an interactive switch button/link component (`AuthSwitchLink` or inline `useTransition`) that wraps `router.push()` in React 19's native `startTransition()`. While `isPending` is `true`, the component:
  - Displays a rotating mini-spinner (`Loader2 className="w-3.5 h-3.5 animate-spin"`).
  - Updates the text dynamically to `"Membuka pendaftaran..."` or `"Membuka halaman masuk..."`.
  - Disables pointer events (`pointer-events-none opacity-80 cursor-wait`) to prevent duplicate navigation triggers.
- **Trade-offs:**
  - *Business & Operational Continuity:* High. Immediate tactile feedback directly under the user's point of interaction.
  - *Engineering Cost & Complexity:* Minimal (~25 LOC per form or ~45 LOC in a shared helper component).
  - *Dependencies:* Zero new dependencies (utilizes native React 19 `useTransition` and Next.js 15 `useRouter`).
  - *Performance:* Zero bundle overhead; native concurrent transition keeps the UI fluid.

### Option 2: Top Loading Progress Bar on `AuthLayout`
- **Concept:** Render a 2.5px animated progress bar at the top edge of `AuthLayout.tsx` that animates during route transitions.
- **Trade-offs:**
  - *Cons:* The user's visual focal point is concentrated on the clicked link at the bottom of the card; a thin top border line is easily missed and does not indicate why the clicked button is inactive.

### Option 3: Heavy Global Progress Library (e.g. `nextjs-toploader` / `nprogress`)
- **Concept:** Install external npm packages to intercept all Next.js route transitions globally.
- **Trade-offs:**
  - *Cons:* Violates YAGNI and the project's zero-unnecessary-dependencies invariant. External navigation interceptors in Next.js 15 App Router frequently conflict with native streaming and parallel routes.

## 3. Decision

We adopt **Option 1: Link-Level Tactile Feedback via React `useTransition` & `useRouter`**.

### Architectural Directives:
1. **SSOT Component or Idiomatic Pattern:**
   - Implement tactile transition feedback on:
     - `src/components/auth/LoginForm.tsx`: Link to `/register` ("Daftar sekarang" -> spinner + "Membuka pendaftaran...").
     - `src/components/auth/RegisterForm.tsx`: Link to `/login` ("Masuk sekarang" -> spinner + "Membuka halaman masuk...").
2. **Zero-Dependency Native Implementation:**
   - Utilize React 19 `useTransition()` combined with `next/navigation`'s `useRouter()`.
   - Wrap navigation: `startTransition(() => { router.push(targetUrl); });`.
3. **Idempotency & Double-Click Prevention:**
   - While `isPending` is true, apply `disabled` state, `cursor-wait`, and `pointer-events-none` to guarantee that rapid double-clicks do not dispatch multiple parallel route requests.
4. **Visual Polish:**
   - Render `Loader2` from `lucide-react` with `w-3.5 h-3.5 animate-spin`.
   - Maintain exact font, teal text color tokens (`text-teal-700 dark:text-teal-400`), and focus rings for complete visual consistency with existing design system.

## 4. Consequences & Risks

### Positive:
- Instantaneous visual feedback (<16ms) upon user interaction, eliminating the perception of lag.
- Clean prevention of race conditions and multiple route dispatches.
- 100% adherence to zero-dependency and native React 19 / Next.js 15 standards.

### Negative / Accepted Debt:
- Links become interactive client buttons rather than raw HTML `<a>` tags for navigation (standard practice in SPA route transitions with pending states).

