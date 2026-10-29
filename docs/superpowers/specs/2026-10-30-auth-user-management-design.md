# Spec: Authentication & User Management System

**Spec ID:** `2026-10-30-auth-user-management`
**Status:** Approved
**Author:** AI Pair Programmer
**Date:** 2026-10-30
**Branch Target:** `vicky`
**ADR:** `docs/auth-user-management/adr.md`

---

## 1. Executive Summary

The current auth system is built on Google OAuth only, delivered via a modal (`LoginModal.tsx`), with a local Zustand persona switcher (`AuthSync.tsx`) that syncs session data into local state. There is no real registration, no DB-backed users, no admin approval gate, and no user management page. `TeamsModal` and `InviteModal` operate entirely on local Zustand state with no DB persistence.

This spec replaces all of the above with a complete, production-grade auth system:

1. **`/register` page** — name + email + password form (plus Google OAuth option). Creates a `User` DB record with `status: PENDING`. User cannot access the app until an admin approves their account.
2. **`/login` page** — email + password form (plus Google OAuth). NextAuth validates credentials against DB and blocks sessions for `PENDING` or `REJECTED` users with a clear message.
3. **Next.js middleware** — protects all app routes. Unauthenticated → `/login`. Non-admin → `/` if accessing `/admin/**`.
4. **`/admin/users` page** — full-page, admin-only user management. Tabs: Pending (approve/reject) / Active (role change, deactivate) / Rejected (re-approve). Email notification on approval and rejection.
5. **Cleanup** — delete `LoginModal`, `AuthSync`, `TeamsModal`, `InviteModal`, `ShareModal`. Remove persona-switcher UI from `UserMenuDropdown` and `SettingsModal`. Remove "Invite" rail item and update "Teams" rail item to navigate to `/admin/users`.

System remains single-tenant. `User` is a new first-class Prisma model.

---

## 2. UX Flow

### 2.1 Registration

```
Visitor → /register
  Option A: Email + Password form
    → validate client-side (Zod): name required, email valid, password ≥ 8 chars, passwords match
    → POST /api/auth/register
        201 → replace form with success message:
              "Registration submitted. An admin will review your account.
               You'll receive an email once approved."
        409 → "An account with this email already exists." (inline error)
        422 → field-level validation errors (inline)

  Option B: "Continue with Google"
    → NextAuth Google OAuth flow
    → signIn() callback: first time? → create User { status: PENDING }
    → redirect → /login?pending=1
    → show amber notice: "Account submitted. Awaiting admin approval."
```

### 2.2 Login

```
Visitor → /login
  Option A: Email + Password
    → POST to NextAuth Credentials provider
        PENDING  → error banner: "Your account is awaiting admin approval."
        REJECTED → error banner: "Your account access has been denied. Contact the admin."
        wrong pw → inline error: "Invalid email or password."
        APPROVED → session issued → redirect /

  Option B: "Continue with Google"
    → NextAuth Google OAuth signIn callback
        PENDING  → no session → redirect /login?pending=1 (amber notice)
        REJECTED → no session → redirect /login?rejected=1 (red notice)
        APPROVED → session issued → redirect /

  Query param notices (no session required to see):
    ?pending=1  → amber info box: "Account pending admin approval."
    ?rejected=1 → red info box:   "Account access denied. Contact admin."
```

### 2.3 App Access (Middleware)

```
Any request to app route
  → getToken(req)
      no token  → redirect /login
      has token → request continues (status APPROVED is guaranteed by session issuance)

Any request to /admin/**
  → token.role !== "ADMIN" → redirect /
```

### 2.4 User Management (`/admin/users`)

```
Admin → /admin/users
  → Tab: Pending
      List: Avatar | Name | Email | Registered date | [Approve] [Reject]
      Approve → PATCH status:APPROVED → approval email → row moves to Active tab
      Reject  → inline reason input → confirm → PATCH status:REJECTED → rejection email → row moves to Rejected tab

  → Tab: Active
      List: Avatar | Name | Email | Role (editable) | Last Login | [Deactivate]
      Role change → inline <select> → PATCH role:... → optimistic update
      Deactivate  → PATCH status:REJECTED (no email)
      (Cannot deactivate self)

  → Tab: Rejected
      List: Avatar | Name | Email | Registered date | [Re-approve]
      Re-approve → PATCH status:APPROVED → approval email → row moves to Active tab
```

### 2.5 Sign Out

```
Any authenticated user → UserMenuDropdown → "Sign Out"
  → signOut({ redirect: false })
  → redirect /login
```

---

## 3. SSOT Schema — `src/types/index.ts`

### 3.1 Keep existing `UserRole` as lowercase (ADR #7)

```ts
// UNCHANGED — do not alter casing
export type UserRole = "admin" | "staff" | "viewer";
```

### 3.2 Add `UserStatus`

```ts
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";
```

### 3.3 Add `AppUser` interface (DB-backed users for auth/admin system)

```ts
/**
 * DB-backed user for the auth and admin management system.
 * Distinct from the existing `User` interface (task assignee context).
 */
export interface AppUser {
  id:          string;
  name:        string;
  email:       string;
  avatar:      string;
  role:        UserRole;        // lowercase, normalized from Prisma enum
  status:      UserStatus;
  createdAt:   string;          // ISO 8601 string
  lastLoginAt: string | null;   // ISO 8601 string or null
}
```

> **Note:** The existing `User` interface is NOT changed or removed. It serves task assignees and marcom context (Zustand store, task comments, etc.). `AppUser` is exclusively for the auth and user management system.

### 3.4 NextAuth type augmentation — `src/types/next-auth.d.ts` (new file)

```ts
import type { UserRole, UserStatus } from "@/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:     string;
      role:   UserRole;
      status: UserStatus;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id:     string;
    role:   UserRole;
    status: UserStatus;
  }
}
```

---

## 4. Prisma Schema — New `User` Model

Add to `prisma/schema.prisma`:

```prisma
enum DbUserRole {
  ADMIN
  STAFF
  VIEWER
}

enum DbUserStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id          String       @id @default(cuid())
  name        String
  email       String       @unique
  password    String?                          // null for Google OAuth-only users
  googleId    String?      @unique
  avatar      String       @default("")
  role        DbUserRole   @default(STAFF)
  status      DbUserStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  lastLoginAt DateTime?

  @@index([status])
  @@index([role])
}
```

> **Naming:** Prisma enums are prefixed `Db` (`DbUserRole`, `DbUserStatus`) to avoid name collision with the existing TypeScript union types in `src/types/index.ts`. The API layer normalizes `.toLowerCase()` when building `AppUser` DTOs.

> **Single-tenant invariant:** `User` has no `workspaceId`, `branchId`, or org scoping — consistent with the single-tenant design of the entire system.

Migration name: `add_user_auth_model`

---

## 5. Pure Logic Function Signatures

### `src/lib/server/auth-helpers.ts` (new)

```ts
/**
 * Hash a plain-text password. Cost factor 12.
 * Returns a bcrypt hash string.
 */
export async function hashPassword(plain: string): Promise<string>

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true if match, false otherwise.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean>

/**
 * Normalize a Prisma DbUserRole enum value to the TypeScript UserRole union (lowercase).
 * "ADMIN" → "admin", "STAFF" → "staff", "VIEWER" → "viewer"
 */
export function normalizeRole(dbRole: DbUserRole): UserRole

/**
 * Normalize a Prisma DbUserStatus enum value to the TypeScript UserStatus union.
 * "PENDING" → "PENDING", etc. (pass-through, same casing)
 */
export function normalizeStatus(dbStatus: DbUserStatus): UserStatus

/**
 * Build an AppUser DTO from a Prisma User record.
 */
export function toAppUser(prismaUser: PrismaUser): AppUser
```

### `src/lib/server/mailer.ts` (new)

```ts
/**
 * Send account approval notification email.
 * No-ops silently if SMTP_HOST is not configured.
 * Never throws — email failure must not break API response.
 */
export async function sendApprovalEmail(to: string, name: string): Promise<void>

/**
 * Send account rejection notification email.
 * No-ops silently if SMTP_HOST is not configured.
 * Never throws.
 */
export async function sendRejectionEmail(
  to: string,
  name: string,
  reason?: string
): Promise<void>
```

---

## 6. API Contracts

### `POST /api/auth/register`

```
Auth:    None (public)
Body:    { name: string; email: string; password: string }
Zod:     name: min 1 char; email: valid email; password: min 8 chars

201:     { message: "Registration submitted. Awaiting admin approval." }
409:     { error: "An account with this email already exists." }
422:     { error: "Validation failed.", issues: ZodIssue[] }
500:     { error: "Internal server error." }
```

### `GET /api/admin/users`

```
Auth:    Session required + role === "admin"
Query:   status?: "PENDING" | "APPROVED" | "REJECTED"
         page?: number (default 1)
         limit?: number (default 20)

200:     { users: AppUser[]; total: number; page: number; totalPages: number }
401:     { error: "Unauthorized." }
403:     { error: "Forbidden. Admin role required." }
```

### `PATCH /api/admin/users/[id]`

```
Auth:    Session required + role === "admin"
Body:    { status?: UserStatus; role?: UserRole }
         (at least one field required)

200:     { user: AppUser }
400:     { error: "No fields to update." }
401:     { error: "Unauthorized." }
403:     { error: "Forbidden." }
404:     { error: "User not found." }
```

Side effects:
- `status` changed to `"APPROVED"` → `sendApprovalEmail(user.email, user.name)`
- `status` changed to `"REJECTED"` AND request body contains `reason` → `sendRejectionEmail(user.email, user.name, reason)`
- `status` changed to `"REJECTED"` without `reason` → no email (used for deactivate action)

### `DELETE /api/admin/users/[id]`

```
Auth:    Session required + role === "admin"
Body:    None

200:     { message: "User deleted." }
400:     { error: "Cannot delete your own account." }
401:     { error: "Unauthorized." }
403:     { error: "Forbidden." }
404:     { error: "User not found." }
```

---

## 7. NextAuth Config Changes (`src/auth.ts`)

```ts
providers: [
  Credentials({
    credentials: {
      email:    { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      // 1. Validate shape with Zod
      // 2. Find User by email in Prisma → null → return null (generic error)
      // 3. Check status:
      //      PENDING  → throw new Error("PENDING")
      //      REJECTED → throw new Error("REJECTED")
      // 4. Compare bcrypt password → mismatch → return null
      // 5. prisma.user.update lastLoginAt = now()
      // 6. Return { id, name, email, image: avatar, role: normalizeRole(role), status: normalizeStatus(status) }
    },
  }),
  Google({
    clientId:     process.env.AUTH_GOOGLE_ID     ?? "development-google-client-id",
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "development-google-client-secret",
  }),
],
pages: {
  signIn: "/login",
  error:  "/login",
},
callbacks: {
  async signIn({ user, account }) {
    // Only runs for Google OAuth (Credentials authorize() handles its own blocking)
    if (account?.provider === "google") {
      const existing = await prisma.user.findUnique({ where: { email: user.email! } });
      if (!existing) {
        // First-time Google sign-in → create PENDING user
        await prisma.user.create({
          data: { name: user.name!, email: user.email!, googleId: user.id,
                  avatar: user.image ?? "", status: "PENDING" }
        });
        return "/login?pending=1"; // Block session, redirect with notice
      }
      if (existing.status === "PENDING")  return "/login?pending=1";
      if (existing.status === "REJECTED") return "/login?rejected=1";
      // APPROVED → update lastLoginAt and allow
      await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
    }
    return true;
  },
  jwt({ token, user }) {
    if (user) {
      token.id     = user.id;
      token.role   = (user as AppUser).role;
      token.status = (user as AppUser).status;
    }
    return token;
  },
  session({ session, token }) {
    session.user.id     = token.id     as string;
    session.user.role   = token.role   as UserRole;
    session.user.status = token.status as UserStatus;
    return session;
  },
},
```

---

## 8. Middleware (`src/middleware.ts`)

```ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Match everything except public auth routes, Next.js internals, and static files
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
```

For `/admin/**` route protection (role check), the server component `src/app/admin/users/page.tsx` performs an explicit `auth()` check and redirects non-admins. The middleware only enforces authentication presence (token exists).

---

## 9. Component Architecture

### New files

```
src/app/(auth)/
  layout.tsx                          ← standalone layout (no sidebar/rail/topnav)
  login/
    page.tsx                          ← server component shell
  register/
    page.tsx                          ← server component shell

src/app/admin/
  users/
    page.tsx                          ← server component, auth check, initial data fetch

src/components/auth/
  LoginForm.tsx                       ← client component (<250 LOC)
  RegisterForm.tsx                    ← client component (<250 LOC)

src/components/views/UsersView/
  UsersView.tsx                       ← coordinator client component (<250 LOC)
  UsersPendingTab.tsx                 ← pending list + approve/reject actions
  UsersActiveTab.tsx                  ← active list + role editor + deactivate
  UsersRejectedTab.tsx                ← rejected list + re-approve action
  UserStatusBadge.tsx                 ← shared status pill badge
  UserRoleSelect.tsx                  ← shared inline role <select>

src/lib/server/
  auth-helpers.ts                     ← hashPassword, verifyPassword, toAppUser, normalizeRole
  mailer.ts                           ← sendApprovalEmail, sendRejectionEmail

src/app/api/auth/
  register/
    route.ts                          ← POST /api/auth/register

src/app/api/admin/
  users/
    route.ts                          ← GET /api/admin/users
    [id]/
      route.ts                        ← PATCH + DELETE /api/admin/users/[id]

src/types/
  next-auth.d.ts                      ← NextAuth session type augmentation
```

### Files to delete

```
src/components/modals/LoginModal.tsx
src/components/modals/InviteModal.tsx
src/components/modals/TeamsModal.tsx
src/components/modals/ShareModal.tsx
src/components/auth/AuthSync.tsx
```

### Files to modify

```
src/auth.ts                           ← rewrite (add Credentials, update callbacks, add pages config)
src/middleware.ts                     ← rewrite (currently routes to NextAuth handlers only)
src/types/index.ts                    ← add UserStatus, AppUser; keep UserRole unchanged
src/components/layout/GlobalRail.tsx  ← remove Teams modal + Invite button; add /admin/users link
src/components/layout/TopNavActionModals.tsx  ← remove Share button + ShareModal
src/components/layout/UserMenuDropdown.tsx    ← remove persona switcher section; simplify props
src/components/modals/SettingsModal.tsx       ← remove "Active Profile" tab
prisma/schema.prisma                  ← add DbUserRole, DbUserStatus, User model
prisma/seed.ts                        ← add initial ADMIN user seed
```

---

## 10. Email Notification Templates

### Approval email

```
Subject: Your Vrello account is approved
To:      <user email>

Hi <name>,

Your Vrello account has been approved. You can now sign in at:
<APP_URL>/login

Welcome to the team.

— Vrello Admin
```

### Rejection email

```
Subject: Your Vrello account request
To:      <user email>

Hi <name>,

Unfortunately your Vrello account request has not been approved.

<If reason provided:>
Reason: <reason>

If you believe this is an error, please contact your administrator.

— Vrello Admin
```

---

## 11. Environment Variables

Add to `.env.example`:

```bash
# Email (Nodemailer SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Vrello <no-reply@vrelloup.dev>"

# App URL (used in email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Seed admin credentials (used by prisma/seed.ts only)
SEED_ADMIN_EMAIL=admin@vrelloup.dev
SEED_ADMIN_PASSWORD=changeme123
```

---

## 12. Non-Goals

- No password reset / forgot password flow (out of scope for this iteration)
- No email verification before registration (admin approval is the verification gate)
- No user profile edit page for end users
- No audit log of admin actions
- No session expiry / "remember me" configuration
- No 2FA / multi-factor authentication
- No multi-organization or multi-tenant extension
- No role-based permission changes to the existing marcom guards (they use the existing lowercase `UserRole` — unchanged)

---

## 13. Dependencies to Add

| Package | Purpose | Version |
|---|---|---|
| `bcryptjs` | Password hashing (pure JS, no native bindings) | latest |
| `@types/bcryptjs` | TypeScript types | latest |
| `nodemailer` | SMTP email sending | latest |
| `@types/nodemailer` | TypeScript types | latest |

All other dependencies (NextAuth v5, Zod, Prisma, next-themes) are already installed.

---

## 14. Acceptance Criteria

### Registration
- [ ] `POST /api/auth/register` with valid body → 201, `User` created in DB with `status: PENDING`
- [ ] Duplicate email → 409 with clear error message
- [ ] Missing/invalid fields → 422 with Zod issue details
- [ ] `/register` page renders correctly in light and dark mode
- [ ] Google OAuth first-time sign-in → User created with `status: PENDING`, no session, redirected to `/login?pending=1`

### Login
- [ ] Credentials login with `status: PENDING` → no session, amber error shown
- [ ] Credentials login with `status: REJECTED` → no session, red error shown
- [ ] Credentials login with wrong password → no session, generic error shown
- [ ] Credentials login with `status: APPROVED` + correct password → session issued, redirect to `/`
- [ ] Google OAuth with `status: PENDING` → no session, `/login?pending=1` notice shown
- [ ] Google OAuth with `status: APPROVED` → session issued, redirect to `/`
- [ ] `/login` page renders correctly in light and dark mode

### Middleware
- [ ] Unauthenticated request to `/` → redirected to `/login`
- [ ] Authenticated STAFF request to `/admin/users` → redirected to `/`
- [ ] Authenticated ADMIN request to `/admin/users` → page renders
- [ ] `/login`, `/register`, `/api/auth/**` accessible without session

### User Management
- [ ] `/admin/users` Pending tab lists all `status: PENDING` users
- [ ] `/admin/users` Active tab lists all `status: APPROVED` users
- [ ] `/admin/users` Rejected tab lists all `status: REJECTED` users
- [ ] Approve action → `status: APPROVED` in DB + approval email sent
- [ ] Reject action with reason → `status: REJECTED` in DB + rejection email sent with reason
- [ ] Role change on Active tab → `role` updated in DB immediately
- [ ] Deactivate on Active tab → `status: REJECTED` in DB, no email
- [ ] Re-approve on Rejected tab → `status: APPROVED` in DB + approval email sent
- [ ] Cannot deactivate own account (ADMIN self-protection)
- [ ] Non-admin cannot access `/admin/users` (server + middleware double-gate)

### Cleanup
- [ ] `grep -rn "LoginModal\|InviteModal\|TeamsModal\|ShareModal\|AuthSync" src/` → 0 results
- [ ] `grep -rn "handleDemoLogin\|Simulate Persona\|demo persona" src/` → 0 results
- [ ] GlobalRail renders without Teams modal trigger and Invite button
- [ ] SettingsModal renders with only 2 tabs (Backup & Data, Appearance)
- [ ] UserMenuDropdown shows session user info and Sign Out only (no persona list)

### Verification Gates
- [ ] `npm run drift:check` → ✅ No drift
- [ ] `npm test` → fail 0
- [ ] `npm run build:check` → 0 TypeScript errors

---

## 15. Verification Checklist

```bash
# 1. Removed components — 0 remaining imports
grep -rn "LoginModal\|InviteModal\|TeamsModal\|ShareModal\|AuthSync" \
  src/ --include="*.tsx" --include="*.ts"

# 2. Persona switcher removed
grep -rn "handleDemoLogin\|Simulate Persona\|SEED_USERS" \
  src/components/ --include="*.tsx"

# 3. Prisma User model
npx prisma validate
npx prisma studio  # → User table visible with correct columns

# 4. TypeScript gate
npm run build:check

# 5. Test suite
npm test

# 6. Drift check
npm run drift:check

# 7. Manual smoke test (ordered)
#   a. npx prisma db seed → admin user created
#   b. Navigate to / → redirected to /login (middleware working)
#   c. Register new account → success message shown
#   d. Check DB: user status = PENDING
#   e. Try login as pending user → blocked with amber notice
#   f. Login as admin (seeded) → /admin/users loads, pending tab shows new user
#   g. Approve user → approval email sent (check SMTP / Mailtrap)
#   h. Login as approved user → session issued, lands on /
#   i. As STAFF user, navigate to /admin/users → redirected to /
#   j. Sign out → redirected to /login
```
