# Dedicated User Profile Workspace View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a first-class, dedicated workspace view (`activeView: "profile"`) allowing all authenticated users (especially Credentials/email-password users) to upload and manage their avatars, edit display names, view role and assigned branch assignments, and securely change passwords with current-password verification.

**Architecture:** Add `"profile"` to `ViewMode` SSOT and register in `urlState.ts`. Build backend API `/api/user/profile` (`GET`, `PATCH`) with strict session scoping, Zod validation, and bcrypt password hashing. Deconstruct the view into modular atomic components (`ProfileHeader`, `ProfileAvatarUploader`, `ProfileSecurityCard`, `ProfileView` coordinator $\le 250$ LOC). Wire direct navigation from `UserMenuDropdown.tsx` and provide backwards-compatible redirection on `/profile`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, NextAuth v5, Zustand 5, Prisma 6, bcryptjs, Zod 4, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-user-profile-view-design.md`  
**ADR:** `docs/adr/0008-dedicated-user-profile-workspace-view.md`

## Global Constraints

- Coordinator and view files must remain strictly $\le 250$ LOC (`ProfileView.tsx`).
- SSOT: All domain types in `src/types/index.ts`. No duplicate interfaces.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`) must pass with 0 errors.

---

### Phase 1: Domain Types, URL Routing & View Registration

- [x] **Task 1.1: Expand `ViewMode` and SSOT Types**
  - Edit: `src/types/index.ts`
  - Add `"profile"` to `ViewMode` union.
  - Add `UserProfileResponse` and `UpdateProfilePayload` interfaces.

- [x] **Task 1.2: Register `profile` in URL State and Store**
  - Edit: `src/lib/router/urlState.ts`
  - Register `"profile"` in `VALID_VIEW_MODES` and parse query parameter `view=profile`.
  - Edit: `src/app/profile/page.tsx`
  - Create Next.js server route executing `redirect("/?view=profile")`.

- [x] **Task 1.3: Update UserMenuDropdown Navigation Trigger**
  - Edit: `src/components/layout/UserMenuDropdown.tsx`
  - Add "Lihat Profil & Akun" action button invoking `setActiveView("profile")` and `onClose()`.

---

### Phase 2: Backend API & Security Validation

- [x] **Task 2.1: Implement Profile Validators & Unit Tests**
  - Create: `src/lib/server/profileValidators.ts`
  - Define `updateProfileSchema` validating name (2-80 chars), avatar (URL or data URL), and password change rules.
  - Create: `src/lib/server/profileValidators.test.ts`
  - Test validation: name length, valid/invalid avatar formats, password minimum length, and password confirmation matching.
  - Run: `node --test src/lib/server/profileValidators.test.ts`.

- [x] **Task 2.2: Implement `/api/user/profile` Route**
  - Create: `src/app/api/user/profile/route.ts`
  - Implement `GET`: returns authenticated user profile (`id`, `name`, `email`, `avatar`, `role`, `status`, `assignedBranchIds`, `isGoogleAccount`, `createdAt`, `lastLoginAt`).
  - Implement `PATCH`:
    - Validates body against `updateProfileSchema`.
    - If `newPassword` provided:
      * Reject with 400 if user is Google account (`googleId` present without local password).
      * Verify `currentPassword` with `bcrypt.compare`.
      * Hash `newPassword` with `bcrypt.hash(..., 12)`.
    - Updates `name`, `avatar`, and optional hashed `password`.
    - Returns updated profile DTO.

- [x] **Task 2.3: Integration Tests for Profile API**
  - Create: `src/app/api/user/profile/profileApi.test.ts`
  - Test session authentication requirement (401 when unauthorized).
  - Test updating name and avatar.
  - Test password change logic (invalid current password, mismatched confirmation, successful update).
  - Run: `node --test src/app/api/user/profile/profileApi.test.ts`.

---

### Phase 3: Pure Helpers Module (`profileHelpers.ts`)

- [x] **Task 3.1: Write Unit Test Suite for Profile Helpers**
  - Create: `src/components/views/ProfileView/profileHelpers.test.ts`
  - Test cases:
    - `formatBranchBadges`: returns matching branch names, handles empty arrays, returns "Nasional (Semua Cabang)" for Super Admin.
    - `validatePasswordForm`: verifies matching passwords, flags missing fields, and enforces minimum 8 characters.
    - `sanitizeAvatarUrl`: normalizes URL or data URI strings safely.

- [x] **Task 3.2: Implement `profileHelpers.ts`**
  - Create: `src/components/views/ProfileView/profileHelpers.ts`
  - Implement tested helper functions.
  - Run: `node --test src/components/views/ProfileView/profileHelpers.test.ts`.

---

### Phase 4: Atomic Components & Coordinator Construction

- [x] **Task 4.1: Build `ProfileHeader.tsx`**
  - Create: `src/components/views/ProfileView/ProfileHeader.tsx`
  - Header with icon, title ("Profil & Keamanan Akun"), subtitle, account status badge, and refresh button.
  - Keep $\le 120$ LOC.

- [x] **Task 4.2: Build `ProfileAvatarUploader.tsx`**
  - Create: `src/components/views/ProfileView/ProfileAvatarUploader.tsx`
  - Display avatar with `<AppImage />` and fallback initials.
  - Support file picker with client-side image compression (Canvas resize $\le 400\times 400$ WebP / data URL) and URL entry.
  - "Hapus Foto" button to revert to clean initials.
  - Keep $\le 180$ LOC.

- [x] **Task 4.3: Build `ProfileSecurityCard.tsx`**
  - Create: `src/components/views/ProfileView/ProfileSecurityCard.tsx`
  - If Google user: display Google Identity security shield and explanation.
  - If Credentials user: display password update form (Password Saat Ini, Password Baru, Konfirmasi).
  - Keep $\le 180$ LOC.

- [x] **Task 4.4: Build `ProfileView.tsx` Coordinator**
  - Create: `src/components/views/ProfileView/ProfileView.tsx`
  - Fetch profile data from `/api/user/profile` on mount.
  - Two-column responsive layout: Identity Card (Left) and Security Card (Right).
  - Wire saving mutations, toast notifications, and `syncSessionUser` call to update TopNav avatar immediately upon save.
  - Maintain strictly $\le 250$ LOC.

- [x] **Task 4.5: Mount in `ActiveViewStage.tsx`**
  - Edit: `src/components/views/ActiveViewStage.tsx`
  - Dynamically load `ProfileView` when `activeView === "profile"`.

---

### Phase 5: Verification & End-to-End Gates

- [x] **Task 5.1: Execute Verification Suite**
  - Run: `npm run drift:check` (Confirm 0 drift).
  - Run: `npm run build:check` (Confirm 0 TypeScript errors).
  - Run: `npm run test:smoke` (Confirm all smoke tests pass).
  - Run: `npm test` (Confirm all test suites pass with 0 failures).

- [x] **Task 5.2: Update Documentation & Session State**
  - Update: `docs/superpowers/specs/README.md`
  - Update: `docs/superpowers/plans/README.md`
  - Update: `docs/SESSION_STATE.md`

