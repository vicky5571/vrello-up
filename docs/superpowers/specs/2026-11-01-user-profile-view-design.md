# Spec — Dedicated User Profile Workspace View & Account Management

**Date:** 2026-11-01  
**Status:** DRAFT  
**Scope:** Workspace view, self-service identity management, avatar upload, and security API (`src/components/views/ProfileView/`, `src/app/api/user/profile/`, `src/lib/router/urlState.ts`, `src/types/index.ts`)  
**Refs:** ADR 08 — Dedicated User Profile Workspace View & Self-Service Account Management  

---

## 1. Executive Summary

`vrello-up` currently provides no self-service mechanism for non-Google (Credentials) users to manage their personal profile. Users registered or seeded via email and password are permanently stuck with empty or initial-only avatars, cannot update their display names, and cannot change their passwords.

This specification designs a **first-class, dedicated workspace view (`activeView: "profile"`)** rendered seamlessly inside `ActiveViewStage`:
1. Users can upload or update their avatar picture with instant preview and local WebP/data URL compression (or remove custom avatars to revert to initials).
2. Users can edit their display name.
3. Credentials users can securely change their password (verifying their current password with bcrypt).
4. Google OAuth users see a verified badge indicating their identity and credentials are authentication-managed by Google.
5. Administrative boundaries are strictly enforced: Email, Role, Status, and Assigned Branches are read-only to prevent privilege escalation.

---

## 2. UX Flow & Layout Architecture

```
[TopNav / UserMenuDropdown] ──(Click "Lihat Profil & Akun")──► setActiveView("profile")
                                                                        │
                                                                        ▼
                                                        [ActiveViewStage: profile]
                                                                        │
                   ┌────────────────────────────────────────────────────┴────────────────────────────────────────────────────┐
                   ▼                                                                                                         ▼
       [ProfileHeader.tsx]                                                                                       [ProfileView.tsx Container]
       - Title: "Profil & Keamanan Akun"                                                                         - Responsive 2-column layout
       - Subtitle & Session Verification Pill                                                                    - ≤ 250 LOC coordinator
       - Refresh button
                   │
                   ├────────────────────────────────────────────────────┐
                   ▼                                                    ▼
       [Left: Identity & Access Card]                       [Right: Security & Auth Card]
       - ProfileAvatarUploader:                             - If Google Account:
         * <AppImage /> preview                               * Google Verified Shield Banner
         * Local file upload / URL input                      * Identity explanation
         * WebP/Data URL compression                        - If Credentials Account:
         * Remove avatar button                               * Current Password input
       - Display Name input form                              * New Password input (min 8 chars)
       - Email (read-only with lock icon)                     * Confirm Password input
       - Role Badge (Admin / Supervisor / Staff / Viewer)     * "Perbarui Kata Sandi" button
       - Assigned Branches chips (e.g. Jakarta, Bandung)    - Session Information:
       - Created date & last login timestamp                  * Sign-in provider
       - "Simpan Informasi Pribadi" button                    * Last active timestamp
```

### 2.1 Navigation & URL State
- `ViewMode` union in `src/types/index.ts` is expanded to include `"profile"`.
- `src/lib/router/urlState.ts` accepts `view=profile` and serializes it in URL query parameters.
- Direct navigation to `/profile` redirects cleanly to `/?view=profile` via `src/app/profile/page.tsx`.

---

## 3. Data Model & SSOT Schema

All domain types live in `src/types/index.ts`.

### 3.1 Profile DTO & Update Payload

```typescript
export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  assignedBranchIds: string[];
  isGoogleAccount: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string | null;
  currentPassword?: string;
  newPassword?: string;
}
```

### 3.2 Zod Validation Schema (`src/lib/server/profileValidators.ts`)

```typescript
import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama maksimal 80 karakter").optional(),
    avatar: z.string().url("URL avatar tidak valid").or(z.string().startsWith("data:image/")).nullable().optional(),
    currentPassword: z.string().min(1, "Password saat ini wajib diisi").optional(),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter").max(100).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    {
      message: "Password saat ini harus diisi jika ingin mengganti password baru",
      path: ["currentPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Konfirmasi password baru tidak cocok",
      path: ["confirmPassword"],
    }
  );
```

---

## 4. Backend API Contracts

### 4.1 `GET /api/user/profile`
- **Auth:** Requires active NextAuth session (`auth()`).
- **Response `200 OK`:**
  ```json
  {
    "id": "cly...",
    "name": "Budi Pratama",
    "email": "admin@vrelloup.dev",
    "avatar": "https://images.unsplash.com/...",
    "role": "admin",
    "status": "APPROVED",
    "assignedBranchIds": ["branch-1", "branch-2"],
    "isGoogleAccount": false,
    "createdAt": "2026-10-31T00:00:00.000Z",
    "lastLoginAt": "2026-11-01T15:00:00.000Z"
  }
  ```

### 4.2 `PATCH /api/user/profile`
- **Auth:** Requires active NextAuth session (`session.user.id`).
- **Request Body:** JSON payload conforming to `updateProfileSchema`.
- **Validation Rules:**
  1. If `newPassword` is supplied and user has `googleId` (Google account without local password), reject with HTTP 400: *"Akun Google dikelola langsung melalui Google Identity."*
  2. If `newPassword` is supplied for credentials user, verify `currentPassword` with `bcrypt.compare(currentPassword, user.password)`. If invalid, return HTTP 400: *"Password saat ini tidak sesuai."*
  3. If valid, hash `newPassword` with bcrypt cost factor 12 and update `prisma.user`.
  4. If `name` or `avatar` is supplied, update `prisma.user`.
- **Response `200 OK`:** Returns updated `UserProfileResponse`.
- **Side Effect:** Automatically synchronizes updated `name` and `avatar` with Zustand store `syncSessionUser`.

---

## 5. Pure Logic Helpers (`src/components/views/ProfileView/profileHelpers.ts`)

Pure, isolated utility functions covered by unit tests in `profileHelpers.test.ts`:
1. `formatBranchBadges(assignedBranchIds: string[], branches: { id: string; name: string }[], role: string): string[]`: Returns human-readable branch names or `["Nasional (Semua Cabang)"]` for Super Admin.
2. `validatePasswordForm(currentPassword: string, newPassword: string, confirmPassword: string): { valid: boolean; error?: string }`: Validates length, presence, and match.
3. `sanitizeAvatarUrl(url: string | null | undefined): string | null`: Cleans and validates avatar URLs.

---

## 6. Acceptance Criteria

1. **View Integration:**
   - Navigating to `/?view=profile` renders `<ProfileView />` inside `ActiveViewStage` with 0 page reloads.
   - Accessing `/profile` redirects smoothly to `/?view=profile`.
   - `UserMenuDropdown` includes a prominent "Lihat Profil & Akun" item that opens the profile view.
2. **Avatar Upload & Update:**
   - User can upload an image file or paste an image URL.
   - File is compressed client-side into a compact data URL / WebP representation ($\le 150\text{KB}$) before submission.
   - After saving, `TopNav` avatar and `UserMenuDropdown` update immediately without requiring a full page refresh.
3. **Display Name Update:**
   - User can update their display name.
   - Updated name reflects instantly in TopNav and store.
4. **Password Change Security (Credentials Users):**
   - Correct current password allows updating to a new password ($\ge 8$ chars).
   - Incorrect current password displays clear error: *"Password saat ini tidak sesuai."*
   - Mismatched confirmation displays: *"Konfirmasi password baru tidak cocok."*
5. **Google OAuth Safety:**
   - Password update form is disabled with a clear "Google Managed Account" badge.
6. **Immutable Governance:**
   - User cannot tamper with or mutate their `role`, `status`, `email`, or `assignedBranchIds`.
7. **Codebase Invariants:**
   - `ProfileView.tsx` coordinator remains $\le 250$ LOC.
   - Full test suite passes with 0 failures (`npm test`).
   - Drift check passes with 0 drift (`npm run drift:check`).
   - TypeScript build check passes (`npm run build:check`).
