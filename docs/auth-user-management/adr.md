# ADR — Authentication & User Management System

> **Status:** Accepted
> **Date:** 2026-10-30
> **Scope:** 8 design and technical decisions for replacing the modal-based Google-only auth with a full credential + admin-approval auth system and a dedicated user management page.

---

## #1 — Replace Modal-Based Auth with Dedicated `/login` and `/register` Pages

**Decision:** Delete `LoginModal.tsx` and replace with standalone route pages at `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` using a shared auth layout (no sidebar, no GlobalRail, no TopNav).

**Rationale:**
- Modal-based auth is a UX anti-pattern for systems with real access control — it implies the app is accessible before signing in.
- Dedicated pages allow proper middleware protection: the app shell never renders for unauthenticated users.
- `/login` and `/register` as standalone routes align with how NextAuth's `pages.signIn` config works natively.
- The auth layout is cleanly isolated: no shared layout contamination, proper SEO meta, no flash of authenticated UI.

**Rejected alternatives:**
- Keep modal but add middleware redirect — contradictory; middleware would prevent the page from ever loading, making the modal unreachable.
- Full-page overlay on top of app — still renders the app shell, leaking UI state to unauthenticated users.

---

## #2 — Keep Both Google OAuth and Email/Password (Credentials Provider)

**Decision:** Maintain Google OAuth alongside a new NextAuth `Credentials` provider for email + password. Both paths enforce the same `status: PENDING → APPROVED` gate.

**Rationale:**
- The user explicitly requested both options.
- Credentials provider gives full control over the auth logic (status checks, `lastLoginAt` update, bcrypt comparison) without depending on an external service.
- Google OAuth remains useful for admins who prefer frictionless sign-in once their account is approved.
- Both flows converge on the same `User` Prisma model — no divergent auth state.

**Rejected alternatives:**
- Google OAuth only — removes registration form, complicates admin-approval flow (Google creates sessions immediately).
- Email/password only — removes convenience for users who already use Google Workspace accounts.

---

## #3 — Admin Approval Gate: PENDING Status Blocks Session Issuance

**Decision:** Session is only issued when `user.status === "APPROVED"`. `PENDING` and `REJECTED` users are blocked at the `authorize()` callback (Credentials) and `signIn()` callback (Google OAuth). They receive a human-readable error message, never a session.

**Rationale:**
- Blocking at session issuance is the cleanest enforcement point — no session token is ever minted for unapproved users, making middleware and client-side checks unnecessary for this case.
- The alternative (issue a limited session, then block at middleware) creates a partially trusted token that is harder to reason about and audit.
- `PENDING` users must be able to see a clear "your account is awaiting approval" message — this is handled by redirecting them to `/login?pending=1` with a visible notice, not a cryptic auth error.

**Rejected alternatives:**
- Issue session but add `status` to session claims and block at middleware — more surface area, risk of leaking app routes if middleware matcher has gaps.
- Email verification before approval — doubles the friction; admin approval already serves as the identity verification gate.

---

## #4 — Replace TeamsModal + InviteModal with a Full-Page `/admin/users` Route

**Decision:** Delete `TeamsModal.tsx` and `InviteModal.tsx`. Replace the GlobalRail "Teams" icon with a navigation link to `/admin/users`, a proper full-page server-rendered user management view with tabs: Pending / Active / Rejected.

**Rationale:**
- `TeamsModal` operated entirely on local Zustand state — no DB persistence. It is incompatible with real DB-backed user accounts.
- `InviteModal` added users to local store only — no email, no DB record. Meaningless in a real auth system.
- A full-page route scales better: server components can do auth checks and initial data fetches without client-side round trips.
- The "Teams" icon in GlobalRail already exists and is the natural navigation entry point — reusing it avoids adding new nav surface area.
- Admin-only page: visible only when `session.user.role === "ADMIN"`, enforced by both middleware redirect and server component auth check (defense in depth).

**Rejected alternatives:**
- Upgrade TeamsModal to be DB-backed but keep it as a modal — modals are hard to paginate, hard to navigate to by URL, and bad for complex admin workflows.
- Separate "Admin" nav section in sidebar — adds complexity to sidebar config; "Teams/Users" icon in GlobalRail is already the established pattern.

---

## #5 — Email Notifications via Nodemailer (SMTP), Fail-Silent in Dev

**Decision:** Use `nodemailer` for transactional emails (approval + rejection). The mailer utility (`src/lib/server/mailer.ts`) silently no-ops when `SMTP_HOST` is not set — it logs a warning but does NOT throw. Email failure never breaks the API response.

**Rationale:**
- `nodemailer` is zero-dependency-overhead: no SaaS account, no API key, works with any SMTP provider (Mailtrap, Gmail, SendGrid relay, company SMTP).
- Fail-silent guard is critical for local development: devs without SMTP config should not get 500 errors when testing approval/rejection flows.
- Email is a secondary side-effect — the primary action (status update in DB) must always succeed regardless of email outcome.
- Template is plain inline-styled HTML — no external template engine dependency.

**Rejected alternatives:**
- Resend/SendGrid API SDK — requires account + API key, adds a SaaS dependency. Nodemailer + SMTP is more portable.
- Next.js Server Actions for email — adds coupling between UI and email logic; email should be a server-side utility callable from API routes.
- React Email templates — overkill for two simple transactional emails.

---

## #6 — `bcryptjs` over `bcrypt` for Password Hashing

**Decision:** Use `bcryptjs` (pure JavaScript implementation) with cost factor 12.

**Rationale:**
- `bcrypt` (native binding) requires node-gyp and native build tooling, which breaks in many Docker and serverless environments.
- `bcryptjs` is a drop-in replacement with identical API and equivalent security — cost factor 12 provides ~300ms hash time on modern hardware, which is the standard recommendation.
- No build toolchain dependency.

**Rejected alternatives:**
- `argon2` — superior algorithm but has native binding requirement (same problem as `bcrypt`) and less widespread adoption in Next.js ecosystems.
- `crypto.subtle` (Web Crypto API) — PBKDF2 is available natively, but bcrypt's memory-hard properties are more appropriate for password hashing and bcryptjs is the established convention.

---

## #7 — `UserRole` Casing: Keep Lowercase (`"admin" | "staff" | "viewer"`) in TypeScript, Use Uppercase in Prisma Enums

**Decision:** Do NOT change the existing TypeScript `UserRole = "admin" | "staff" | "viewer"` to uppercase. Prisma enums use `ADMIN`, `STAFF`, `VIEWER` internally, but the API layer normalizes to lowercase when returning data to the client. The `AppUser` interface uses the existing lowercase `UserRole`.

**Rationale:**
- The existing `UserRole` type is referenced in ~30+ files across components, store slices, guards, and tests. Changing case causes a large-surface refactor for zero functional gain.
- Prisma enum casing is an internal DB concern — the API response DTO (`AppUser`) normalizes via `.toLowerCase()` mapping.
- The existing `User` interface (for Zustand store / task assignees) and `AppUser` interface (for DB-backed users) are kept separate: `User` for local task/marcom context, `AppUser` for the auth/admin system.

**Rejected alternatives:**
- Change all TypeScript to uppercase — causes a ~30-file ripple of changes and breakage in existing tests and guards.
- Use Prisma enums directly in frontend types — breaks the SSOT principle; Prisma types should not leak into the UI layer.

---

## #8 — `AuthSync.tsx` Removal: Components Read From `useSession()` Directly

**Decision:** Delete `AuthSync.tsx`. Components that currently read the logged-in user's name/avatar/role from Zustand (via `AuthSync` sync) will instead read directly from `useSession()` hook or receive session data as server component props.

**Rationale:**
- `AuthSync` was a workaround to bridge Google OAuth session data into Zustand's local `users[]` array — a hack that conflated demo persona simulation with real authentication.
- With real DB-backed users, the session already contains all necessary user data (`id`, `name`, `email`, `image`, `role`). No Zustand sync bridge is needed.
- Reading from `useSession()` directly is simpler, has fewer moving parts, and cannot get out of sync with the actual session state.
- Zustand `users[]` remains for task assignee display (loaded from DB/API) — it is NOT the auth identity source of truth.

**Rejected alternatives:**
- Keep `AuthSync` but make it DB-aware — adds complexity for no benefit; session already has what components need.
- Replace `AuthSync` with a React Context provider — unnecessary abstraction; `useSession()` from `next-auth/react` already is the context provider.
