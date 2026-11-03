# CHANGELOG — vrello-up

Format: `[YYYY-MM-DD] <type>(<scope>): <description>` with spec/plan references.

---

## [2026-11-03]

- `fix(content)`: Include mediaAttachments in ContentPlannerView handleDrawerUpdate payload
  - Resolved bug where multi-file uploads saved in ContentDrawer were omitted from the PATCH body
  - Added `mediaAttachments: updated.mediaAttachments ?? []` to PATCH payload in `ContentPlannerView.tsx`
  - Restored multi-file persistence in PostgreSQL and fixed card thumbnail click lightbox navigation
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-media-attachments-not-saving.md`

- `feat(content)`: Multi-file media UI adaptation across Content Planner surfaces
  - Refactored `previewMedia` state to support `attachments: TaskAttachment[]` and `currentIndex: number`
  - Added full multi-file carousel navigation to lightbox modal: ArrowLeft/ArrowRight keyboard listeners, edge prev/next buttons, dot indicators, and file counter
  - Updated `ContentDrawer` to pass full attachment lists and jump to clicked attachment index
  - Added `+N` badge to calendar/list post thumbnails and multi-file count indicator (`🖼 N`) on Kanban board cards
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-ui-adaptation.md`
  Plan: `docs/superpowers/plans/2026-11-03-multi-file-media-ui-adaptation.md`
  Refs: `docs/adr/0017-multi-file-media-ui-adaptation.md`

- `fix(content)`: Enable multi-file device upload and drag-and-drop in ContentDrawer
  - Added `multiple` attribute to `<input type="file">` enabling multi-selection in OS file dialog
  - Updated `onChange` and `handleDrop` to process all dropped/selected files sequentially via `for...of` queue
  - Ensured each uploaded file appends to `mediaAttachments` and synchronizes with cover `mediaUrl`
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-drawer-multi-file-device-upload.md`

- `feat(content)`: Multi-file media upload in ContentPostModal creation flow
  - Replaced isolated single-file upload hook in `ContentPostModal.tsx` with shared `onOpenUploadModal`
  - Added attachment list preview with type icons, sizes, cover badge, and individual deletion
  - Wired `mediaAttachments` into post creation form state and POST payload in `ContentPlannerView.tsx`
  - Safeguarded optional prop signatures for cross-view callers (`ProjectsCreateModalHost.tsx`)
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-multi-file-upload-create-modal.md`

- `fix(db)`: Resolve Prisma migration history drift and reconcile schema tracking
  - Reconciled `_prisma_migrations` tracking table on Supabase PostgreSQL
  - Resolved and marked all 5 historical migrations as applied (`20260906221636_marcom_port`, `20261027000000_remove_workspace_tenant`, `20261029072742_add_user_auth_model`, `20261029134026_drop_task_models`, `20261030192500_add_inventory_system`)
  - Created and resolved `20261103000000_add_media_attachments/migration.sql` for `mediaAttachments` JSONB column
  - Verified `npx prisma migrate status` reports 6 migrations applied, schema up to date
  - Gates: `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-prisma-migration-drift.md`

- `feat(content)`: Multi-file media upload and attachments management for content posts
  - Authored ADR 16 (`docs/adr/0016-multi-file-media-upload-content-post.md`) establishing multi-file media storage via JSON column while keeping `mediaUrl` as primary cover URL
  - Updated Prisma schema with `ContentPost.mediaAttachments Json @default("[]")` and applied to PostgreSQL
  - Updated domain SSOT interface `ContentPostItem` in `src/types/index.ts` with `mediaAttachments?: TaskAttachment[]`
  - Extended API routes `POST /api/marcom/content` and `PATCH /api/marcom/content/[id]` with array validation for `mediaAttachments`
  - Rewrote `GoogleDriveLinkModal.tsx` to support continuous multi-file uploads (up to 10 files) with file list, formatted sizes, per-item remove, and batch confirmation
  - Preserved backward compatibility in `useGoogleDrivePicker.ts` (`TaskAttachment[] | string`)
  - Updated `ContentDrawer.tsx` to display multi-media list with "Cover" badge, automatic cover promotion on delete, and synchronization with `mediaUrl`
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-upload-design.md`
  Plan: `docs/superpowers/plans/2026-11-03-multi-file-media-upload.md`
  Refs: `docs/adr/0016-multi-file-media-upload-content-post.md`

## [2026-11-02]

- `fix(users)`: Branch assignment UX and accessibility fixes
  - Implemented FIX-1: Converted visual-only label checkboxes in `ApproveUserModal.tsx` and `UserBranchSelectModal.tsx` to native `<input type="checkbox" className="sr-only">` with `pointer-events-none` visual boxes for full keyboard Tab/Space navigation and screen reader support
  - Implemented FIX-2: Isolated `isBranchSaving` state in `UsersActiveTab.tsx`, eliminating race conditions between active user row operations and branch modal saves
  - Implemented FIX-3: Added `branchesStatus` state, memoized `fetchBranches`, and an inline error retry banner with "Coba Lagi" button in `UsersView.tsx`
  - Maintained all coordinator and subcomponent file sizes strictly $\le 250$ LOC
  - Gates: `npm test` 734 pass / 0 fail; `npm run test:smoke` 100 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-02-branch-assignment-ux-fixes.md`

- `feat(users)`: User management branch assignment and area supervisor scoping
  - Authored ADR 14 (`docs/adr/0014-user-management-branch-assignment.md`) establishing approval-time branch assignment and Area Supervisor boundary scoping
  - Implemented pure helpers in `src/lib/marcom/branchAssignmentHelpers.ts` (`getAssignableBranches`, `canAssignBranchToUser`, `formatUserBranchBadges`) with 13 unit tests
  - Hardened `PATCH /api/admin/users/[id]` enforcing `canAssignBranchToUser` (HTTP 403 when supervisors assign branches outside their area)
  - Created `ApproveUserModal.tsx` allowing managers to select role and branch penugasan before activating accounts in `UsersPendingTab.tsx`
  - Created `UserBranchSelectModal.tsx` and `UserActiveRow.tsx` (Strangler Pattern) displaying branch chips and editing penugasan in `UsersActiveTab.tsx`
  - Integrated branch fetching in `UsersView.tsx` and verified all coordinator files remain $\le 250$ LOC
  - Gates: `npm test` 733 pass / 0 fail; `npm run test:smoke` 100 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-02-user-branch-assignment-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-user-branch-assignment.md`
  Refs: `docs/adr/0014-user-management-branch-assignment.md`

- `feat(rbac)`: Implement supervisor guarded user management access
  - Authored ADR 13 (`docs/adr/0013-supervisor-guarded-user-management-access.md`) granting supervisors operational user management while preventing privilege escalation
  - Implemented pure RBAC guard functions in `src/lib/marcom/guards.ts` (`canAccessUserManagement`, `canManageUserTarget`, `canAssignUserRole`) with 14 unit tests
  - Hardened backend API endpoints (`/api/admin/users/route.ts` and `[id]/route.ts`) enforcing supervisor access while blocking tampering with admin accounts and role promotion to admin (HTTP 403)
  - Updated navigation and routing in `GlobalRail.tsx`, `ActiveViewStage.tsx`, and `/admin/users/page.tsx`
  - Hardened UI controls in `UserRoleSelect.tsx`, `UsersActiveTab.tsx`, `UsersRejectedTab.tsx`, and `UsersView.tsx` disabling admin deactivation, role change, and deletion for supervisors
  - Gates: `npm test` 710+ pass / 0 fail; `npm run test:smoke` pass; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-02-supervisor-guarded-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-supervisor-guarded-user-management.md`
  Refs: `docs/adr/0013-supervisor-guarded-user-management-access.md`

- `feat(ui)`: Global Rail pending users notification badge
  - Authored ADR 12 (`docs/adr/0012-global-rail-pending-users-badge.md`) adding real-time ambient badge on Users navigation icon
  - Added pure helpers `formatPendingBadgeCount` and `fetchPendingUsersCountApi` in `pendingUsersHelpers.ts` with 6 unit tests
  - Added `pendingUsersCount` and `setPendingUsersCount` to Zustand data slice and connected real-time count updates on user approval/rejection in `UsersView.tsx`
  - Created client polling and focus-revalidation hook `usePendingUsers.ts` scoped strictly to authorized managers
  - Rendered small red dot badge with white typography and rose-500 fill on `GlobalRail.tsx` (240 LOC $\le 250$)
  - Gates: `npm test` pass / 0 fail; `npm run test:smoke` pass; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-02-global-rail-pending-users-badge-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-global-rail-pending-users-badge.md`
  Refs: `docs/adr/0012-global-rail-pending-users-badge.md`

- `fix(build)`: Clean up ESLint unused vars and React Hook dependencies for production Vercel build
  - Resolved all `@typescript-eslint/no-unused-vars` and `react-hooks/exhaustive-deps` across 8 files (`DirectDriveUploadDropzone`, `GoogleDriveUrlForm`, `ProjectsListTable`, `useProjectsBoard`, `useProjectsList`, `MousView`, `OutletFormModal`, `MarcomTableShell`)
  - Verified `npm run lint` exits with 0 errors and 0 warnings

- `feat(gdrive)`: Centralized Google Drive storage via developer refresh token and direct resumable uploads
  - Authored ADR 11 (`docs/adr/0011-centralized-google-drive-storage-refresh-token.md`) establishing centralized developer storage ownership and zero user OAuth popups
  - Created standalone CLI helper `scripts/get-drive-refresh-token.ts` (`npm run drive:token`) for one-time developer refresh token acquisition
  - Registered SSOT request/response contracts (`DriveUploadSessionRequest`, `DriveUploadSessionResponse`, `DriveFinalizeRequest`, `DriveFinalizeResponse`) in `src/types/index.ts`
  - Built pure helper modules `driveTokenHelpers.ts` and `driveUploadHelpers.ts` with 13 comprehensive unit tests
  - Built server-side token manager `driveAuth.ts` with in-memory caching and automatic expiration renewal
  - Built `/api/marcom/drive/upload-session` route creating Google Drive Resumable Upload sessions targeting `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`
  - Built `/api/marcom/drive/finalize` route automating public read permissions (`anyoneWithLink`) to prevent Google 403 iframe preview blocks
  - Built client streaming hook `useDirectDriveUpload.ts` and responsive dropzone `DirectDriveUploadDropzone.tsx` streaming directly from browser to Google CDN (0 MB on Vercel)
  - Deconstructed and upgraded `GoogleDriveLinkModal.tsx` (<150 LOC) with segmented tabs for direct cloud upload vs manual link pasting via `GoogleDriveUrlForm.tsx`
  - Gates: `npm test` 693 pass / 0 fail; `npm run test:smoke` 94 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-02-centralized-drive-upload-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-centralized-drive-upload.md`
  Refs: `docs/adr/0011-centralized-google-drive-storage-refresh-token.md`

---

## [2026-11-01]

- `fix(navigation)`: Resolve workspace return target and sanitize global view state
  - Built pure helper `resolveWorkspaceReturnTarget` in `layoutHierarchyHelpers.ts` with 6 unit tests
  - Guaranteed "Kembali ke Workspace" shortcut button always resolves strictly to an operational view (`board`, `list`, `calendar` or active Marcom view), eliminating false redirects to `profile` or `users`
  - Added rehydration sanitization in `useWorkspaceStore.ts` to reset legacy persisted `profile` or `users` values in `lastTaskView` and `lastMarcomView` back to `"board"` and `"events"`
  - Enforced strict work item whitelisting in `createUiSlice.ts` (`isWorkItem` required to update `lastTaskView`)
  - Gates: `npm test` 680 pass / 0 fail; `npm run test:smoke` 92 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Refs: `docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`, `docs/adr/0010-user-management-global-view-layout-isolation.md`

- `fix(layout)`: Extend global view layout isolation to user management
  - Refactored `shouldRenderSidebar` in `layoutHierarchyHelpers.ts` to check `GLOBAL_ACCOUNT_VIEWS` (suppressing `Sidebar.tsx` on both `profile` and `users`)
  - Expanded `UsersView` table into full widescreen stage width, eliminating horizontal scrolling and badge crowding
  - Maintained persistent `GlobalRail` (52px) with active highlight on `Users` icon and root breadcrumb `Vrello / Manajemen Pengguna` with return shortcut
  - Updated unit test suite in `layoutHierarchyHelpers.test.ts` (13 pass / 0 fail)
  - Gates: `npm test` 674 pass / 0 fail; `npm run test:smoke` 92 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-user-management-global-layout-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-user-management-global-layout.md`
  Refs: `docs/adr/0010-user-management-global-view-layout-isolation.md`

- `fix(layout)`: Isolate global view layout and direct profile breadcrumb hierarchy
  - Separated Operational Views (Projects/Marcom) from Global Account Views (Profile, Users)
  - Extracted pure helper module `layoutHierarchyHelpers.ts` with 12 unit tests verifying view categorization
  - Conditionally suppressed contextual `Sidebar.tsx` when `activeView === "profile"` while keeping `GlobalRail` (52px) visible
  - Restructured `TopNavBreadcrumbs.tsx` to render `Vrello / Profil & Keamanan Akun` directly with a "Kembali ke Workspace" shortcut button
  - Gated `ProjectsFilterBar` in `TopNav.tsx` strictly to task work items (`board`, `list`, `calendar`)
  - Preserved `lastTaskView` in `createUiSlice.ts` so navigating to Profile does not overwrite the user's prior work item view
  - Gates: `npm test` 673 pass / 0 fail; `npm run test:smoke` 92 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC (`Sidebar`: 187, `TopNavBreadcrumbs`: 175, `TopNav`: 151)
  Spec: `docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-profile-layout-hierarchy.md`
  Refs: `docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`

- `feat(profile)`: Implement dedicated user profile workspace view and self-service account API
  - Created first-class `ProfileView` workspace view (`view=profile`) and registered in SSOT `ViewMode` and `urlState.ts`
  - Created `/profile/page.tsx` redirecting authenticated users to `/?view=profile` (and unauthenticated to `/login`)
  - Added "Lihat Profil & Akun" trigger to `UserMenuDropdown.tsx`
  - Built secure `/api/user/profile` route (`GET`, `PATCH`) with NextAuth session scoping, Zod schema validation, and bcrypt password verification
  - Built pure helper modules `profileValidators.ts` and `profileHelpers.ts` with 18 comprehensive unit tests
  - Built modular UI components `ProfileHeader.tsx`, `ProfileAvatarUploader.tsx`, `ProfileAccessCard.tsx`, `ProfileSecurityCard.tsx`, and `ProfileView.tsx` coordinator (218 LOC $\le 250$ LOC)
  - Dynamically mounted `ProfileView` in `ActiveViewStage.tsx`
  - Gates: `npm test` 661 pass / 0 fail; `npm run test:smoke` 91 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-user-profile-view-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-user-profile-view.md`
  Refs: `docs/adr/0008-dedicated-user-profile-workspace-view.md`

- `feat(rbac)`: Session RBAC and permissions synchronization across all 7 views
  - Resolved missing "+ Add / New / Upload" buttons across 7 core pages for authenticated database & Google OAuth accounts
  - Hydrated `assignedBranchIds` in NextAuth JWT and Session tokens in `src/auth.ts`, `src/auth.config.ts`, and `src/types/next-auth.d.ts`
  - Built pure helper module `permissionsHelpers.ts` (`normalizeMarcomRole`, `resolveEffectivePermissionsUser`) with 8 unit tests
  - Connected `useMarcomPermissions()` to `useSession()` with resilient fallback to Zustand store
  - Added `syncSessionUser` action to synchronize NextAuth session profile into active user roster in `TopNav.tsx`
  - Gates: `npm test` 643 pass / 0 fail; `npm run test:smoke` 89 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-session-rbac-permissions-sync-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-session-rbac-permissions-sync.md`

- `feat(projects)`: Unified Projects work item creation via original Marcom Hub modal forms
  - Eliminated runtime HTTP 400 errors (`status: "PLANNED"` on placements) and unvalidated placeholder cards across Projects views
  - Built pure helper module `createModalHelpers.ts` with comprehensive unit test suite (`sanitizeDateInput`, `resolveInitialStatus`, `getInitialPlacementPayload`)
  - Created reusable `ProjectsCreateModalHost.tsx` host component (238 LOC) lazily importing `ContentPostModal`, `EventFormModal`, and `PlacementFormModal`
  - Integrated `ProjectsCreateModalHost` into `ProjectsCalendarView.tsx` with date hydration from calendar cells
  - Integrated `ProjectsCreateModalHost` into `ProjectsBoardView.tsx` with status mapping and replaced inline input form in `ProjectsBoardColumn.tsx` with type picker trigger menu (reduced `ProjectsBoardColumn.tsx` to 234 LOC)
  - Integrated `ProjectsCreateModalHost` into `ProjectsListView.tsx`, `ProjectsListHeader.tsx`, and `ProjectsListTable.tsx`
  - Removed obsolete dummy quick-create methods from `useProjectsCalendar.ts`, `useProjectsBoard.ts`, and `useProjectsList.ts`
  - Gates: `npm test` 635 pass / 0 fail; `npm run test:smoke` 88 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-projects-work-item-create-modals-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-projects-work-item-create-modals.md`

- `perf(media)`: Core Web Vitals image optimization via Next.js Image architecture
  - Configured `images.remotePatterns` in `next.config.ts` for Unsplash, Google User Content, and Supabase storage
  - Built pure helper module `appImageHelpers.ts` with layout presets (`avatar`, `thumbnail`, `card`, `lightbox`) and `shouldBypassOptimization` for `blob:`, `data:`, and SVG
  - Created resilient `<AppImage />` primitive in `src/components/ui/AppImage.tsx` handling CLS prevention, responsive width downscaling, WebP/AVIF transformations, and graceful load error recovery
  - Migrated 22 raw `<img>` instances across 16 components to `<AppImage />` (`TopNav`, `UserMenuDropdown`, `UsersActiveTab`, `UsersPendingTab`, `UsersRejectedTab`, `OutletApprovalQueueTab`, `Outlet360Drawer`, `SubmitDraftOutletModal`, `PlacementPhotoUploader`, `PlacementPhotoGallery`, `EventTableView`, `EventCardsView`, `MouDocumentViewerModal`, `DocumentPreviewModal`, `ContentDrawer`, `ContentPlannerView`, `ProjectsWorkItemCard`)
  - Completely eliminated all `@next/next/no-img-element` ESLint warnings
  - Gates: `npm run lint` (0 no-img-element warnings), `npm test` 629 pass / 0 fail; `npm run test:smoke` 87 pass / 0 fail; `npm run build:check` 0 errors; `next build` 27/27 pages compiled; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-01-core-web-vitals-image-optimization-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-core-web-vitals-image-optimization.md`

- `fix(layout)`: Synchronize TopNav avatar and profile with active NextAuth session
  - Extracted pure helper `getEffectiveProfile` and `getInitials` in `userProfileHelpers.ts` with comprehensive unit test suite
  - Prioritized active NextAuth `session.user` data (name, email, image, role) over static fallback user
  - Added real avatar image rendering (`<img>`) with graceful error fallback to initials
  - Synchronized active session user ID to Zustand `useWorkspaceStore.currentUserId`
  - Unified `UserMenuDropdown.tsx` profile card with `getEffectiveProfile` for 100% visual and data parity
  - Gates: `npm test` 621 pass / 0 fail; `npm run test:smoke` 86 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-01-topnav-avatar-profile-sync-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-topnav-avatar-profile-sync.md`

## [2026-10-31]

- `fix(theme)`: Set light theme as default for first-time visits
  - Updated `<ThemeProvider>` in `src/app/layout.tsx` to `defaultTheme="light"` and `enableSystem={false}`
  - Prevents forcing dark theme on initial visits before user preference is stored in localStorage
  - Preserves user manual theme toggling across sessions via localStorage
  - Gates: `npm test` 612 pass / 0 fail; `npm run test:smoke` 85 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(ui)`: Redesign MOU table rows with consolidated entity column and neutral glassmorphism
  - Consolidated standalone `Partner` and `Outlet` columns into unified `Partner & Outlet` column saving ~170px of table width
  - Formatted two-line entity cell with primary partner title and secondary outlet link with store icon
  - Replaced stacked `"No period set"` and `"No expiry"` badges with a clean, subtle `—` when no dates are configured
  - Styled MOU document chips with neutral glassmorphic backdrop blur (`bg-slate-100/80 dark:bg-slate-800/60`), subtle Drive/file icons, and clean preview modal triggers
  - Formatted `Type` column replacing raw database enum underscores with spaces
  - Gates: `npm test` 608 pass / 0 fail; `npm run test:smoke` 85 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-mou-table-rows-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-mou-table-rows-redesign.md`

- `feat(ui)`: Add unified header to User Management view
  - Extracted modular `UsersHeader.tsx` (198 LOC) matching the design language of `MousHeader`, `OutletsHeader`, and `DocumentsHeader`
  - Integrated Title row with `Users` icon, `{totalUsers}` counter badge, `{counts.pending}` pending review badge, concise subtitle, and spinning `RefreshCw` button
  - Stabilized Controls row with Framer Motion sliding pill tab switcher (`layoutId="activeUsersTabPill"` with spring dynamics and `useReducedMotion()`) and real-time quick search input with clear button
  - Embedded 4 `KpiSummaryCards` (Total Pengguna, Menunggu Review, Pengguna Aktif, Akun Ditolak/Nonaktif) with direct interactive click navigation to tabs
  - Created pure filtering logic `filterUsers` in `usersFilterHelpers.ts` with unit test suite
  - Refactored `UsersView.tsx` coordinator from 187 down to 123 LOC and applied full-bleed stage layout
  - Gates: `npm test` 608 pass / 0 fail; `npm run test:smoke` 85 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-users-header-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-users-header-redesign.md`

- `feat(ui)`: Add unified header to MOUs & Partnerships view
  - Extracted modular `MousHeader.tsx` (186 LOC) matching the design language of `OutletsHeader`, `DocumentsHeader`, and `PlacementsHeader`
  - Integrated Title row with `FileText` icon, `{totalMous}` counter badge, Refresh button, Export Center trigger, and `+ New MOU` modal trigger
  - Stabilized Filter row directly beneath Title with Framer Motion sliding pill animation (`layoutId="activeMouStatusPill"` with spring dynamics and `useReducedMotion()`), search input with clear button, searchable `CustomDropdown` selectors for Branch and MOU Type, and urgency filter chips
  - Embedded `KpiSummaryCards` directly within `MousHeader` with zero layout shifting
  - Refactored `MousView.tsx` from 417 down to 348 LOC and configured `MarcomTableShell` with `noPadding` and `hideHeader`
  - Gates: `npm test` 603 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-mous-header-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-mous-header-redesign.md`

- `feat(nav)`: Integrate User Management into central Workspace Stage Shell (ADR 07)
  - Extended domain SSOT `ViewMode` union with `"users"` in `src/types/index.ts` and registered it in `VALID_VIEWS` in `src/lib/router/urlState.ts`
  - Integrated dynamic `<UsersView />` loading directly into `src/components/views/ActiveViewStage.tsx` with fail-closed `isAdmin` check
  - Updated `GlobalRail.tsx` Users button to call `setActiveView("users")` and render active pill indicator (`isActive: activeView === "users"`)
  - Updated `UsersView.tsx` with self-hydrated session defaults and streamlined in-stage breadcrumb header
  - Converted `/admin/users/page.tsx` into an instant 307 server redirect to `/?view=users` preserving backwards-compatibility
  - Gates: `npm test` 603 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Refs: ADR 07 (`docs/adr/0007-integrate-user-management-into-workspace-stage.md`)
  Spec: `docs/superpowers/specs/2026-10-31-workspace-user-management-integration-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-workspace-user-management-integration.md`

- `feat(auth)`: Add Supervisor role with branch-scoped operational authority
  - Extended domain SSOT `UserRole` union with `"supervisor"` in `src/types/index.ts` and `assignedBranchIds` in `AppUser`
  - Added `SUPERVISOR` to `DbUserRole` enum and `assignedBranchIds String[] @default([])` to `User` in `prisma/schema.prisma`
  - Updated `src/lib/server/auth-helpers.ts` and `/api/admin/users/[id]` with role normalization, assigned branches persistence, and validation
  - Updated `src/lib/marcom/guards.ts` giving Supervisors Admin-level authority (approving MoUs, Outlets, Equipment Borrows, deleting MoUs/documents) strictly bounded by their assigned branches (`assignedBranchIds`)
  - Strictly blocked Supervisors from `MANAGE_MASTER_DATA` and user account management (`/admin/users`) preserving Least Privilege & Segregation of Duties
  - Added Supervisor option to `UserRoleSelect.tsx` and custom amber role badge in `UserMenuDropdown.tsx`
  - Gates: `npm test` 602 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-supervisor-role-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-supervisor-role.md`

- `feat(ui)`: Implement sitewide fluid active pills animation with Framer Motion
  - Replaced static CSS active classes with Framer Motion `motion.div layoutId="..."` sliding background pill animations
  - Configured premium spring dynamics (`type: "spring" as const, stiffness: 450, damping: 35`) and tactile tap feedback (`whileTap={{ scale: 0.95 }}`)
  - Added accessibility support via `useReducedMotion()` gracefully disabling layout animation for motion-sensitive users
  - Covered 10 segmented controls, tabs, and filter pills:
    1. Documents view switcher (Cards / Table) & Category filter chips (`DocumentsHeader.tsx`)
    2. Outlets view switcher (Table / Map / Approval) (`OutletsHeader.tsx`)
    3. Reports tab switcher (Monthly / Quarterly) (`ReportsHeader.tsx`)
    4. Inventory tab switcher (Catalog / Borrowing) & Grid/Table view switchers (`InventoryHeaderKpis.tsx`)
    5. Analytics brand filter pills (ALL / IM3 / TRI) (`AnalyticsHeader.tsx`)
    6. Branches status filter chips (All / Active / Inactive) (`BranchesHeader.tsx`)
    7. Projects group-by selector pills (Status / Priority / Branch / None) (`ProjectsListHeader.tsx`)
    8. Help & Documentation modal tab switcher (Shortcuts / Guides) (`HelpDocsModal.tsx`)
    9. Settings modal tab switcher (Backup & Data / Appearance) (`SettingsModal.tsx`)
    10. Placements outlet search brand override pills (IM3 / TRI) (`OutletSearchCombobox.tsx`)
  - Gates: `npm test` 599 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-sitewide-active-pills-animation-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-sitewide-active-pills-animation.md`

- `feat(headers)`: Swap controls row and KPI cards row across all 8 Marcom headers to stabilize pills
  - Inverted vertical order across `BranchesHeader`, `ReportsHeader`, `OutletsHeader`, `DocumentsHeader`, `InventoryHeaderKpis`, `PlacementsHeader`, `EventsHeader`, and `AnalyticsHeader`
  - Positioned Controls row (view switcher pills, tab switcher pills, filter chips, CustomDropdowns, and search inputs) directly beneath Title row (Row 2)
  - Positioned dynamic KPI Summary Cards (`KpiSummaryCards`) below controls (Row 3)
  - Completely eliminated layout jumping and Cumulative Layout Shift (CLS) when switching tabs or view modes where cards toggle visibility (e.g., Placements Map View, Reports Rekap POSM tab)
  - Gates: `npm test` 599 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-header-pills-cards-swap-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-header-pills-cards-swap.md`

- `feat(placements)`: Make placements header and view switcher persistent across tabs
  - Extracted atomic subcomponent `PlacementsHeader.tsx` (84 LOC) with animated view switcher pills (`motion.div layoutId="activePlacementViewPill"`), refresh trigger, export center trigger, and `+ Add Placement` action
  - Anchored `PlacementsHeader` and `KpiSummaryCards` persistently above dynamic content across Table, Map, and Recap view modes with 0px layout shift
  - Streamlined `PlacementsMapTab.tsx` and `PlacementsRecapTab.tsx` by removing redundant duplicate headers and KPI cards
  - Kept coordinator `PlacementsView.tsx` strictly under 250 LOC (213 LOC)
  - Gates: `npm test` 591 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`

- `feat(seed)`: Implement comprehensive QA edge-case database seeder
  - Rewrote `prisma/seed.ts` with clean database reset protocol (`cleanDatabase`) deleting in reverse FK topological order
  - Populated realistic Indonesian business domain data across User, Branch, Material, Outlet, MoU, Placement, InventoryItem, BorrowRecord, FieldEvent, ContentPost, DocumentItem, and MonthlyReport
  - Built comprehensive QA "what if" edge cases: SLA critical expired contracts, SLA warning near-expiry MoUs, pending approval aging >60d, GPS geolocation anomaly >1.4km deviation, installation blocked with ISSUE renovation status, permanent material without MoU warning, extreme billboard dimensions, cold/orphan outlets, overdue borrow records linked to events, and damaged returns tracking
  - Standardized branch indexing (`branch-1`..`branch-12`) and preserved catalog item counts (13 items) for 100% downstream integration test compatibility
  - Gates: `npm test` 591 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-qa-comprehensive-seeder.md`

- `fix(pipeline)`: Prevent HTML redirect response and JSON parse error in Pipeline view
  - Fixed NextAuth edge middleware authorized callback in `src/auth.config.ts` to return 401 JSON Response for `/api/` endpoints instead of redirecting to `/login` HTML page
  - Added defensive redirect/401 handling and content-type checking in `PipelineView.tsx` `fetchPipeline`
  - Wrapped `src/app/api/marcom/pipeline/route.ts` GET handler in `try / catch` returning structured HTTP 500 JSON
  - Added unit test suite in `src/auth.config.test.ts` (8 passed)
  - Gates: `npm test` 591 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(projects)`: Open work item detail drawer on row click in Projects list view
  - Attached `onClick={() => onSelect?.(item)}` and `cursor-pointer` to `<tr>` in `ProjectsListRow.tsx`
  - Added click event isolation (`e.stopPropagation()`) across all interactive cell controls (checkbox selection, title inline editing, status dropdown, date picker, PIC assignee editor, and actions button)
  - Gates: `npm test` 588 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(events)`: Add equipment logistics indicator chip to event cards
  - Created pure aggregation helper `getEventEquipmentSummary` in `src/lib/marcom/eventEquipmentHelpers.ts`
  - Integrated reactive indicator chip into `EventCardsView.tsx` with teal active state and rose overdue state
  - Added pre-fetch of `fetchBorrowRecords()` to `EventsView.tsx` for zero-lag cache resolution
  - 4 new unit tests; full suite 588 passed, 0 failed; build check 0 errors; drift check clean
  Spec: `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`
  Refs: `docs/adr/0006-event-card-equipment-indicator.md` (ADR-06)

- `fix(inventory)`: Fix equipment inventory navigation reverting appMode to projects
  - Added `"inventory"` to `MARCOM_VIEW_SET` in `src/lib/store/slices/createUiSlice.ts` so `setActiveView("inventory")` resolves `appMode = "marcom"`
  - Added `"inventory"` and `"equipment"`/`"equipments"` normalization aliases to `VALID_VIEW_MODES` and `MARCOM_VIEWS` in `src/lib/router/urlState.ts`
  - Added `"inventory"` label to `MARCOM_VIEW_LABELS` in `src/components/layout/topNavConstants.ts`
  - Registered Equipment Inventory in `CommandPalette.tsx` views list and quick actions
  - Gates: `npm test` 584 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean


- `fix(projects)`: Replace invalid nested `<tr className="contents">` with `<Fragment>` in `ProjectsListTable`
  - Fixed HTML hydration error where `<tr>` cannot be a child of `<tr>`
  - Grouped section rows (header, items, quick-add) are now direct children of `<tbody>`
  - Gates: `npm test` 569 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `refactor(projects)`: Remove Projects Gantt view
  - Deleted 4 core Gantt files: `ProjectsGanttView.tsx`, `useProjectsGantt.ts`, `GanttBar.tsx`, `GanttUnscheduledShelf.tsx` (-790 LOC)
  - Removed `"gantt"` from `ViewMode` union in `src/types/index.ts`
  - Removed `"gantt"` from `VALID_VIEW_MODES` in `src/lib/router/urlState.ts`
  - Removed dynamic import and switch case from `src/components/views/ActiveViewStage.tsx`
  - Removed Gantt navigation item from `PROJECTS_NAV_ITEMS` and unused `Clock` icon in `navConfig.ts`
  - Updated Projects view guards in `Sidebar.tsx` to `["board", "list", "calendar"]`
  - Removed hotkey `"4"` mapping from `useWorkspaceHotkeys.ts`
  - Removed Gantt entry and unused `GanttChart` icon from `CommandPalette.tsx`
  - Removed Gantt button and unused `Milestone` icon from `MoreAppsMenu.tsx`
  - Updated `HelpDocsModal.tsx` shortcuts label to `"1 - 3"`, removed Gantt guide item and unused `Layers` icon
  - Removed Gantt features item and updated marketing subtitle in `UpgradeModal.tsx`
  - Added hydration and normalization fallback for legacy/persisted `gantt` state to `"list"` in `createUiSlice.ts` and `useWorkspaceStore.ts`
  - Gates: `npm test` 569 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-remove-gantt-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-remove-gantt.md`
  Refs: `docs/remove-gantt/adr.md`

- `fix(auth)`: Correct login error signaling and enforce approval status (B1–B5)
  - `authorize()` throws client-safe `CredentialsSignin` subclasses (`pending` / `rejected`), so PENDING/REJECTED users see the correct message instead of "Email atau password tidak sesuai"
  - Middleware `authorized()` requires `status === "APPROVED"`; `auth.config.ts` now maps `id`/`role`/`status` into the session (required by the Edge middleware instance)
  - `/login` only redirects APPROVED sessions and renders the PENDING/REJECTED banner; `/register` routes non-APPROVED sessions to `/login` — prevents redirect loops
  - JWT hydration returns `null` when claims cannot be resolved, invalidating the session and clearing the cookie
  - `PATCH /api/admin/users/[id]` blocks self role/status changes (400)
  - Emails normalized (lowercase + trim) in register, credentials login, Google sign-in, and JWT hydration
  - 12 new unit tests; `npm test` 569 pass / 0 fail; build check 0 errors; drift check clean
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/auth-user-management/login-fix-plan.md`

---

## [2026-10-30]

- `style(layout)`: Align AppModeSegmentedControl styling with original workspace version
  - Restored track padding `px-2.5 pt-2.5 pb-1.5` and border token `border-slate-200/60`
  - Restored two-line centered layout for `Marcom Hub` with `min-h-[38px]` button height
  - Restored active pill border and shadow tokens matching legacy workspace UI
  - Gates: `npm test` 582 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `style(layout)`: Restore Projects Kanban icon, Marcom Hub label, and sliding pill animation
  - Replaced `FolderKanban` with original `Kanban` icon in Projects mode button
  - Renamed `Marcom` to `Marcom Hub` in mode switcher and GlobalRail
  - Restored Framer Motion animated sliding pill (`motion.div layoutId="activeAppModeIndicator"`)
  - Extracted `AppModeSegmentedControl.tsx` (104 LOC), reducing `Sidebar.tsx` coordinator to 182 LOC
  - Gates: `npm test` 582 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(inventory)`: Add Field Event Equipment Inventory & Borrowing System
  - Implemented master catalog `InventoryItem` with unique codes, category filters, and unit tracking
  - Implemented borrow workflow `BorrowRecord` and `BorrowItem` with sequential code `BRW-YYYYMMDD-NNN` and multi-state lifecycle (`PENDING` → `APPROVED` → `ACTIVE` → `RETURNED`)
  - Added atomic unit reservation and condition inspection on returns (`EXCELLENT` ... `DAMAGED` / `LOST`)
  - Added read-only equipment borrowing summary and shortcut inside `EventFormModal`
  - Added 6 API route handlers under `src/app/api/marcom/inventory/`
  - Built modular UI coordinator under `src/components/views/InventoryView/` (223 LOC coordinator) with Card Grid, Table View, Borrow Records Table, and Kanban Tracking Board
  - Seeded 13 items across 4 categories in `prisma/seed.ts`
  - Gates: `npm test` 582 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-30-inventory-system-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-inventory-system.md`
  Refs: `docs/inventory-system/adr.md`

- `feat(auth)`: Redesign login, register, and registration-success screens
  - Split-shell layout that mirrors the product: dark `#0F1115` brand rail with
    the Sidebar's emerald→teal "V" mark, CSS kanban preview, and feature cards;
    light/dark workspace panel on the right
  - New auth primitives: `AuthCard`, `AuthField`, `AuthAlert`,
    `AuthSubmitButton`, `GoogleButton`, `PasswordStrength`,
    `AuthBoardPreview`, `AuthBrandPanel`
  - Login: Google + credentials, deduplicated PENDING/REJECTED/error banners,
    password visibility, field-level semantics, preserved B1–B5 behavior
  - Register: field-level validation, 4-segment password strength meter,
    live confirm-match indicator, approval-pending timeline on success
  - **Root-cause fix:** `globals.css` never mapped the shadcn HSL tokens into
    Tailwind's theme, so `bg-card`, `bg-primary`, `border-border`,
    `text-foreground`, `bg-secondary`, `ring-primary`, etc. were never
    generated. Added an `@theme inline` block; `inline` keeps the ClickUp hex
    `--color-*` tokens working for direct variable usage
  - **Root-cause fix:** Tailwind 4's `dark:` variant defaults to
    `prefers-color-scheme`, while next-themes toggles `.dark`. Added
    `@custom-variant dark (&:where(.dark, .dark *))` so class-based dark mode
    works app-wide
  - `ThemeToggle` now derives its icon from `resolvedTheme`, so system-selected
    themes render the correct control
  - Visual QA at 375 / 768 / 1440 px in light + dark: no horizontal overflow;
    keyboard focus rings verified on cross-links and form controls
  - Gates: `npm test` 569 pass / 0 fail; `npm run build:check` 0 errors;
    `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-30-auth-ui-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-ui-redesign.md`

- `feat(projects)`: Feature parity across unified Projects views (Board, List, Calendar, Gantt)
  - **Filter Bar (`ProjectsFilterBar`)**: Multi-criteria search and filter toolbar (search, types, columns, branches, pics, dateFrom, dateTo) with `applyProjectsFilters` pure function and 10 unit tests. Integrated directly into `TopNav` when in Projects mode.
  - **Board View (`ProjectsBoardView`)**:
    - Within-column reordering persisted in `viewPreferences.projectsBoardOrder`
    - Visual drop-line indicator (`DropLineIndicator`) with blue dot and guide
    - WCAG 2.2 keyboard dragging via `KeyboardSensor` with `sortableKeyboardCoordinates` and screen-reader announcements
    - Card enhancements: media thumbnail preview, subtask/checklist progress pill, overdue red date highlight, and quick `⋯` context menu for status move
    - Per-column select-all and card checkboxes connected to floating `ProjectsBulkActionBar` (bulk status change, bulk delete, clear)
    - Inline quick-create form per column with entity type selector (Content Post, Field Event, Placement)
  - **List View (`ProjectsListView`)**:
    - Sortable column headers with cycle none → asc → desc → none and active arrows
    - Group By toolbar selector (Type, Status, Branch, PIC, None) with collapsible groups and inline `+ New [Item]` in group footers
    - Inline editing per row: double-click title, click status for dropdown, click date for date input, click PIC for text input
    - Columns visibility dropdown menu wired to `viewPreferences.visibleFields`
    - Per-row checkbox and header select-all wired to `ProjectsBulkActionBar`
    - Overdue row highlight with red date and dimmed text
  - **Calendar View (`ProjectsCalendarView`)**:
    - Status-colored chips (15% bg opacity, 30% border, full color text) based on unified `STATUS_HEX_COLORS`
    - Day cell overflow handling (max 3 chips per day with `+N more` button opening `CalendarOverflowPopover`)
    - Empty day area click/double-click opening `CalendarCreatePopover` with date pre-filled
    - Multi-day Field Event spanning across date ranges with `↳` continuation indicator
  - **Gantt View (`ProjectsGanttView`)**:
    - Interactive drag operations: move body (shifts dates), left resize handle (shifts startDate), right resize handle (shifts endDate), and progress circle drag (updates event progress)
    - Collapsible left sidebar (280px) with "Hide Tasks" / "Show Tasks" toggle
    - Bottom "Unscheduled Shelf" for items lacking date fields with quick-schedule date picker popover
    - Zoom levels: Day (48px/col), Week (36px/col), Month (24px/col)
    - Screen-reader announcements for drag status
  - **Invariants & Gates**:
    - All 10 coordinator files strictly ≤ 250 LOC (`ProjectsBoardView` 114 LOC, `ProjectsListView` 89 LOC, `ProjectsCalendarView` 121 LOC, `ProjectsGanttView` 217 LOC)
    - Drift check passes: 0 drift detected
    - Build check passes: 0 TypeScript errors
    - Test suite passes: 549 tests pass, 0 fail
  Spec: `docs/remove-general-tasks/02-feature-parity-spec.md`
  Plan: `docs/remove-general-tasks/02-feature-parity-plan.md`
  ADR:  `docs/remove-general-tasks/02-feature-parity-adr.md`

- `refactor(marcom-hub)`: Remove general tasks and repurpose project views for unified Marcom Work Items
  - Implement unified `ProjectsBoardView`, `ProjectsListView`, `ProjectsCalendarView`, and `ProjectsGanttView` in `src/components/views/ProjectsView/` across Content Posts, Field Events, and Placements
  - Repurpose Board, Calendar, List, and Gantt sub-views inside `ContentPlannerView` to manage `ContentPostItem`
  - Remove task bridge & sync code across Events, Placements, MOUs, and Outlets views; create `src/lib/marcom/eventChecklist.ts`
  - Unify sidebar and mode switcher between Projects and Marcom Hub modes via `src/components/layout/navConfig.ts`
  - Delete task, space, and automation Zustand slices (`createTaskSlice`, `createSpaceSlice`, `createAutomationSlice`, `syncHelpers`)
  - Delete task UI components (`src/components/tasks/`), legacy views (`BoardView/`, `ListView/`, `GanttView/`, `CalendarView/`, `ChannelView/`, `HomeView/`), and task modals
  - Delete `/api/tasks` and `/api/realtime` routes and `src/lib/tasks/`
  - Drop Prisma task models (`SpaceItem`, `FolderItem`, `ListItem`, `TaskItem`, `TaskCommentItem`) via migration `20261029134026_drop_task_models`
  - Extract `ActiveViewStage.tsx` from `page.tsx` maintaining all coordinator files ≤ 250 LOC (`page.tsx` 84 LOC, `Sidebar.tsx` 214 LOC, `useWorkspaceStore.ts` 122 LOC)
  - All 539 unit tests pass, 0 fail; build check 0 errors; drift check clean
  Spec: `docs/superpowers/specs/2026-10-30-remove-general-tasks-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-remove-general-tasks.md`
  ADR:  `docs/remove-general-tasks/adr.md`

- `fix(auth)`: Resolve 4 audit issues from auth implementation
  - `fix(auth)`: Make JWT type fields required in `src/types/next-auth.d.ts`
  - `fix(middleware)`: Implement Auth.js v5 JWT verification with split `src/auth.config.ts` for Edge compatibility
  - `fix(register)`: Extract `RegisterSuccess.tsx` subcomponent, bringing `RegisterForm.tsx` to 249 LOC
  - `test(mailer)`: Add silent-catch tests for `sendMail` rejection path in `src/lib/server/mailer.test.ts`
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management-fixes.md`

- `docs(auth-fixes)`: Fix plan for 4 audit issues found in auth implementation
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management-fixes.md`
  Issues: JWT optional fields, cookie-only middleware, RegisterForm LOC, missing mailer failure test

- `feat(auth)`: Add credential registration, admin approval gate, and user management page
  - Add User Prisma model (`DbUserRole`/`DbUserStatus` enums, `PENDING` approval flow)
  - Add `/register` page with email+password form and Google OAuth path
  - Add `/login` page (credentials + Google, status-aware error messages)
  - Add NextAuth Credentials provider with bcryptjs, status blocking, lastLoginAt update
  - Add `/api/auth/register` endpoint (`POST`, bcrypt hash, duplicate guard)
  - Add `/api/admin/users` GET + PATCH + DELETE endpoints (admin-only)
  - Add `/admin/users` full-page view (Pending/Active/Rejected tabs)
  - Add Nodemailer email notifications for approval and rejection
  - Add Next.js middleware protecting all app routes via session cookie validation
  - Add `bcryptjs` and `nodemailer` dependencies
  - Add `auth-helpers` and `mailer` server utilities with unit test suites
  - Remove deprecated `LoginModal`, `InviteModal`, `TeamsModal`, `ShareModal`, and `AuthSync`
  - Remove persona switcher from `UserMenuDropdown` and `SettingsModal`
  - Remove Invite rail item; update Teams rail item to `/admin/users` navigation link
  - Remove Share button from `TopNavActionModals`
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`  
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management.md`  
  ADR:  `docs/auth-user-management/adr.md`

- `docs(auth)`: ARD, spec, and implementation plan for Authentication & User Management system
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management.md`
  ADR:  `docs/auth-user-management/adr.md`

---

## [2026-10-29]

- `fix(reports)`: Add outer scroll container to prevent content clipping  
  Ref: `docs/handover-scroll-reports-view.md`
- `feat(reports)`: Reports view UX improvements (KPI cards, progress bar, period highlight, empty state, report deletion)  
  Spec: `docs/superpowers/specs/2026-10-29-reports-view-improvements-design.md`  
  Plan: `docs/superpowers/plans/2026-10-29-reports-view-improvements.md`  
  ADR: `docs/reports-improvements/adr.md`
- `fix(documents)`: Add outer scroll container to prevent content clipping  
  Ref: `docs/handover-scroll-documents-view.md`

---

## [2026-10-27]

- `refactor(workspace)`: Remove multi-workspace layer — single-tenant simplification  
  Spec: `docs/superpowers/specs/2026-10-27-remove-workspace-single-tenant-design.md`  
  Plan: `docs/superpowers/plans/2026-10-27-remove-workspace-single-tenant.md`

---

## [2026-10-01]

- `feat(analytics)`: Analytics defect fixes  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-defect-fixes.md`
- `feat(analytics)`: Phase 1 — Backend persistence engine fixes  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-1-backend-persistence-engine-fixes.md`
- `feat(analytics)`: Phase 2 — Multi-dimensional filters & actionable KPIs  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-2-multi-dimensional-filters-actionable-kpis.md`
- `feat(analytics)`: Phase 3 — Modular charts, accessibility, drilldown  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-3-modular-charts-accessibility-drilldown.md`
- `refactor(outlets)`: Remove outlet tier option 2a  
  Spec: `docs/superpowers/specs/2026-10-01-remove-outlet-tier-option-2a-design.md`  
  Plan: `docs/superpowers/plans/2026-10-01-remove-outlet-tier-option-2a.md`

## [2026-09-30]

- `feat(mous)`: MOU table phase 1–4 (layout, validity countdown, filters, drawer-first architecture)
- `feat(outlets)`: Pilih Outlet phase 1–4 (UI consolidation, initialization safety, tokenized search, brand sync)
- `feat(placements)`: Placements table UI/UX overhaul
- `refactor(outlets)`: Outlet-MOU status refactor

## [2026-09-29]

- `feat(branches)`: Branches table UI/UX overhaul  
  Plan: `docs/superpowers/plans/2026-09-29-branches-table-ui-ux-overhaul.md`
- `feat(outlets)`: Outlet form modal UX overhaul  
  Plan: `docs/superpowers/plans/2026-09-29-outlet-form-modal-ux-overhaul.md`

## [2026-09-28]

- `perf(marcom)`: Batch delete N+1 query fix  
  Plan: `docs/superpowers/plans/2026-09-28-batch-delete-n-plus-one.md`
- `perf(marcom)`: Marcom table search performance  
  Plan: `docs/superpowers/plans/2026-09-28-marcom-table-search-performance.md`
- `feat(outlets)`: Master data boundary guards — outlet backfill  
  Plan: `docs/superpowers/plans/2026-09-28-master-data-boundary-guards-outlet-backfill.md`

## [2026-09-27]

- `refactor(types)`: Consolidate type definitions — SSOT  
  Plan: `docs/superpowers/plans/2026-09-27-consolidate-type-definitions-ssot.md`
- `refactor(mous)`: Decompose MousView (god-file strangler)  
  Plan: `docs/superpowers/plans/2026-09-27-decompose-mous-view.md`
- `refactor(store)`: God-file store strangler plan  
  Plan: `docs/superpowers/plans/2026-09-27-god-file-store-strangler-plan.md`
- `refactor(marcom)`: Reactive marcom data store  
  Plan: `docs/superpowers/plans/2026-09-27-reactive-marcom-data-store.md`
- Various: decouple-task-marcom-hardcoded-ids, eliminate-duplicate-state-phase-2, fix-kanban-marcom-desync, formalize-related-marcom-type, prisma-frontend-schema-divergence, relocate-prisma-singleton, type-outlet-backfill-prisma-client, workspace-store-slices-composition, auto-backfill-outlet-gps

## [2026-09-25]

- `feat(placements)`: Placement form wizard  
  Plan: `docs/superpowers/plans/2026-09-25-placement-form-wizard.md`
- `feat(placements)`: Placement wizard UX polish

## [2026-09-24]

- `feat(workspace)`: Workspace boundary — tenant isolation in views  
  Plan: `docs/superpowers/plans/2026-09-24-workspace-boundary-tenant-isolation-in-views.md`

## [2026-09-21]

- `feat(outlets)`: Draft outlet approval flow  
  Spec: `docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md`
- `feat(posm)`: Field POSM execution  
  Spec: `docs/superpowers/specs/2026-09-21-field-posm-execution-design.md`
- `feat(reports)`: POSM quarterly regional reports  
  Spec: `docs/superpowers/specs/2026-09-21-posm-quarterly-regional-reports-design.md`
- `feat(router)`: URL routing and state sync  
  Spec: `docs/superpowers/specs/2026-09-21-url-routing-and-state-sync-design.md`

## [2026-09-20]

- `feat(pipeline)`: Pipeline view  
  Spec: `docs/superpowers/specs/2026-09-20-pipeline-view-design.md`

## [2026-09-19]

- `refactor(store)`: God files strangler phase 1  
  Spec: `docs/superpowers/specs/2026-09-19-god-files-strangler-phase-1-design.md`

## [2026-09-17]

- `feat(placements)`: Placement maps  
  Spec: `docs/superpowers/specs/2026-09-17-placement-maps-design.md`

## [2026-09-15]

- `feat(gdrive)`: Google Drive picker integration  
  Spec: `docs/superpowers/specs/2026-09-15-google-drive-picker-integration-design.md`
- `feat(marcom)`: Marcom work items workspace scoping  
  Spec: `docs/superpowers/specs/2026-09-15-marcom-work-items-workspace-scoping-design.md`

## [2026-09-14]

- `feat(mode)`: Dual context mode  
  Spec: `docs/superpowers/specs/2026-09-14-dual-context-mode-design.md`
- `feat(events)`: Separate content and field events  
  Spec: `docs/superpowers/specs/2026-09-14-separate-content-and-field-events-design.md`

## [2026-09-07]

- `feat(marcom)`: Marcom port — initial marcom domain integration  
  Spec: `docs/superpowers/specs/2026-09-07-marcom-port-design.md`
