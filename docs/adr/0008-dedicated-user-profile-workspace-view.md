# ADR 08: Dedicated User Profile Workspace View & Self-Service Account Management

**Date:** 2026-11-01  
**Status:** Accepted  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Related Specs:** `docs/superpowers/specs/2026-11-01-user-profile-view-design.md`  
**Related Plans:** `docs/superpowers/plans/2026-11-01-user-profile-view.md`  

---

## Context

In `vrello-up`, user authentication is supported through two distinct providers:
1. **Google OAuth (SSO):** User name, email, and avatar are automatically hydrated and verified from Google identity claims.
2. **Credentials (Email & Password):** Registered internal staff and administrators authenticate via local hashed credentials.

Currently, the application lacks any self-service profile management interface:
- Non-Google (Credentials) users have **no mechanism to upload or update their profile avatar**, edit their display name, or change their password.
- When an account is registered or seeded with an empty avatar, the user is permanently stuck with fallback two-letter initials in `TopNav`, `UserMenuDropdown`, and operational audit tables.
- While administrative role changes, account approvals, and branch assignments are properly managed by Super Admins in `UsersView` (`Manajemen Pengguna`), ordinary personal profile management is completely inaccessible to individual users.

The architectural decision is whether to expose personal profile management as a modal/drawer or as a **first-class dedicated workspace view (`profile`)**.

---

## Decisions

### 1. Integrate `profile` as a Dedicated First-Class `ViewMode` in `ActiveViewStage`
Following the architectural precedent established in **ADR 07 (Unify User Management into Workspace Stage Shell)**, we reject orphan Next.js server pages that destroy the application shell.
Instead, we add `"profile"` to the canonical `ViewMode` union in `src/types/index.ts` and register it in `src/lib/router/urlState.ts`.

When `activeView === "profile"`, `ActiveViewStage` renders `<ProfileView />` directly within the primary workspace container, preserving:
- Persistent `GlobalRail` and `Sidebar`
- Top navigation bar (`TopNav`), search, and command palette (`Cmd+K`)
- Active NextAuth session context and real-time state without any hard page reload

### 2. UserMenuDropdown and TopNav Navigation Integration
In `UserMenuDropdown.tsx` and `TopNav.tsx`, we add a direct "Lihat Profil & Akun" trigger button:
- Clicking it sets `activeView: "profile"` via `useWorkspaceStore.getState().setActiveView("profile")`.
- Closes the dropdown menu smoothly without full navigation loss.

### 3. Backwards-Compatible Next.js Route Redirection
To support direct browser bookmarks and external links to `/profile`:
- Create `src/app/profile/page.tsx` that executes `redirect("/?view=profile")`.
- Eliminates 404 errors while guaranteeing the user is always presented with the full workspace shell.

### 4. Strict Self-Service Scope & Security Boundaries
The profile view allows users to edit only their own personal profile data:
- **Mutable:** Display Name (`name`), Profile Avatar (`avatar`), and Local Password (with current password verification).
- **Immutable / Read-Only:** Email (`email` is account identity), Status (`status` is admin-controlled), Role (`role` is admin-controlled), and Assigned Branches (`assignedBranchIds` are admin-controlled).
- **Google OAuth Guard:** For Google-authenticated users, the password change form is disabled and replaced with a `Google Verified Account` indicator explaining that credentials are managed by Google Identity.

### 5. Backend Self-Service API (`/api/user/profile`)
Create a dedicated route `src/app/api/user/profile/route.ts` supporting:
- `GET`: Returns the authenticated user's profile and assigned branch metadata.
- `PATCH`: Validates and updates `name`, `avatar`, and optional `password` (requiring `currentPassword` match).
- Bounded strictly to `session.user.id` (users can never mutate another user's profile through this route).

---

## Consequences

### Positive
- **Complete Self-Service Identity:** Non-Google (Credentials) users can finally upload custom avatars, edit their display names, and securely change their passwords.
- **Architectural Cohesion:** Aligns with ADR 07 by treating the profile as a first-class view mode inside `ActiveViewStage`, eliminating jarring hard page reloads.
- **Strict Role & Data Boundaries:** Clear segregation between self-service personal data (name, avatar, password) and administrative governance (roles, branch assignments, account approvals).
- **Smooth Navigation:** Instant zero-reload transition from any Marcom Hub view to the profile view and back.

### Negative / Trade-offs
- Expands the `ViewMode` union by 1 variant (`"profile"`).
- Requires an image upload or avatar URL entry handler with compression to prevent excessive database/storage bloat.

