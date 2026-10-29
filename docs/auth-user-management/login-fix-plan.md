# Login System Bug Fix — Implementation Plan

**Date:** 2026-10-31  
**Status:** Implemented (with amendments — see §Implementation Notes)

---

## Bug Inventory

| # | Severity | Description | Root Cause |
|---|---|---|---|
| B1 | **Critical** | PENDING/REJECTED users see "Email atau password tidak sesuai" instead of the correct message | `authorize()` throws `new Error("PENDING")` — Auth.js wraps it as `CallbackRouteError` (not client-safe), client receives `?error=Configuration`, `res.error.includes("PENDING")` never matches |
| B2 | **Medium** | A user with PENDING/REJECTED status who holds a valid JWT can bypass middleware and access protected routes | `authorized()` in `auth.config.ts` only checks `!!auth?.user`, not `auth?.user?.status === "APPROVED"` |
| B3 | **Medium** | `session.user.id/role/status` are typed as required but can be `undefined` at runtime | `jwt` callback only stamps token fields when DB lookup succeeds; `session` callback guards with falsy `if (token.role)` — if lookup fails, fields are never set |
| B4 | **Low** | Admin can demote themselves to `viewer`, locking themselves out | `PATCH /api/admin/users/[id]` blocks self-deletion but not self-role or self-status modification |
| B5 | **Low** | Email case mismatch creates duplicate accounts or login failures | `register` route and `credentials authorize` store/query email as-typed; Google path always normalizes to lowercase — same person via both paths = two separate accounts |

---

## Fix Plan

### Fix B1 — Correct error signaling for PENDING/REJECTED credentials login

**Files:** `src/auth.ts`, `src/components/auth/LoginForm.tsx`

**Root cause detail:**  
Auth.js v5 has a strict client-safety filter. Only errors that are instances of
`AuthError` subclasses in the `clientErrors` set (`CredentialsSignin`,
`AccessDenied`, etc.) are forwarded to the client as-is. Any other thrown
value is wrapped in `CallbackRouteError` and re-emitted as
`?error=Configuration`. The custom `error.code` on a `CredentialsSignin`
subclass is passed through as `?code=<value>`, which surfaces as `res.code`
in the client `SignInResponse`.

**Fix in `src/auth.ts`:**

1. Import `CredentialsSignin` from `next-auth`:
```ts
import NextAuth, { CredentialsSignin } from "next-auth";
```

2. Declare two custom error classes before `NextAuth({...})`:
```ts
class PendingAccountError extends CredentialsSignin {
  code = "pending" as const;
}
class RejectedAccountError extends CredentialsSignin {
  code = "rejected" as const;
}
```

3. Replace `throw new Error("PENDING")` and `throw new Error("REJECTED")`:
```ts
// Before:
if (user.status === "PENDING") throw new Error("PENDING");
if (user.status === "REJECTED") throw new Error("REJECTED");

// After:
if (user.status === "PENDING") throw new PendingAccountError();
if (user.status === "REJECTED") throw new RejectedAccountError();
```

**Fix in `src/components/auth/LoginForm.tsx`:**

Switch from checking `res.error` (which is always `"CredentialsSignin"` now)
to checking `res.code`:

```ts
// Before:
if (res.error.includes("PENDING")) { ... }
if (res.error.includes("REJECTED")) { ... }

// After:
if (res.code === "pending") {
  setErrorMessage("Akun Anda sedang menunggu persetujuan administrator...");
} else if (res.code === "rejected") {
  setErrorMessage("Permintaan akun Anda tidak disetujui oleh administrator...");
} else {
  setErrorMessage("Email atau password tidak sesuai.");
}
```

Also update the `?error=CredentialsSignin` + `?code=` query param handling
for the redirect path (when `redirect: true` is used). In `queryErrorMessage`:
```ts
// Add to switch:
case "CredentialsSignin":
  if (error === "CredentialsSignin") {
    // code is a separate searchParam — read it from the URL
    // LoginPage must pass `code` prop too
  }
```

Since `LoginPage` already reads `params.error`, also read `params.code` and
pass it as a `code` prop to `LoginForm`:

```ts
// src/app/(auth)/login/page.tsx
const codeParam = params.code;
return <LoginForm pending={isPending} rejected={isRejected} error={errorParam} code={codeParam} />;
```

```ts
// LoginForm — extended queryErrorMessage:
if (error === "CredentialsSignin" && code === "pending") {
  return "Akun Anda sedang menunggu persetujuan administrator...";
}
if (error === "CredentialsSignin" && code === "rejected") {
  return "Permintaan akun Anda tidak disetujui...";
}
```

---

### Fix B2 — Enforce APPROVED status in middleware `authorized()` callback

**File:** `src/auth.config.ts`

**Fix:**
```ts
// Before:
callbacks: {
  authorized({ auth }) {
    return !!auth?.user;
  },
},

// After:
callbacks: {
  authorized({ auth }) {
    if (!auth?.user) return false;
    // Allow only APPROVED users through middleware.
    // PENDING / REJECTED users are redirected to /login.
    return auth.user.status === "APPROVED";
  },
},
```

**Important:** `auth.config.ts` is used by the middleware (Edge runtime). The
`status` field is available on `auth.user` because it is stamped into the JWT
by `src/auth.ts` `jwt` callback and exposed via `session` callback. The
middleware reads it from the JWT directly — no DB call is made at this point.

**Side effect:** Any user whose status was changed from `APPROVED` to
`PENDING` or `REJECTED` by an admin will be automatically logged out on their
next request (JWT is valid but `authorized()` returns false → redirect to
`/login`). This is the correct security behavior.

---

### Fix B3 — Harden JWT and session callbacks against missing DB lookup

**File:** `src/auth.ts`

**Problem:** In the `jwt` callback, the Google path does a DB lookup. If it
returns `null` (deleted user, email mismatch), `token.id/role/status` are never
set. The `session` callback then silently skips them (`if (token.role)`),
producing a session with missing required fields.

**Fix in `jwt` callback:**
```ts
async jwt({ token, user }) {
  if (user) {
    const u = user as { id?: string; role?: UserRole; status?: UserStatus; email?: string | null };

    if (u.role && u.status) {
      // Credentials path: role and status already hydrated in authorize()
      token.id = u.id ?? "";
      token.role = u.role;
      token.status = u.status;
    } else if (u.email) {
      // Google path: hydrate from DB
      const dbUser = await prisma.user.findUnique({
        where: { email: u.email.toLowerCase().trim() },
      });
      if (dbUser) {
        token.id = dbUser.id;
        token.role = normalizeRole(dbUser.role);
        token.status = normalizeStatus(dbUser.status);
      } else {
        // DB user not found — deny the session by returning null token
        // Auth.js interprets null JWT as "session invalid"
        return null;
      }
    }
  }
  return token;
},
```

Returning `null` from the `jwt` callback causes Auth.js to clear the session
cookie and effectively log the user out, which is the safest fallback.

**Fix in `session` callback:** Remove falsy guards — fields are now guaranteed
by the `jwt` callback or the session won't exist:
```ts
session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.role = token.role as UserRole;
    session.user.status = token.status as UserStatus;
  }
  return session;
},
```

---

### Fix B4 — Block admin self-modification in PATCH handler

**File:** `src/app/api/admin/users/[id]/route.ts`

**Fix:** Add self-modification guard after the `id` is resolved:
```ts
const { id } = await params;

// Prevent admin from modifying their own account via this endpoint
if (id === session.user.id) {
  return NextResponse.json(
    { error: "Tidak dapat mengubah akun Anda sendiri melalui panel ini." },
    { status: 400 }
  );
}
```

This covers both self-role-change and self-status-change in one guard, and
is consistent with the existing self-deletion guard in `DELETE`.

---

### Fix B5 — Normalize email to lowercase throughout auth flow

**Files:** `src/app/api/auth/register/route.ts`, `src/auth.ts`

**Fix in `src/app/api/auth/register/route.ts`:**
```ts
// After Zod parse:
const { name, password } = parsed.data;
const email = parsed.data.email.toLowerCase().trim(); // normalize

// Existing duplicate check and prisma.user.create use the normalized email
```

**Fix in `src/auth.ts` credentials `authorize()`:**
```ts
// After Zod parse:
const email = parsed.data.email.toLowerCase().trim(); // normalize
const password = parsed.data.password;

const user = await prisma.user.findUnique({ where: { email } });
```

This ensures that:
- `alice@company.com`, `Alice@Company.COM`, `ALICE@COMPANY.COM` all map to
  the same DB record.
- Credentials and Google paths both normalize consistently — no duplicate
  accounts from mixed-case registrations.

---

## Affected Files Summary

| File | Bugs Fixed | Change Type |
|---|---|---|
| `src/auth.ts` | B1, B3, B5 | Modify |
| `src/auth.config.ts` | B2 | Modify |
| `src/components/auth/LoginForm.tsx` | B1 | Modify |
| `src/app/(auth)/login/page.tsx` | B1 | Modify (add `code` prop) |
| `src/app/api/auth/register/route.ts` | B5 | Modify |
| `src/app/api/admin/users/[id]/route.ts` | B4 | Modify |

---

## Test Updates Required

| File | Update |
|---|---|
| `src/lib/server/auth-helpers.test.ts` | No change — `handleGoogleSignInLogic` is unaffected |
| New: `src/auth.test.ts` or inline | Add unit tests for `PendingAccountError` / `RejectedAccountError` code values |
| New: test for B2 | Confirm `authorized()` returns false for PENDING/REJECTED sessions |
| New: test for B5 | Confirm register normalizes email before DB write |

---

## Acceptance Criteria

| # | Criteria |
|---|---|
| AC-1 | PENDING user submitting credentials login sees "Akun Anda sedang menunggu persetujuan..." — not "Email atau password tidak sesuai" |
| AC-2 | REJECTED user submitting credentials login sees the rejection message |
| AC-3 | PENDING user with a valid JWT cookie is redirected to `/login` on next request (middleware blocks) |
| AC-4 | REJECTED user with a valid JWT cookie is redirected to `/login` on next request |
| AC-5 | APPROVED user with valid JWT is not affected — all protected routes remain accessible |
| AC-6 | Google sign-in for PENDING user redirects to `/login?pending=1` with correct banner |
| AC-7 | Admin cannot PATCH their own user record — returns 400 |
| AC-8 | Registering with "Alice@Company.COM" and logging in with "alice@company.com" succeeds |
| AC-9 | Registering with email and then linking same email via Google does not create a second account |
| AC-10 | Google JWT lookup uses lowercased email — no duplicate account from case mismatch |
| AC-11 | If DB user not found during JWT hydration, session is invalidated (null token) |
| AC-12 | All 549 existing tests continue to pass |
| AC-13 | `auth-helpers.test.ts` 9 existing tests still pass |

---

## Implementation Notes

Implemented on 2026-10-31. Verification: `npm test` → 569 pass / 0 fail, `npm run build:check` → 0 errors, `npm run drift:check` → no drift.

### Amendments to the original plan

1. **B2 required a `session` callback in `auth.config.ts`.** The middleware builds
   its own instance with `NextAuth(authConfig)`, which does not inherit the
   `session` callback from `src/auth.ts`. Auth.js' default session only exposes
   `name`, `email`, and `image`, so `auth.user.status` would always have been
   `undefined` and every session (including APPROVED) would have been rejected.
   The token → session mapping now lives in `auth.config.ts` and is inherited by
   `src/auth.ts` through `...authConfig.callbacks`.

2. **B2 required login/register redirect guards to avoid an infinite loop.**
   `/login` redirected any existing session to `/`, while middleware now sends
   non-APPROVED sessions back to `/login`. `/login` only redirects APPROVED
   sessions and renders the PENDING/REJECTED banner from the session status.
   `/register` routes non-APPROVED sessions to `/login`.

3. **`CredentialsSignin` is imported from `@auth/core/errors`, not `next-auth`.**
   `next-auth` re-exports the exact same class, but its barrel imports
   `next/server`, which `node:test` cannot resolve. The subpath import keeps the
   error classes unit-testable and shares the single `@auth/core` instance that
   `next-auth` uses, so `instanceof AuthError` checks still pass.

4. **B3 hardening also invalidates incomplete tokens on session refresh.**
   Tokens without `id`/`role`/`status` return `null` from the `jwt` callback,
   which makes Auth.js clear the cookie instead of exposing a session with
   `undefined` required fields.

### Test coverage added

- `src/lib/server/auth-helpers.test.ts`: `normalizeEmail`, `PendingAccountError` /
  `RejectedAccountError` codes, `resolveJwtClaims` (credentials, Google, missing
  user, missing identity).
- `src/auth.config.test.ts`: `authorized()` rejects unauthenticated/PENDING/
  REJECTED and allows APPROVED; `session()` maps `id`/`role`/`status`.

### Known limitation

Normalization applies to new writes and lookups. Pre-existing database rows with
mixed-case emails are not migrated; if such rows exist they must be normalized
with a one-off SQL update before case-insensitive login can find them.
