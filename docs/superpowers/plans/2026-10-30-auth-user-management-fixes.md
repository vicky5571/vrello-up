# Plan: Auth User Management — Fix 4 Audit Issues

**Spec:** `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
**Date:** 2026-10-30
**Status:** Completed

---

## Background

A post-implementation audit of the auth system (all 22 phases) identified 4 deviations from the spec. This plan fixes them in strict dependency order. All fixes must leave `npm test`, `npm run build:check`, and `npm run drift:check` green after each phase.

---

## Issues Being Fixed

| # | File | Issue | Severity |
|---|------|-------|----------|
| 1 | `src/middleware.ts` | Cookie-name presence check instead of cryptographic JWT verification | Security |
| 2 | `src/types/next-auth.d.ts` | JWT fields `id?`, `role?`, `status?` typed optional instead of required | Type safety |
| 3 | `src/components/auth/RegisterForm.tsx` | 268 LOC — 18 lines over the 250-line spec limit | Spec compliance |
| 4 | `src/lib/server/mailer.test.ts` | Missing test: SMTP configured but `sendMail` rejects → catch swallows silently | Test coverage |

---

## Sequencing Rules

1. Fix **Issue 2** (`next-auth.d.ts`) before **Issue 1** (middleware) — the middleware rewrite reads `auth()` which depends on typed JWT fields.
2. Fix **Issue 3** (RegisterForm LOC) independently — no dependencies on 1 or 2.
3. Fix **Issue 4** (mailer test) independently — no dependencies on any other fix.
4. Run the full gate suite (`npm test && npm run build:check && npm run drift:check`) after **all 4 phases** complete.

Recommended order: **Phase 1 → Phase 2 → Phase 3 → Phase 4 → Gate**.

---

## Phase 1 — Fix `next-auth.d.ts`: Make JWT fields required

**File:** `src/types/next-auth.d.ts`
**Why first:** The `auth()` callback in `src/auth.ts` assigns `token.id`, `token.role`, `token.status` unconditionally in the `jwt` callback. Making them required in the type declaration removes the need for `if (token.id)` guards in the `session` callback and makes `src/auth.ts` type-correct without casting.

### What to change

The two JWT module declarations currently have optional fields:

```ts
// BEFORE (both @auth/core/jwt and next-auth/jwt blocks)
interface JWT {
  id?: string;
  role?: UserRole;
  status?: UserStatus;
}
```

Change both to required:

```ts
// AFTER
interface JWT {
  id: string;
  role: UserRole;
  status: UserStatus;
}
```

The `next-auth` `User` interface augmentation (`role?: UserRole; status?: UserStatus;`) stays optional — those fields are optional on the raw provider user object before the `jwt` callback runs.

### Expected side-effect in `src/auth.ts`

The `session` callback currently guards with `if (token.id)` because TypeScript sees the fields as possibly undefined. After making them required, those guards become unnecessary but are still valid TypeScript (truthy check on a string is fine). **Do not touch `src/auth.ts` in this phase** — leave the guards in place; they are harmless and removing them is scope creep.

### Checklist

- [x] Open `src/types/next-auth.d.ts`
- [x] In the `@auth/core/jwt` block: remove `?` from `id`, `role`, `status`
- [x] In the `next-auth/jwt` block: remove `?` from `id`, `role`, `status`
- [x] Save and run `npm run build:check` — must exit 0
- [x] Run `npm test` — must stay at 702 pass, 0 fail

---

## Phase 2 — Fix `src/middleware.ts`: Proper JWT verification via Auth.js v5 pattern

**File:** `src/middleware.ts` (rewrite)
**New file:** `src/auth.config.ts` (create)

### Why `next-auth/middleware` cannot be used

`next-auth/middleware` was the v4 export. In Auth.js v5 (`next-auth@5.0.0-beta.32`) that module **throws a `ReferenceError` at import time** — it is explicitly deprecated and removed. The v5 equivalent is to export `auth` as middleware directly from your `NextAuth()` config.

### The edge-compatibility constraint

`src/auth.ts` imports Prisma (`@/lib/db`), which is a Node.js-only library. Next.js middleware runs on the **Edge runtime**, which cannot load Node.js modules. Importing `src/auth.ts` directly in `middleware.ts` would crash at build time.

**The Auth.js v5 solution** (documented at authjs.dev/getting-started/migrating-to-v5#edge-compatibility) is to split the config:

1. **`auth.config.ts`** — edge-safe config: providers list + pages, **no Prisma, no DB calls**. Exports a plain `NextAuthConfig` object.
2. **`auth.ts`** — full config: imports `auth.config.ts`, adds the `signIn`/`jwt`/`session` callbacks that use Prisma. Exports `{ handlers, signIn, signOut, auth }` as before.
3. **`middleware.ts`** — imports only `auth.config.ts`, calls `NextAuth(authConfig).auth` to get a middleware function that cryptographically verifies the JWT without touching the DB.

### Files to create / modify

#### A. Create `src/auth.config.ts`

Edge-safe subset of the current `src/auth.ts` config. Contains:
- `providers: [Credentials({ credentials }), Google({ ... })]` — declared but with **no `authorize` callback** (authorize runs server-side only; the middleware only needs to know the providers exist for cookie/token recognition)
- `pages: { signIn: "/login", error: "/login" }`
- `secret` fallback

Does **not** contain: `signIn` callback, `jwt` callback, `session` callback, any Prisma import.

```ts
// src/auth.config.ts
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Credentials({ credentials: { email: {}, password: {} } }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret:
    process.env.AUTH_SECRET ?? "vrello-auth-development-secret-32-chars-long",
  trustHost: true,
} satisfies NextAuthConfig;
```

#### B. Modify `src/auth.ts`

Spread `authConfig` into the `NextAuth()` call and keep all existing callbacks. Replaces the inline `providers` + `pages` + `secret` + `trustHost` with `...authConfig`.

```ts
// src/auth.ts (top additions only)
import authConfig from "./auth.config";
// ...
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,        // <-- spread edge-safe config
  // signIn, jwt, session callbacks stay here unchanged
  callbacks: { ... },
});
```

The `providers`, `pages`, `secret`, `trustHost` fields are removed from `src/auth.ts` directly (they now come from `authConfig`). The `Credentials`, `Google` imports move to `auth.config.ts` and are removed from `auth.ts`.

#### C. Rewrite `src/middleware.ts`

```ts
// src/middleware.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!login|register|api/auth|_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};
```

This creates a second `NextAuth` instance (edge-safe, no Prisma) whose sole job is JWT verification. The JWT is signed with `AUTH_SECRET`; the middleware verifies the signature and redirects to `/login` if invalid or absent. This is exactly what the spec §8 and ADR #3 require.

### Checklist

- [x] Create `src/auth.config.ts` with the edge-safe config object
- [x] In `src/auth.ts`: add `import authConfig from "./auth.config"`, spread it into `NextAuth({...authConfig, callbacks: {...}})`, remove the now-duplicate `providers`, `pages`, `secret`, `trustHost` fields, remove `Credentials` and `Google` imports (they move to `auth.config.ts`)
- [x] Rewrite `src/middleware.ts` to use `NextAuth(authConfig).auth` as the middleware export
- [x] Run `npm run build:check` — must exit 0
- [x] Run `npm test` — must stay at 702 pass, 0 fail
- [x] Manually verify: visiting `http://localhost:3000` without a session redirects to `/login`

---

## Phase 3 — Fix `RegisterForm.tsx`: Extract success state into `RegisterSuccess.tsx`

**Current:** `src/components/auth/RegisterForm.tsx` — 268 LOC (18 over the 250-line spec limit)
**Fix:** Extract the `isSuccess` branch (lines 85–107) into a new `src/components/auth/RegisterSuccess.tsx` component.

### Why this is the right extraction point

The `if (isSuccess) { return (...) }` branch at line 85 is self-contained — it receives no props from the form's state other than a boolean trigger, and it renders a completely different UI (success card, no form fields). It is the textbook candidate for extraction.

### New file: `src/components/auth/RegisterSuccess.tsx`

```tsx
// src/components/auth/RegisterSuccess.tsx
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function RegisterSuccess() {
  return (
    <div className="w-full bg-card border border-border/80 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-6 sm:p-8 text-center space-y-6">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Pendaftaran Berhasil Dikirim!
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Akun Anda telah dibuat dan saat ini sedang menunggu persetujuan dari
          administrator. Anda akan menerima notifikasi email setelah akun
          disetujui.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors shadow-md shadow-primary/20 items-center justify-center"
      >
        Kembali ke Halaman Masuk
      </Link>
    </div>
  );
}
```

### Changes to `RegisterForm.tsx`

1. Remove the `CheckCircle2` import from lucide (it moves to `RegisterSuccess.tsx`)
2. Add `import { RegisterSuccess } from "./RegisterSuccess"`
3. Replace the `if (isSuccess) { return (...) }` block (lines 85–107) with: `if (isSuccess) { return <RegisterSuccess />; }`

Expected result: `RegisterForm.tsx` drops from 268 → ~245 LOC. `RegisterSuccess.tsx` is ~30 LOC. Both under 250.

### Checklist

- [x] Create `src/components/auth/RegisterSuccess.tsx` with the extracted JSX
- [x] In `RegisterForm.tsx`: add import, replace the success block with `<RegisterSuccess />`, remove `CheckCircle2` from lucide import
- [x] Run `wc -l src/components/auth/RegisterForm.tsx` — must be ≤ 250
- [x] Run `npm run build:check` — must exit 0
- [x] Run `npm test` — must stay at 702 pass, 0 fail

---

## Phase 4 — Fix `mailer.test.ts`: Add SMTP-failure silent-catch tests

**File:** `src/lib/server/mailer.test.ts`

### What is missing

The existing 5 tests only cover the **unconfigured SMTP** path (early-return when `SMTP_HOST` is unset). None test the **configured SMTP + `sendMail` throws** path — the `try/catch` inside `sendApprovalEmail` and `sendRejectionEmail` that catches transport errors and logs without re-throwing.

### Approach: monkey-patch `nodemailer.createTransport`

The Node.js built-in test runner (`node:test`) has no `vi.mock` / `jest.mock`. The correct approach is to override `nodemailer.createTransport` in-process before the call, then restore it in `finally`:

```ts
import nodemailer from "nodemailer";

const origCreate = nodemailer.createTransport.bind(nodemailer);
// @ts-expect-error — narrow override for test purposes
nodemailer.createTransport = () => ({
  sendMail: async () => { throw new Error("ECONNREFUSED"); },
});
// ... run assertion ...
// restore in finally:
nodemailer.createTransport = origCreate;
```

Set `process.env.SMTP_HOST` to a non-empty value so the early-return guard passes and the transporter is actually invoked.

### Two new tests to add

**Test 6:** `sendApprovalEmail does not throw when sendMail rejects`
- Set `SMTP_HOST = "smtp.mailtrap.io"`
- Monkey-patch `createTransport` to return a fake with rejecting `sendMail`
- Assert `doesNotReject(() => sendApprovalEmail("x@x.com", "Test"))`
- Restore both in `finally`

**Test 7:** `sendRejectionEmail does not throw when sendMail rejects`
- Same pattern, calls `sendRejectionEmail` instead

### Checklist

- [x] Add the two tests at the end of `src/lib/server/mailer.test.ts`
- [x] Run `npm test` — must show **704 pass** (702 existing + 2 new), 0 fail
- [x] Run `npm run build:check` — must exit 0


---

## Final Gate (after all 4 phases)

Run these three commands in order. All must pass before this plan is marked complete:

```sh
npm test
npm run build:check
npm run drift:check
```

Expected results:
- `npm test` — 704 pass, 0 fail
- `npm run build:check` — exit 0, 0 errors
- `npm run drift:check` — No drift detected

Then update `SESSION_STATE.md` and `CHANGELOG.md`.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `auth.config.ts` split causes double-initialization of providers, leading to duplicate sign-in buttons | The second `NextAuth(authConfig)` in middleware only runs server-side for cookie verification — it never renders UI. No duplication visible to users. |
| Making JWT fields required breaks `src/auth.ts` type-check in the `jwt` callback | The `jwt` callback assigns `token.id = u.id` where `u.id` comes from `user as { id?: string }`. TypeScript may complain that `string \| undefined` is not assignable to `string`. Fix: use `token.id = u.id ?? ""` or add a null check before assigning. |
| monkey-patch of `nodemailer.createTransport` leaks between tests if `finally` is skipped | Always restore in `finally`, never in `catch` alone. The pattern shown above is correct. |
| Middleware rewrite breaks API routes that already handle their own auth | The matcher excludes `api/auth/**`. All other `/api/**` routes are not excluded — but they check `auth()` server-side themselves, so a redirect from middleware to `/login` would be an HTML redirect on a JSON endpoint. Add `api/(?!auth)` exclusion only if this becomes a real problem — do not add it proactively. |

---

## Commit Convention

One commit per phase:

```
fix(auth): make JWT type fields required in next-auth.d.ts
fix(middleware): replace cookie check with Auth.js v5 JWT verification
fix(register): extract RegisterSuccess component, RegisterForm < 250 LOC
test(mailer): add silent-catch tests for sendMail failure path
```
