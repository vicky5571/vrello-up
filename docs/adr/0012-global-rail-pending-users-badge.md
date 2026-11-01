# ADR 12: Global Rail Pending Users Notification Badge

## Context & Problem Statement
When new users register (via Google OAuth or email/password Credentials), their account is created with `status: "PENDING"` ("Menunggu Review"). Administrators need to review and approve these users before they can access the application.

Previously, the Global Rail rendered a static `Users` icon for administrators (`session.user.role === "admin"`). If a new user registered, administrators had no visual indicator unless they manually navigated to the `users` view (`/?view=users`) and inspected the "Menunggu Review" tab.

Administrators need an immediate, persistent, and ambient notification on the `Users` icon in the `GlobalRail` showing a small red dot badge containing the count of registered users awaiting review.

## Decision Drivers
1. **Ambient Awareness**: Administrators must know immediately when registration requests are pending without polling manually or opening the user management screen.
2. **Strict RBAC & Non-Leakage**: Pending counts must only be queried and rendered for users with `role: "admin"`. Non-admin users (`member`, `supervisor`, `viewer`) must never make queries to `/api/admin/users` or see the badge.
3. **Real-time Synchronicity**: When an administrator approves or rejects a user in `UsersView`, the badge in `GlobalRail` must update immediately.
4. **Architectural Discipline & SSOT**: Coordinator files must remain $\le 250$ LOC. Badge calculation logic must be pure, tested, and decoupled from UI layout.

## Decision
1. **Pure Helper Module (`src/lib/marcom/pendingUsersHelpers.ts`)**:
   - Implement `formatPendingBadgeCount(count: number): string | null` with `99+` ceiling and null fallback for $\le 0$.
   - Implement `fetchPendingUsersCountApi(fetcher)` targeting `/api/admin/users?status=PENDING&limit=1` returning `total` count or fail-safe `0`.
2. **Global State Integration (`createDataSlice.ts` & `useWorkspaceStore`)**:
   - Add `pendingUsersCount: number` and `setPendingUsersCount: (count: number) => void` to `DataSlice`.
   - Update `UsersView.tsx` to call `setPendingUsersCount(pData.total || 0)` whenever user rosters/tabs are fetched or actions (approve/reject) are executed.
3. **Hook for Global Rail (`src/lib/marcom/usePendingUsers.ts`)**:
   - Polls count on mount for administrators (`isAdmin: true`).
   - Revalidates on window focus and a periodic 60-second timer.
   - Cleans up timers and listeners on unmount.
4. **UI Presentation in `GlobalRail.tsx`**:
   - Wrap icons in a `relative` container.
   - Position a badge with `bg-rose-500 text-white font-bold text-[9px] rounded-full ring-2 ring-[#0F1115]` on the top-right corner of the `Users` icon.
   - Conditionally render only if `item.badge != null && item.badge > 0`.

## Consequences
- **Positive**: Admins receive ambient notification of pending registrations on any screen.
- **Positive**: 0 additional network calls for non-admin users.
- **Positive**: Immediate state update when approving/rejecting accounts.
- **Compliance**: `GlobalRail.tsx` remains $\le 250$ LOC.

