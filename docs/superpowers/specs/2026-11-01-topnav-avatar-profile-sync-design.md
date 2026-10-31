# Spec — TopNav Avatar & Profile Session Desynchronization Fix

**Date:** 2026-11-01  
**Status:** DRAFT  
**Scope:** Client layout & session presentation (`src/components/layout/TopNav.tsx`, `src/components/layout/UserMenuDropdown.tsx`, `src/components/layout/userProfileHelpers.ts`)  
**Refs:** Issue 6 — Desinkronisasi Avatar & Profil di TopNav

---

## 1. Executive Summary

In `TopNav.tsx`, the profile avatar trigger button currently resolves its initials exclusively from `users.find(u => u.id === currentUserId) ?? users[0]`, where `currentUserId` defaults to `"user-1"` (`Alex Rivera`). When a real user logs in via NextAuth (either via Google OAuth or Credentials), the TopNav avatar trigger button continues to display the hardcoded dummy initials (`"AR"`), ignoring `session.user.name` and `session.user.image`. Only upon clicking the avatar to open `UserMenuDropdown.tsx` does the actual session user's name and photo appear.

This specification defines a unified user profile resolution mechanism that guarantees:
1. `session.user` takes strict precedence over Zustand fallback user data for both TopNav avatar button and `UserMenuDropdown`.
2. Profile image URL from `session.user.image` (or fallback `avatar`) is rendered in the TopNav avatar button with fallback to initials.
3. Initials calculation logic is extracted into a shared, pure helper (`userProfileHelpers.ts`) with comprehensive unit tests covering edge cases.
4. Active session ID (`session.user.id`) is synchronized to Zustand store (`currentUserId`) to keep downstream systems consistent.

---

## 2. UX Flow & Interaction

```
[NextAuth useSession()] ───> session?.user
                                  │
                                  ▼
                    [getEffectiveProfile Helper]
                       Is session.user active?
                          /             \
                        YES              NO
                        /                 \
            Use session.user            Use Zustand fallback (users[0])
            - name, email, image        - fallback name, email, avatar
            - compute initials          - compute initials
            - isAuthenticated: true     - isAuthenticated: false
                          │
                          ▼
            [TopNav.tsx Avatar Trigger]
            - If image exists & valid: render <img>
            - Else: render <span>{initials}</span>
            - Online indicator dot if authenticated
            - Tooltip: "Signed in as {name} ({email})"
                          │
                       (click)
                          ▼
            [UserMenuDropdown.tsx Card]
            - Renders exact same name, email, image/initials, and role
```

1. **Unauthenticated / Mock State:**
   - When no session is authenticated, `fallbackUser` from Zustand store is used.
   - Initials derived from `fallbackUser.name` (e.g. `"AR"`).
   - Tooltip displays `"Active profile: {name}"`.
2. **Authenticated State (Credentials):**
   - User signs in as `"Budi Santoso"` (`role: "staff"`).
   - TopNav avatar button immediately reflects initials `"BS"`.
   - Tooltip displays `"Signed in as Budi Santoso (budi@example.com)"`.
   - Green active session badge dot rendered at bottom-right corner.
3. **Authenticated State (Google OAuth):**
   - User signs in with Google having a profile picture `https://lh3.googleusercontent.com/...`.
   - TopNav avatar button renders the rounded profile image.
   - If image fails to load (`onError`), it gracefully falls back to initials text.
4. **Dropdown Parity:**
   - Clicking the avatar opens `UserMenuDropdown`, showing the exact matching avatar image or initials, full name, role badge, and email.

---

## 3. Data Contracts & SSOT

Pure helper interface defined in `src/components/layout/userProfileHelpers.ts`:

```typescript
export interface EffectiveUserProfile {
  name: string;
  email: string;
  image: string | null;
  role: string;
  initials: string;
  isAuthenticated: boolean;
}

export interface ResolveProfileParams {
  sessionUser?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
  fallbackUser?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
  } | null;
}

export function getInitials(name?: string | null, email?: string | null): string;

export function getEffectiveProfile(params: ResolveProfileParams): EffectiveUserProfile;
```

---

## 4. Acceptance Criteria & Verification Checklist

- [ ] **Unit Tests:** `userProfileHelpers.test.ts` passes with 100% coverage on:
  - Multi-word names (e.g., `"Vicky Pratama"` -> `"VP"`).
  - Single-word names (e.g., `"Vicky"` -> `"V"`).
  - Names with irregular whitespace (e.g., `"  Budi   Santoso  "` -> `"BS"`).
  - Names with special characters or honorifics.
  - Null/undefined names with valid emails (e.g., `"staff@vrelloup.dev"` -> `"S"`).
  - Empty name and empty email (fallback to `"U"`).
  - Priority rule: `sessionUser` properties override `fallbackUser`.
- [ ] **TopNav Trigger Button:**
  - Displays `session.user.image` when present.
  - Displays `session.user` initials when image is absent or broken.
  - Only uses `users[0]` when `session.user` is null/undefined.
  - Green presence indicator rendered if and only if `isAuthenticated` is true.
- [ ] **UserMenuDropdown Parity:**
  - Displays identical initials and image fallback.
- [ ] **Store Synchronization:**
  - `currentUserId` in Zustand is updated when `session.user.id` is present and differs from current state.
- [ ] **Verification Gates:**
  - `npm run drift:check` passes (0 drift).
  - `npm run build:check` passes (0 TypeScript errors).
  - `npm test` passes (0 failed tests).
  - Both `TopNav.tsx` and `UserMenuDropdown.tsx` LOC remain $\le 250$ lines.

---

## 5. Non-Goals

- Modifying the underlying NextAuth backend providers or database schema.
- Changing the authorization roles or permissions logic in `guards.ts`.
- Redesigning the entire top navbar layout or breadcrumbs.

