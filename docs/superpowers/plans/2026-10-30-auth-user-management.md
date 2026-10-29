# Plan: Authentication & User Management System

**Plan ID:** `2026-10-30-auth-user-management`
**Spec:** `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
**ADR:** `docs/auth-user-management/adr.md`
**Date:** 2026-10-30
**Est. LOC Change:** +1,150 new / -680 removed ≈ +470 net

---

## File Manifest

| Phase | Target | Files | Est. LOC Δ |
|---|---|---|---|
| 1 | Install dependencies | `package.json` | +4 deps |
| 2 | Prisma schema + migration | `prisma/schema.prisma`, `prisma/migrations/` | +35 |
| 3 | SSOT types | `src/types/index.ts`, `src/types/next-auth.d.ts` (NEW) | +25 |
| 4 | Auth helpers | `src/lib/server/auth-helpers.ts` (NEW) | +60 |
| 5 | Mailer utility | `src/lib/server/mailer.ts` (NEW) | +75 |
| 6 | NextAuth config rewrite | `src/auth.ts` | +70 |
| 7 | Register API route | `src/app/api/auth/register/route.ts` (NEW) | +65 |
| 8 | Admin users API routes | `src/app/api/admin/users/route.ts` (NEW), `.../[id]/route.ts` (NEW) | +130 |
| 9 | Middleware | `src/middleware.ts` (REWRITE) | +25 |
| 10 | Auth layout + pages | `src/app/(auth)/layout.tsx` (NEW), `login/page.tsx` (NEW), `register/page.tsx` (NEW) | +60 |
| 11 | Auth form components | `src/components/auth/LoginForm.tsx` (NEW), `RegisterForm.tsx` (NEW) | +280 |
| 12 | Admin users page | `src/app/admin/users/page.tsx` (NEW) | +45 |
| 13 | UsersView components | 6 NEW files in `src/components/views/UsersView/` | +380 |
| 14 | GlobalRail update | `src/components/layout/GlobalRail.tsx` | -50 |
| 15 | TopNavActionModals update | `src/components/layout/TopNavActionModals.tsx` | -30 |
| 16 | UserMenuDropdown cleanup | `src/components/layout/UserMenuDropdown.tsx` | -60 |
| 17 | SettingsModal cleanup | `src/components/modals/SettingsModal.tsx` | -65 |
| 18 | DELETE removed components | 5 files deleted | -680 |
| 19 | Prisma seed | `prisma/seed.ts` | +20 |
| 20 | `.env.example` update | `.env.example` | +10 |
| 21 | Tests | `src/lib/server/auth-helpers.test.ts` (NEW), `src/lib/server/mailer.test.ts` (NEW) | +90 |
| 22 | Full verification | — | — |

---

## Phase 1 — Install Dependencies

```bash
npm install bcryptjs nodemailer
npm install --save-dev @types/bcryptjs @types/nodemailer
```

- [x] `bcryptjs` added to `dependencies` in `package.json`
- [x] `nodemailer` added to `dependencies` in `package.json`
- [x] `@types/bcryptjs` added to `devDependencies`
- [x] `@types/nodemailer` added to `devDependencies`

**Checkpoint:** `npm ls bcryptjs nodemailer` → both listed without errors.

---

## Phase 2 — Prisma Schema + Migration

File: `prisma/schema.prisma`

- [x] Add enum `DbUserRole { ADMIN STAFF VIEWER }`
- [x] Add enum `DbUserStatus { PENDING APPROVED REJECTED }`
- [x] Add model `User`:
  ```prisma
  model User {
    id          String       @id @default(cuid())
    name        String
    email       String       @unique
    password    String?
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
- [x] Run migration:
  ```bash
  npx prisma migrate dev --name add_user_auth_model
  npx prisma generate
  ```

**Checkpoint:** `npx prisma validate` → OK. `npx prisma studio` → `User` table visible with all columns.

---

## Phase 3 — SSOT Types

### `src/types/index.ts`

- [x] Add `UserStatus` type (after existing `UserRole`):
  ```ts
  export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";
  ```
- [x] Add `AppUser` interface (after `UserStatus`):
  ```ts
  export interface AppUser {
    id:          string;
    name:        string;
    email:       string;
    avatar:      string;
    role:        UserRole;
    status:      UserStatus;
    createdAt:   string;
    lastLoginAt: string | null;
  }
  ```
- [x] Do NOT change existing `UserRole` or `User` interface

### `src/types/next-auth.d.ts` (new file)

- [x] Create with NextAuth session type augmentation (per spec §3.4)
- [x] Import `UserRole`, `UserStatus` from `"@/types"`
- [x] Extend `Session["user"]` with `id`, `role`, `status`
- [x] Extend `JWT` with `id`, `role`, `status`

**Checkpoint:** `npm run build:check` → 0 errors (types compile cleanly).

---

## Phase 4 — Auth Helpers (`src/lib/server/auth-helpers.ts`)

New file. Must stay ≤ 250 LOC.

- [x] Import `bcryptjs`, `prisma`, `AppUser`, `UserRole`, `UserStatus`, Prisma types
- [x] Implement `hashPassword(plain: string): Promise<string>`:
  - `return bcrypt.hash(plain, 12)`
- [x] Implement `verifyPassword(plain: string, hash: string): Promise<boolean>`:
  - `return bcrypt.compare(plain, hash)`
- [x] Implement `normalizeRole(dbRole: DbUserRole): UserRole`:
  - Map `"ADMIN"` → `"admin"`, `"STAFF"` → `"staff"`, `"VIEWER"` → `"viewer"`
- [x] Implement `normalizeStatus(dbStatus: DbUserStatus): UserStatus`:
  - Pass-through: `"PENDING"` → `"PENDING"`, etc.
- [x] Implement `toAppUser(prismaUser): AppUser`:
  - Map all fields; call `normalizeRole` and `normalizeStatus`; convert `DateTime` to ISO string

**Checkpoint:** Unit test in Phase 21 covers all helpers. `npm run build:check` → 0 errors.

---

## Phase 5 — Mailer Utility (`src/lib/server/mailer.ts`)

New file. Must stay ≤ 250 LOC.

- [x] Import `nodemailer`
- [x] Create transporter lazily from env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- [x] Guard function `isSmtpConfigured(): boolean`:
  - Returns `Boolean(process.env.SMTP_HOST)`
- [x] Implement `sendApprovalEmail(to, name)`:
  - If `!isSmtpConfigured()` → `console.warn("[mailer] SMTP_HOST not set. Skipping approval email.")` and return
  - Build HTML body (per spec §10)
  - `transporter.sendMail(...)` wrapped in `try/catch` → log error, do NOT throw
- [x] Implement `sendRejectionEmail(to, name, reason?)`:
  - Same SMTP guard pattern
  - Include `reason` in body if provided
  - `try/catch` → log error, do NOT throw

**Checkpoint:** Unit tests in Phase 21 verify no-op behavior when `SMTP_HOST` unset.

---

## Phase 6 — NextAuth Config Rewrite (`src/auth.ts`)

- [x] Add `import Credentials from "next-auth/providers/credentials"`
- [x] Add `import { prisma } from "@/lib/db"`
- [x] Add `import { verifyPassword, normalizeRole, normalizeStatus } from "@/lib/server/auth-helpers"`
- [x] Add `import { z } from "zod"` (already installed)
- [x] Add `Credentials` provider (per spec §7):
  - Zod validate `{ email, password }`
  - Find `User` by email
  - Check `status`: PENDING → `throw new Error("PENDING")`, REJECTED → `throw new Error("REJECTED")`
  - `verifyPassword` → mismatch → `return null`
  - `prisma.user.update` → set `lastLoginAt: new Date()`
  - Return `{ id, name, email, image: user.avatar, role: normalizeRole(user.role), status: normalizeStatus(user.status) }`
- [x] Update Google provider `signIn` callback (per spec §7)
- [x] Add `pages: { signIn: "/login", error: "/login" }`
- [x] Update `jwt` callback: embed `id`, `role`, `status` from `user` into `token`
- [x] Update `session` callback: attach `id`, `role`, `status` to `session.user`
- [x] Keep existing `secret` and `trustHost` config

**Checkpoint:** `npm run build:check` → 0 errors. NextAuth config validates.

---

## Phase 7 — Register API Route

New file: `src/app/api/auth/register/route.ts`

- [x] Import `NextResponse`, `prisma`, `hashPassword` from auth-helpers, `z`
- [x] Define Zod schema:
  ```ts
  const schema = z.object({
    name:     z.string().min(1),
    email:    z.string().email(),
    password: z.string().min(8),
  });
  ```
- [x] `POST` handler:
  - Parse + validate body → 422 on failure with `issues`
  - Check existing user by email → 409 if found
  - `hashPassword(password)`
  - `prisma.user.create({ data: { name, email, password: hashed, status: "PENDING" } })`
  - Return 201 `{ message: "Registration submitted. Awaiting admin approval." }`
  - Catch Prisma unique constraint error (P2002) → 409
  - Catch all other errors → 500

**Checkpoint:** `curl -X POST localhost:3000/api/auth/register -d '{"name":"Test","email":"t@t.com","password":"12345678"}'` → 201. Second request same email → 409.

---

## Phase 8 — Admin Users API Routes

### `src/app/api/admin/users/route.ts` (new)

- [x] Import `NextRequest`, `NextResponse`, `auth`, `prisma`, `toAppUser`
- [x] `GET` handler:
  - `const session = await auth()` → 401 if no session
  - `session.user.role !== "admin"` → 403
  - Parse query params: `status`, `page` (default 1), `limit` (default 20)
  - Build Prisma `where`: `status ? { status: status.toUpperCase() } : {}`
  - `prisma.user.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } })`
  - `prisma.user.count({ where })` for total
  - Map records with `toAppUser()`
  - Return `{ users, total, page, totalPages: Math.ceil(total / limit) }`

### `src/app/api/admin/users/[id]/route.ts` (new)

- [x] Import same dependencies + `sendApprovalEmail`, `sendRejectionEmail`
- [x] `PATCH` handler:
  - Auth check: session required + role === "admin" → 401 / 403
  - Parse body Zod: `{ status?: UserStatus, role?: UserRole, reason?: string }`
  - Validate at least one of `status` or `role` is present → 400 if not
  - Find user by `id` → 404 if not found
  - Build Prisma `data`: map lowercase role to `DbUserRole`, status to `DbUserStatus`
  - `prisma.user.update({ where: { id }, data })`
  - If `status === "APPROVED"` → `sendApprovalEmail(user.email, user.name)` (don't await — fire and forget)
  - If `status === "REJECTED"` AND `reason` in body → `sendRejectionEmail(user.email, user.name, reason)`
  - Return `{ user: toAppUser(updated) }`
- [x] `DELETE` handler:
  - Auth check: session required + role === "admin" → 401 / 403
  - `id === session.user.id` → 400 "Cannot delete your own account."
  - `prisma.user.findUnique({ where: { id } })` → 404 if not found
  - `prisma.user.delete({ where: { id } })`
  - Return 200 `{ message: "User deleted." }`

**Checkpoint:** Manual test PATCH `{ status: "APPROVED" }` → DB updated, mailer log shows email attempt.

---

## Phase 9 — Middleware (`src/middleware.ts`)

- [x] Replace current content with:
  ```ts
  export { default } from "next-auth/middleware";

  export const config = {
    matcher: [
      "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico|public).*)",
    ],
  };
  ```
- [x] Note: `/admin/**` role enforcement is done inside the server component (`page.tsx`) — middleware only enforces session presence. This is the simplest correct approach (see ADR #4).

**Checkpoint:** Navigate to `http://localhost:3000/` without session → redirected to `/login`.

---

## Phase 10 — Auth Layout + Page Shells

### `src/app/(auth)/layout.tsx` (new)

- [x] Standalone layout — no `GlobalRail`, no `Sidebar`, no `TopNav`
- [x] Centered full-screen with subtle background
- [x] Include `ThemeProvider` from `next-themes` if needed for dark mode
- [x] Include `<Toaster />` from `sonner`
- [x] Simple header: app logo / name

### `src/app/(auth)/login/page.tsx` (new)

- [x] Server component
- [x] Check if session already active → redirect `/` (avoid showing login to logged-in users)
- [x] Render `<LoginForm />` client component
- [x] Pass `searchParams` (for `?pending=1`, `?rejected=1` notices)

### `src/app/(auth)/register/page.tsx` (new)

- [x] Server component
- [x] Check if session already active → redirect `/`
- [x] Render `<RegisterForm />` client component

**Checkpoint:** `/login` and `/register` render without sidebar or rail. Dark mode works.

---

## Phase 11 — Auth Form Components

### `src/components/auth/LoginForm.tsx` (new, ≤ 250 LOC)

- [x] `"use client"`
- [x] Props: `{ pending?: boolean; rejected?: boolean }` (from searchParams)
- [x] State: `email`, `password`, `isLoading`, `error`
- [x] Show amber notice if `pending` prop true
- [x] Show red notice if `rejected` prop true
- [x] Form submit → `signIn("credentials", { email, password, redirect: false })`
  - On error: map error code to human-readable message (PENDING, REJECTED, CredentialsSignin)
  - On success: `router.push("/")`
- [x] Google button → `signIn("google", { callbackUrl: "/" })`
- [x] Divider "or" between Google and form
- [x] Link to `/register`
- [x] Loading spinner on submit

### `src/components/auth/RegisterForm.tsx` (new, ≤ 250 LOC)

- [x] `"use client"`
- [x] State: `name`, `email`, `password`, `confirmPassword`, `isLoading`, `error`, `success`
- [x] Client-side Zod validation before submit:
  - name required, email valid, password ≥ 8 chars, passwords match
- [x] Form submit → `fetch("POST /api/auth/register")`
  - 201 → set `success = true` → render success state (no redirect to app)
  - 409 → inline error "Email already registered."
  - 422 → show first issue message inline
  - 500 → generic error
- [x] Google button → `signIn("google", { callbackUrl: "/" })`
  - Google path creates PENDING user → NextAuth redirects to `/login?pending=1`
- [x] Link to `/login`
- [x] Success state: replace form with confirmation message (spec §2.1)

**Checkpoint:** Register form validates client-side. Submit creates DB record. Google button redirects correctly.

---

## Phase 12 — Admin Users Page (`src/app/admin/users/page.tsx`)

New server component file. Must stay ≤ 250 LOC.

- [x] Import `auth` from `"@/auth"`, `redirect` from `"next/navigation"`, `UsersView`
- [x] `const session = await auth()` → if no session → `redirect("/login")`
- [x] `if (session.user.role !== "admin")` → `redirect("/")`
- [x] Fetch initial tab counts (3 parallel Prisma count queries via `Promise.all`):
  - `prisma.user.count({ where: { status: "PENDING" } })`
  - `prisma.user.count({ where: { status: "APPROVED" } })`
  - `prisma.user.count({ where: { status: "REJECTED" } })`
- [x] Render `<UsersView initialCounts={{ pending, active, rejected }} />`

**Checkpoint:** `/admin/users` as ADMIN → page renders. As STAFF → redirected to `/`.

---

## Phase 13 — UsersView Components

All files in `src/components/views/UsersView/`. All ≤ 250 LOC each.

### `UsersView.tsx` (coordinator, new)

- [x] `"use client"`
- [x] Props: `{ initialCounts: { pending: number; active: number; rejected: number } }`
- [x] Tab state: `"PENDING" | "APPROVED" | "REJECTED"` — default `"PENDING"` if `initialCounts.pending > 0`, else `"APPROVED"`
- [x] Fetch users per active tab via `GET /api/admin/users?status=<tab>`
- [x] Tab bar with counts (update counts from API response `total`)
- [x] Render `<UsersPendingTab>`, `<UsersActiveTab>`, or `<UsersRejectedTab>` based on active tab
- [x] Pass `onRefresh` callback to tabs (re-fetches current tab + updates counts)

### `UsersPendingTab.tsx` (new)

- [x] Props: `{ users: AppUser[]; isLoading: boolean; onAction: () => void }`
- [x] Table columns: Avatar | Name | Email | Registered | Actions
- [x] Approve button → `PATCH /api/admin/users/[id]` `{ status: "APPROVED" }` → toast success → `onAction()`
- [x] Reject button → toggles inline `<textarea>` for reason → Confirm button → `PATCH /api/admin/users/[id]` `{ status: "REJECTED", reason }` → toast → `onAction()`
- [x] Loading skeleton rows while fetching
- [x] Empty state: "No pending registrations."

### `UsersActiveTab.tsx` (new)

- [x] Props: `{ users: AppUser[]; currentUserId: string; isLoading: boolean; onAction: () => void }`
- [x] Table columns: Avatar | Name | Email | Role | Last Login | Actions
- [x] `<UserRoleSelect>` inline on each row → `PATCH /api/admin/users/[id]` `{ role }` → optimistic update → toast
- [x] Deactivate button → `PATCH /api/admin/users/[id]` `{ status: "REJECTED" }` (no reason → no email) → toast → `onAction()`
- [x] Disable Deactivate if `user.id === currentUserId` (self-protection)
- [x] `<UserStatusBadge status="APPROVED" />` in each row
- [x] Empty state: "No active users."

### `UsersRejectedTab.tsx` (new)

- [x] Props: `{ users: AppUser[]; isLoading: boolean; onAction: () => void }`
- [x] Table columns: Avatar | Name | Email | Registered | Actions
- [x] Re-approve button → `PATCH /api/admin/users/[id]` `{ status: "APPROVED" }` → toast → `onAction()`
- [x] `<UserStatusBadge status="REJECTED" />` in each row
- [x] Empty state: "No rejected users."

### `UserStatusBadge.tsx` (new)

- [x] Props: `{ status: UserStatus }`
- [x] PENDING → amber pill "Pending"
- [x] APPROVED → green pill "Active"
- [x] REJECTED → red pill "Rejected"

### `UserRoleSelect.tsx` (new)

- [x] Props: `{ value: UserRole; onChange: (role: UserRole) => void; disabled?: boolean }`
- [x] `<select>` with options: Admin | Staff | Viewer
- [x] Small, inline styling consistent with existing table UI

**Checkpoint:** All 3 tabs render users from API. Approve/reject/role-change actions update DB.

---

## Phase 14 — GlobalRail Update

File: `src/components/layout/GlobalRail.tsx`

- [x] Import `useRouter` from `"next/navigation"` and `useSession` from `"next-auth/react"`
- [x] Remove `isTeamsOpen`, `isInviteOpen` state
- [x] Remove `TeamsModal`, `InviteModal` imports
- [x] Remove `<TeamsModal>` and `<InviteModal>` renders from JSX
- [x] In `NAV_ITEMS`:
  - Remove entry: `{ id: "teams", label: "Teams", ... onClick: () => setIsTeamsOpen(true) }`
  - Add entry (admin only): `{ id: "users", label: "Users", icon: Users, onClick: () => router.push("/admin/users") }`
  - Conditionally include "Users" item only when `session?.user?.role === "admin"`
- [x] Remove "Invite" button from bottom section (`<button onClick={() => setIsInviteOpen(true)} ...>`)
- [x] Update `MoreAppsMenu` call: remove `onOpenTeams` and `onOpenInvite` props
- [x] Update `MoreAppsMenu.tsx` to remove those prop definitions and their usages internally

**Checkpoint:** GlobalRail renders without Teams/Invite. ADMIN user sees "Users" nav item; STAFF user does not.

---

## Phase 15 — TopNavActionModals Update

File: `src/components/layout/TopNavActionModals.tsx`

- [x] Remove `isShareOpen` state variable
- [x] Remove `ShareModal` import and dynamic import
- [x] Remove `<ShareModal>` render from JSX
- [x] Remove "Share" button from `showQuickActions` section (the `<Share2>` button)
- [x] Remove `Share2` from lucide-react imports if no longer used

**Checkpoint:** TopNav renders without Share button. `npm run build:check` → 0 errors.

---

## Phase 16 — UserMenuDropdown Cleanup

File: `src/components/layout/UserMenuDropdown.tsx`

- [x] Remove `members: User[]` prop
- [x] Remove `setCurrentUserId` prop
- [x] Remove `onOpenLogin` prop
- [x] Remove the entire "Demo Mode: Persona Simulation" JSX block (the `isGoogleSession ? ... : <div> members.map(...)` branch for demo persona list)
- [x] Remove the unauthenticated "Sign In with Google" button block (middleware now ensures user is always authenticated when this component renders)
- [x] Simplify component to show:
  - User avatar + name + role badge + email
  - "Google Verified" badge if `session.user.image` present (Google account)
  - "Sign Out" button → `signOut({ redirect: false })` then `router.push("/login")`
- [x] Update `UserMenuDropdownProps` interface accordingly
- [x] Update all call sites in `TopNav.tsx` to remove now-removed props

**Checkpoint:** UserMenuDropdown renders with session data only. No TypeScript errors at call sites.

---

## Phase 17 — SettingsModal Cleanup

File: `src/components/modals/SettingsModal.tsx`

- [x] Remove `"profile"` from `activeTab` state type: change to `"data" | "appearance"`
- [x] Change `useState` default from `"profile"` to `"data"`
- [x] Remove the `"profile"` tab button from the tab bar
- [x] Remove the entire `{activeTab === "profile" && ...}` JSX content block:
  - Google OAuth account card section
  - Persona switcher section
- [x] Remove these imports (if now unused): `useSession`, `signIn`, `signOut`, `ShieldCheck`, `LogIn`
- [x] Remove `currentUserId`, `users`, `setCurrentUserId` from store selectors (if no longer used)
- [x] Remove `UserAvatar` import if no longer used in this file
- [x] Keep `"data"` (Backup & Data) and `"appearance"` tabs unchanged

**Checkpoint:** SettingsModal renders 2 tabs. No unused imports. `npm run build:check` → 0 errors.

---

## Phase 18 — DELETE Removed Components

Run grep checks first to confirm 0 remaining imports, then delete.

```bash
# Must all return 0 results before proceeding
grep -rn "LoginModal"  src/ --include="*.tsx" --include="*.ts"
grep -rn "InviteModal" src/ --include="*.tsx" --include="*.ts"
grep -rn "TeamsModal"  src/ --include="*.tsx" --include="*.ts"
grep -rn "ShareModal"  src/ --include="*.tsx" --include="*.ts"
grep -rn "AuthSync"    src/ --include="*.tsx" --include="*.ts"
```

- [x] All 5 greps return 0 results
- [x] Delete files:
  ```bash
  rm src/components/modals/LoginModal.tsx
  rm src/components/modals/InviteModal.tsx
  rm src/components/modals/TeamsModal.tsx
  rm src/components/modals/ShareModal.tsx
  rm src/components/auth/AuthSync.tsx
  ```
- [x] Run `npm run build:check` immediately → must return 0 errors

**Checkpoint:** Build clean after deletion.

---

## Phase 19 — Prisma Seed (First Admin User)

File: `prisma/seed.ts`

- [x] Add import: `import bcrypt from "bcryptjs"`
- [x] Add admin seed block (idempotent — only runs if no ADMIN exists):
  ```ts
  const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminExists) {
    const hashed = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD ?? "changeme123", 12
    );
    await prisma.user.create({
      data: {
        name:   "System Admin",
        email:  process.env.SEED_ADMIN_EMAIL ?? "admin@vrelloup.dev",
        password: hashed,
        role:   "ADMIN",
        status: "APPROVED",
      },
    });
    console.log("Seeded admin user:", process.env.SEED_ADMIN_EMAIL ?? "admin@vrelloup.dev");
  }
  ```
- [x] Ensure seed does not error if `User` table empty or if admin already exists

**Checkpoint:** `npx prisma db seed` → "Seeded admin user: ..." logged. Login with seeded creds → session issued.

---

## Phase 20 — `.env.example` Update

File: `.env.example`

- [x] Add SMTP section:
  ```bash
  # Email (Nodemailer SMTP) — use Mailtrap for development
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

**Checkpoint:** `.env.example` committed with SMTP section. `SEED_ADMIN_PASSWORD` documented with note to change in production.

---

## Phase 21 — Tests

### `src/lib/server/auth-helpers.test.ts` (new)

- [x] Test: `hashPassword` returns a string starting with `$2b$`
- [x] Test: `verifyPassword(plain, await hashPassword(plain))` → `true`
- [x] Test: `verifyPassword("wrong", await hashPassword("correct"))` → `false`
- [x] Test: `normalizeRole("ADMIN")` → `"admin"`
- [x] Test: `normalizeRole("STAFF")` → `"staff"`
- [x] Test: `normalizeRole("VIEWER")` → `"viewer"`
- [x] Test: `normalizeStatus("PENDING")` → `"PENDING"`
- [x] Test: `toAppUser(mockPrismaUser)` → returns correct `AppUser` shape with ISO date strings

### `src/lib/server/mailer.test.ts` (new)

- [x] Test: `sendApprovalEmail` returns without throwing when `SMTP_HOST` is not set
- [x] Test: `sendRejectionEmail` returns without throwing when `SMTP_HOST` is not set
- [x] Test: `sendRejectionEmail` includes reason in call when provided (mock transporter)
- [x] Test: neither function throws when transporter `sendMail` rejects (error caught internally)

```bash
# Run isolated test files after writing
node --test src/lib/server/auth-helpers.test.ts
node --test src/lib/server/mailer.test.ts
```

**Checkpoint:** Both test files pass with 0 failures.

---

## Phase 22 — Full Verification

```bash
# 1. Removed component cleanup
grep -rn "LoginModal\|InviteModal\|TeamsModal\|ShareModal\|AuthSync" \
  src/ --include="*.tsx" --include="*.ts"
# → 0 results

# 2. Persona switcher remnants removed
grep -rn "handleDemoLogin\|Simulate Persona\|SEED_USERS" \
  src/components/ --include="*.tsx"
# → 0 results (SEED_USERS may still exist in seeds.ts — that is fine)

# 3. Prisma schema valid
npx prisma validate

# 4. TypeScript gate
npm run build:check
# → 0 errors

# 5. Full test suite
npm test
# → fail 0

# 6. Drift check
npm run drift:check
# → ✅ No drift detected

# 7. Manual smoke test (in order)
#   a. npx prisma db seed
#   b. Navigate / (no session) → redirected to /login
#   c. /register → fill form → submit → success message shown
#   d. Check DB: new user status = PENDING
#   e. /login with new user creds → blocked, amber notice shown
#   f. /login with admin creds → session → /admin/users loads
#   g. Pending tab shows new user → click Approve
#   h. Check SMTP/Mailtrap: approval email received
#   i. /login as newly approved user → session → lands on /
#   j. Navigate /admin/users as STAFF → redirected to /
#   k. Sign out → redirected to /login
```

---

## Sequencing Rules

```
Phase 1  (deps)              → MANDATORY BEFORE Phase 4, 5, 6, 7, 8, 19
Phase 2  (Prisma)            → BEFORE Phase 3, 4, 6, 7, 8, 12, 19
Phase 3  (SSOT types)        → BEFORE Phase 4, 6, 8, 11, 12, 13
Phase 4  (auth-helpers)      → BEFORE Phase 6, 7, 8, 21
Phase 5  (mailer)            → BEFORE Phase 8, 21
Phase 6  (NextAuth config)   → BEFORE Phase 9, 10, 11
Phase 7  (register API)      → BEFORE Phase 11 (RegisterForm calls this)
Phase 8  (admin users API)   → BEFORE Phase 13 (UsersView calls this)
Phase 9  (middleware)        → BEFORE Phase 10 (test redirect behavior)
Phase 10 (auth pages shell)  → BEFORE Phase 11
Phase 11 (auth forms)        → BEFORE Phase 18 (confirms LoginModal no longer needed)
Phase 12 (admin page)        → BEFORE Phase 13
Phase 13 (UsersView)         → BEFORE Phase 18 (confirms TeamsModal/InviteModal no longer needed)
Phase 14 (GlobalRail)        → BEFORE Phase 18 (confirms TeamsModal/InviteModal 0 imports)
Phase 15 (TopNavActionModals)→ BEFORE Phase 18 (confirms ShareModal 0 imports)
Phase 16 (UserMenuDropdown)  → BEFORE Phase 18
Phase 17 (SettingsModal)     → BEFORE Phase 18
Phase 18 (DELETE)            → AFTER Phase 11–17 (grep confirms 0 imports)
Phase 19 (seed)              → AFTER Phase 2
Phase 20 (.env.example)      → Any time after Phase 5
Phase 21 (tests)             → AFTER Phase 4, 5
Phase 22 (verify)            → AFTER ALL
```

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `AuthSync.tsx` syncs Google session into Zustand `users[]` — removing it may break components that display the logged-in user from Zustand | After deleting `AuthSync`, audit components that read `currentUserId` or `users.find(u => u.id === currentUserId)` for display purposes — update them to read from `useSession()` instead. TypeScript errors will surface broken references. |
| `UserMenuDropdown` currently receives `members` and `setCurrentUserId` props — removing them breaks `TopNav.tsx` call site | Phases 16 and call-site update happen together. `npm run build:check` immediately catches any missed prop. |
| `MoreAppsMenu` passes `onOpenTeams` + `onOpenInvite` props — removing them from GlobalRail breaks MoreAppsMenu | Phase 14 updates both `GlobalRail` and `MoreAppsMenu` in the same pass. |
| SMTP not configured in dev → mailer calls silently no-op | Phase 5 guard: `isSmtpConfigured()` check. Phase 21 tests verify no-op behavior. Devs use Mailtrap for actual email testing. |
| Middleware `matcher` pattern might accidentally block NextAuth OAuth callback routes | Explicitly include `api/auth` in the exclusion pattern. Verified in Phase 9 checkpoint with Google OAuth flow test. |
| Seeded admin password committed in `.env.example` as plaintext | `.env.example` contains only `changeme123` placeholder. Real `.env.local` is gitignored. README documents the change-on-deploy requirement. |
| Google OAuth `signIn` callback blocks session but NextAuth may still create a cookie | Returning a string (redirect URL) from `signIn` callback prevents session creation in NextAuth v5. Verified in Phase 6 checkpoint. |
| `SEED_USERS` constant in `seeds.ts` still references old lowercase roles | `SEED_USERS` is for Zustand task assignee seeding — unrelated to auth `User` model. It is NOT deleted or changed. `UserRole` type is unchanged (lowercase). |

---

## Commit Convention

```
feat(auth): add credential registration, admin approval gate, and user management page

- Add User Prisma model (DbUserRole/DbUserStatus enums, PENDING approval flow)
- Add /register page with email+password form and Google OAuth path
- Add /login page (credentials + Google, status-aware error messages)
- Add NextAuth Credentials provider with bcrypt, status blocking, lastLoginAt update
- Add /api/auth/register endpoint (POST, bcrypt hash, duplicate guard)
- Add /api/admin/users GET + PATCH + DELETE endpoints (admin-only)
- Add /admin/users full-page view (Pending/Active/Rejected tabs)
- Add Nodemailer email notifications for approval and rejection
- Add Next.js middleware protecting all app routes
- Add bcryptjs/nodemailer dependencies
- Add auth-helpers and mailer server utilities
- Remove LoginModal, InviteModal, TeamsModal, ShareModal, AuthSync
- Remove persona switcher from UserMenuDropdown and SettingsModal
- Remove Invite rail item; update Teams rail item to /admin/users link
- Remove Share button from TopNavActionModals

Spec: docs/superpowers/specs/2026-10-30-auth-user-management-design.md
Plan: docs/superpowers/plans/2026-10-30-auth-user-management.md
ADR:  docs/auth-user-management/adr.md
```
