# SESSION_STATE.md — vrello-up

> **Update this file BEFORE ending every session.** Next session reads this first.

---

## Current Status

**Date:** 2026-11-01  
**Active Branch:** `vicky`  
**Active Feature:** Global View Layout Isolation & Profile Hierarchy (`layoutHierarchyHelpers.ts`, `Sidebar.tsx`, `TopNav.tsx`, `TopNavBreadcrumbs.tsx`, `createUiSlice.ts`) — **IMPLEMENTED & VERIFIED**  
**Previous Feature:** Dedicated User Profile Workspace View (`ProfileView.tsx`, `ProfileHeader.tsx`, `ProfileAvatarUploader.tsx`, `ProfileAccessCard.tsx`, `ProfileSecurityCard.tsx`, `/api/user/profile`, `profileValidators.ts`, `profileHelpers.ts`)  

---

## What Was Completed This Session

1. **Global View Layout Isolation & Profile Hierarchy (`layoutHierarchyHelpers.ts`, `Sidebar.tsx`, `TopNav.tsx`, `TopNavBreadcrumbs.tsx`, `createUiSlice.ts`):**
   - **Root Cause Evaluated:** Placing `profile` in `appMode: "tasks"` by default caused `TopNavBreadcrumbs` to render `Vrello / Projects / profile`, leaking the task filter bar (`ProjectsFilterBar`) into the profile view and cluttering the stage with the 240px operational `Sidebar`.
   - **ADR 09 & Spec:** Authored ADR 09 (`docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`) establishing clear bifurcation between Operational Views and Global Account Views.
   - **Pure Helpers Module (`layoutHierarchyHelpers.ts`):** Defined `WORK_ITEM_VIEWS` and `GLOBAL_ACCOUNT_VIEWS`. Implemented `shouldRenderSidebar`, `shouldRenderProjectsFilterBar`, and `getGlobalBreadcrumbInfo`. Added 12 unit tests in `layoutHierarchyHelpers.test.ts` (100% pass).
   - **Sidebar Unmount on Profile (`Sidebar.tsx`):** Conditionally returned `null` when `!shouldRenderSidebar(activeView)`, freeing 240px of screen width for a clean, full-stage profile experience while keeping `GlobalRail` (52px) persistently visible.
   - **TopNav Filter Bar Gating (`TopNav.tsx`):** Restricted `ProjectsFilterBar` strictly to task work items (`board`, `list`, `calendar`) via `shouldRenderProjectsFilterBar`.
   - **Direct Root Breadcrumb (`TopNavBreadcrumbs.tsx`):** Rendered `Vrello / Profil & Keamanan Akun` directly after root brand anchor with `User` icon and added an accessible "Kembali ke Workspace" shortcut button.
   - **UI Slice State Preservation (`createUiSlice.ts`):** Prevented `setActiveView("profile")` from overwriting `lastTaskView` or `lastMarcomView`.
   - **Verification Gates:** `npm run drift:check` (clean, 41 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (673 passed, 0 failures), all coordinator files strictly $\le 250$ LOC (`Sidebar`: 187, `TopNavBreadcrumbs`: 175, `TopNav`: 151).

2. **Dedicated User Profile Workspace View (`ProfileView.tsx`, `ProfileHeader.tsx`, `ProfileAvatarUploader.tsx`, `ProfileAccessCard.tsx`, `ProfileSecurityCard.tsx`, `/api/user/profile`, `profileValidators.ts`, `profileHelpers.ts`):**
   - **User Intent & Problem Statement:** Credentials users (email & password) had no self-service mechanism to change their display name, upload/change profile avatar, or update their account password. While Google OAuth users have profiles hydrated from Google, standard accounts had no profile management screen or API.
   - **Architecture & ADR 08:** Authored ADR 08 (`docs/adr/0008-dedicated-user-profile-workspace-view.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-user-profile-view-design.md`) establishing Option 1 (Dedicated Workspace View `activeView: "profile"`).
   - **SSOT Domain Types (`src/types/index.ts`):** Added `"profile"` to `ViewMode` union, and declared `UserProfileResponse` and `UpdateProfilePayload` interfaces.
   - **URL Routing & Navigation (`urlState.ts`, `src/app/profile/page.tsx`, `UserMenuDropdown.tsx`):** Registered `"profile"` in `VALID_VIEW_MODES` and `urlState.ts`. Built Next.js redirection page at `/profile/page.tsx` redirecting to `/?view=profile` (and unauthenticated users to `/login`). Added "Lihat Profil & Akun" action trigger with `UserIcon` to `UserMenuDropdown.tsx` (120 LOC $\le 250$ LOC).
   - **Backend Security & API Route (`profileValidators.ts`, `/api/user/profile/route.ts`):**
     - Implemented `updateProfileSchema` in `profileValidators.ts` (Zod validation for name 2-80 chars, URL/data URI avatar, password length $\ge 8$, and matching confirmation). 8 unit tests in `profileValidators.test.ts` passing.
     - Implemented `GET` and `PATCH` endpoints in `src/app/api/user/profile/route.ts` with NextAuth session scoping.
     - Enforced Google Account protection (blocks password change for Google accounts), verified existing passwords via bcrypt comparison, hashed new passwords (cost factor 12), and mapped nullable avatar to Prisma `String @default("")`.
   - **Pure UI Helpers (`profileHelpers.ts`):** Implemented `formatBranchBadges`, `validatePasswordForm`, and `sanitizeAvatarUrl` with 10 unit tests in `profileHelpers.test.ts` passing.
   - **Atomic Components & Coordinator (`ProfileView/`):**
     - `ProfileHeader.tsx`: 73 LOC. Workspace view header with icon, title, subtitle, and account badge (`Google Verified` vs `Credentials Account`).
     - `ProfileAvatarUploader.tsx`: 196 LOC. `<AppImage />` preview with fallback initials, client-side Canvas compression to WebP ($\le 400\times 400$), URL input, and avatar removal.
     - `ProfileAccessCard.tsx`: 68 LOC. Displays RBAC role badge, registration date, and assigned branch chips. Extracted to protect coordinator size.
     - `ProfileSecurityCard.tsx`: 144 LOC. Google Identity shield card for OAuth users or password change form with show/hide password toggles for Credentials users.
     - `ProfileView.tsx`: 218 LOC ($\le 250$ LOC). Responsive two-column coordinator with Zustand store sync (`syncSessionUser`), data mutation handling, and toast feedback.
     - Mounted dynamically in `ActiveViewStage.tsx` (`case "profile":`).
   - **Verification Gates:** `npm run drift:check` (clean, 40 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (91 passed, 0 failed), `npm test` (661 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Session RBAC & Permissions Synchronization across All 7 Views (`permissions.ts`, `permissionsHelpers.ts`, `auth.ts`, `auth.config.ts`, `next-auth.d.ts`, `TopNav.tsx`, `createDataSlice.ts`):**
   - **Root Cause Evaluated:** All "+ Add / New / Upload" buttons across 7 core pages (Media Placements, Field Events, MOU, Branches, Outlets, Equipment Inventory, Documents) were conditionally gated by `useMarcomPermissions()`. Previously, `useMarcomPermissions()` resolved roles against a static mock array `const members = SEED_USERS` (`user-1` to `user-5`). When a user logged in with a real database account (e.g. `user-admin` or Google OAuth), their ID was not in `SEED_USERS`, causing `resolveMarcomRole` to fail closed to `"viewer"`. As a `"viewer"`, all create and manage permissions were revoked, making Add buttons vanish across the site.
   - **NextAuth Token & Session Claims Hydration:** Added `assignedBranchIds?: string[]` to `Session["user"]`, `User`, and `JWT` in `src/types/next-auth.d.ts`. Updated `resolveJwtClaims` in `src/lib/server/auth-helpers.ts` to propagate branch assignments, updated Credentials `authorize()` and `jwt()` callback in `src/auth.ts`, and updated `session()` callback in `src/auth.config.ts`. Added test cases in `src/lib/server/auth-helpers.test.ts` (19/19 passing).
   - **Pure Helper Module (`permissionsHelpers.ts`):** Implemented `normalizeMarcomRole` with case-insensitive trimming and fail-closed validation, and `resolveEffectivePermissionsUser` prioritizing active `session.user` over fallback store users with automatic branch scope extraction. Created comprehensive unit test suite in `src/lib/marcom/permissionsHelpers.test.ts` (8 passing tests).
   - **Hook Integration (`permissions.ts`):** Connected `useMarcomPermissions()` to `useSession()` from `next-auth/react`. Evaluates permissions dynamically for the authenticated user while providing resilient fallback to Zustand store for SSR, offline, and unit tests.
   - **Zustand Store Parity:** Added `syncSessionUser` action in `createDataSlice.ts` and called it in `TopNav.tsx` to keep Zustand's active user roster synchronized with real NextAuth session users.
   - **Verification Gates:** `npm run drift:check` (clean, 39 paired specs/plans), `npm run build:check` (0 TypeScript errors), `npm run test:smoke` (89 passed, 0 failed), `npm test` (643 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Unified Projects Work Item Creation via Original Marcom Hub Forms:**
   - **Root Cause Evaluated:** Quick creation triggers in Projects views (`useProjectsCalendar.handleCreateType`, `useProjectsBoard.handleQuickCreate`, `useProjectsList.handleQuickAddInGroup`) performed blind, minimal POST mutations with hardcoded dummy titles and invalid states (such as `status: "PLANNED"` on placements, which failed with HTTP 400). Placements bypassed the required 4-step wizard (outlet, material, geofence, photos) and field events bypassed logistics checklists.
   - **Pure Helpers Module (`createModalHelpers.ts`):** Implemented `sanitizeDateInput` with ISO date fallback, `resolveInitialStatus` mapping target board columns to valid entity statuses, and `getInitialPlacementPayload` enforcing state machine invariants (`NOT_STARTED` default). Added comprehensive unit tests in `createModalHelpers.test.ts` (6 passing tests).
   - **Modal Host Component (`ProjectsCreateModalHost.tsx`):** Built coordinator ($\le 250$ LOC, 238 LOC) mirroring `ProjectsDetailDrawerHost.tsx`. Dynamically imports `ContentPostModal`, `EventFormModal`, and `PlacementFormModal` via `next/dynamic` (`ssr: false`), wires Zustand data stores (`branches`, `outlets`, `materials`, `mous`, `placements`, `members`), handles submission and cache invalidation (`fetchPosts`, `fetchEvents`, `fetchPlacements`), and integrates with `GoogleDriveLinkModal`.
   - **Calendar Integration (`ProjectsCalendarView.tsx`, `useProjectsCalendar.ts`):** Connected `CalendarCreatePopover` to trigger `ProjectsCreateModalHost` pre-filled with the selected calendar cell date. Removed legacy dummy creation endpoint calls.
   - **Board Integration & Deconstruction (`ProjectsBoardView.tsx`, `ProjectsBoardColumn.tsx`, `useProjectsBoard.ts`):** Replaced inline title text form in `ProjectsBoardColumn.tsx` with a type picker trigger menu (`Content Post`, `Field Event`, `Media Placement`), saving ~33 LOC and bringing `ProjectsBoardColumn.tsx` safely down to 234 LOC ($\le 250$ LOC). Connected `ProjectsBoardView.tsx` with column status mapping and mounted `ProjectsCreateModalHost`.
   - **List View Integration (`ProjectsListView.tsx`, `ProjectsListHeader.tsx`, `ProjectsListTable.tsx`, `useProjectsList.ts`):** Added "+ New Item" trigger with type selector menu in `ProjectsListHeader.tsx` and group row actions in `ProjectsListTable.tsx`. Mounted `ProjectsCreateModalHost` in `ProjectsListView.tsx` and removed defunct `handleQuickAddInGroup`.
   - **Verification Gates:** `npm run drift:check` (clean, 0 drift), `npm run build:check` (0 errors), `npm run test:smoke` (88 passed, 0 failed), `npm test` (635 passed, 0 failures), all coordinator files strictly $\le 250$ LOC (`ProjectsCreateModalHost`: 238, `ProjectsBoardColumn`: 234, `ProjectsBoardView`: 199, `ProjectsCalendarView`: 154, `ProjectsListView`: 118).

2. **Core Web Vitals Next.js Image Optimization (`AppImage.tsx`, `appImageHelpers.ts`, `next.config.ts`, 16 components):**
   - **Root Cause Evaluated:** 22 raw `<img>` instances across 16 components lacked layout sizing, leading to Cumulative Layout Shift (CLS) on high-latency field connections, excessive bandwidth consumption without modern WebP/AVIF compression or responsive srcset downscaling, and Next.js compiler warnings under `@next/next/no-img-element`.
   - **Remote Host Whitelist (`next.config.ts`):** Configured `images.remotePatterns` for `images.unsplash.com`, `lh3.googleusercontent.com`, `*.googleusercontent.com`, and `*.supabase.co`.
   - **Pure Layout Helpers (`appImageHelpers.ts`):** Created `shouldBypassOptimization` for `blob:`, `data:`, SVG, and empty URLs to prevent runtime crashes during client-side photo picking. Added `resolveImageSizes` mapping presets (`avatar`: 36px, `thumbnail`: 64px/96px, `card`: 100vw/50vw/33vw, `lightbox`: 100vw/1200px, `full`: 100vw). Comprehensive unit test suite in `appImageHelpers.test.ts` (8 tests passing).
   - **Resilient Primitive (`AppImage.tsx`):** Built `<AppImage />` with automatic aspect ratio geometry (eliminating CLS), `sizes` optimization, automatic unoptimized bypass for blob/data URLs, and graceful placeholder error recovery.
   - **Full Codebase Migration (22 instances across 16 components):** Migrated `TopNav.tsx`, `UserMenuDropdown.tsx`, `UsersActiveTab.tsx`, `UsersPendingTab.tsx`, `UsersRejectedTab.tsx`, `OutletApprovalQueueTab.tsx` (2x), `Outlet360Drawer.tsx` (2x), `SubmitDraftOutletModal.tsx`, `PlacementPhotoUploader.tsx` (2x), `PlacementPhotoGallery.tsx` (3x), `EventTableView.tsx`, `EventCardsView.tsx`, `MouDocumentViewerModal.tsx`, `DocumentPreviewModal.tsx`, `ContentDrawer.tsx`, `ContentPlannerView.tsx` (2x), `ProjectsWorkItemCard.tsx`.
   - Gates: `npm run lint` (0 `@next/next/no-img-element` warnings), `npm run build:check` (0 errors), `npm run test:smoke` (87 passed, 0 failed), `npm test` (629 passed, 0 failures), `npm run build` (all 27/27 pages compiled), `npm run drift:check` (clean).

2. **TopNav Avatar & Profile Session Synchronization (`TopNav.tsx`, `UserMenuDropdown.tsx`, `userProfileHelpers.ts`, `userProfileHelpers.test.ts`):**
   - **Root Cause Evaluated:** TopNav avatar button derived initials exclusively from Zustand store `me = users.find(u => u.id === currentUserId) ?? users[0]`, which defaulted to `"user-1"` (`Alex Rivera` -> `"AR"`), completely ignoring authenticated NextAuth session data (`session.user`). TopNav trigger button also lacked profile image (`<img>`) rendering support, and `currentUserId` in Zustand was not synchronized with `session.user.id`.
   - **Pure Helper Module (`userProfileHelpers.ts`):** Implemented `getInitials(name, email)` with robust edge-case handling (multi-word, single-word, extra whitespace, email initial fallback, safe defaults) and `getEffectiveProfile({ sessionUser, fallbackUser })` prioritizing `sessionUser` properties (`name`, `email`, `image`, `role`, `initials`, `isAuthenticated`). Created comprehensive unit test suite in `userProfileHelpers.test.ts` (9 tests passing).
   - **TopNav Integration (`TopNav.tsx`):** Consumed `getEffectiveProfile`, rendered `profile.image` with `imageError` fallback to `profile.initials`, rendered active emerald presence dot when `isAuthenticated: true`, and added `useEffect` synchronizing `session.user.id` to `useWorkspaceStore.currentUserId`.
   - **UserMenuDropdown Parity (`UserMenuDropdown.tsx`):** Unified profile card resolution using `getEffectiveProfile({ sessionUser: session?.user })` with `imageError` fallback, ensuring 100% visual and data parity with TopNav trigger button.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (86 passed), `npm test` (621 passed, 0 failures), coordinator LOC strictly $\le 250$ (`TopNav.tsx`: 135 LOC, `UserMenuDropdown.tsx`: 99 LOC).

2. **Default Light Theme on First Visit (`src/app/layout.tsx`):**
   - **Evaluated Prior Behavior:** `<ThemeProvider>` in `src/app/layout.tsx` had `defaultTheme="dark"` and `enableSystem={true}`. In `next-themes`, when `defaultTheme="dark"`, any initial visit where `localStorage.getItem("theme")` was null defaulted to `"dark"`, bypassing the client device OS `prefers-color-scheme` and always forcing dark mode.
   - **Configured Deterministic Light Theme Default:** Changed `defaultTheme="light"` and set `enableSystem={false}`. First-time visitors and devices with no stored theme preference open in light theme.
   - **Preserved User Overrides:** User manual theme toggle actions (`ThemeToggle`, `SettingsModal`, `MoreAppsMenu`, `CommandPalette`) continue persisting to `localStorage` under key `"theme"` seamlessly.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

1. **Vercel-Supabase Authentication & Production Database Connectivity Fix (`src/lib/db.ts`, `src/auth.ts`, `src/components/auth/LoginForm.tsx`):**
   - **Root Cause Evaluated:** Integration between Supabase and Vercel automatically exposes `POSTGRES_PRISMA_URL` and `POSTGRES_URL`, but does not populate `DATABASE_URL` or `DIRECT_URL`. Previously, `src/lib/db.ts` only read `process.env.DATABASE_URL`, causing `new PrismaClient()` in Vercel serverless environment to fail on query execution (`Environment variable not found: DATABASE_URL`). Auth.js caught this unhandled database error and redirected to `?error=Configuration`. In turn, `LoginForm.tsx` caught this error and defaulted to showing `"Email atau password tidak sesuai."`, misdiagnosing a database connectivity failure as invalid credentials.
   - **Resilient Fallback Support:** Updated `src/lib/db.ts` to automatically read `process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL`, and synchronize `process.env.DATABASE_URL` and `process.env.DIRECT_URL` (from `POSTGRES_URL_NON_POOLING`) for Prisma engine internals.
   - **Detailed Logging in `src/auth.ts`:** Wrapped `prisma.user.findUnique` in `authorize()` with explicit error logging so future connection failures are visible in Vercel runtime logs. Made `lastLoginAt` updates resilient so write contention never aborts an approved sign-in.
   - **Accurate User Feedback in `LoginForm.tsx`:** Updated error handling to distinguish between server configuration/database connection failure (`error === "Configuration"`) and invalid credentials (`error === "CredentialsSignin"`).
   - Gates: `npm run build:check` (0 errors), `npm run lint` (0 errors), `npm run build` (27/27 static/dynamic pages compiled), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures). Local live Supabase authentication verified via curl (`HTTP/1.1 302 Found`, session-token issued).

1. **CustomDropdown Sitewide Z-Index, Stacking Context & Responsive Placement Fix (`CustomDropdown.tsx`, `customDropdownHelpers.ts`, Sitewide Headers & Toolbars):**
   - **Root Cause Evaluated:** Header containers with `backdrop-filter: blur(...)` (`backdrop-blur-sm`) create a CSS stacking context. When headers lacked explicit `relative z-20`, their stacking context fell below subsequent stage content containing positioned elements (`sticky top-0 z-20` on `MarcomTableShell` headers and `relative` row cells), causing the table headers and table rows to paint directly ON TOP of opened dropdown menus (as seen in the user's screenshot).
   - **CustomDropdown Root & Popover Stacking Elevation:** Updated `CustomDropdown.tsx` so the root wrapper div dynamically elevates to `z-30` (`isOpen ? "z-30" : "z-auto"`) when opened, preventing sibling controls in the same row from overlapping. Popover menu styled with solid `bg-white dark:bg-slate-900` (eliminating transparency bleed) and deep `shadow-2xl`.
   - **Responsive Viewport Collision Detection:** Added `computeDropdownPlacement` helper in `customDropdownHelpers.ts` with comprehensive unit test suite in `CustomDropdown.test.ts` (12 tests passed). Automatically detects viewport boundaries to flip direction upwards (`bottom-full mb-1 origin-bottom`) when space below < 240px and right-aligns (`right-0 left-auto`) when space to right < 220px. Added explicit `direction="up"` support for bottom-anchored bars (`PlacementBulkActionBar`, `ProjectsBulkActionBar`, and `MarcomTableShell` pagination).
   - **Sitewide Stacking Context Normalization:** Added `relative z-20` across all 11 unified view headers and filter bars sitewide (`MousHeader`, `OutletsHeader`, `BranchesHeader`, `AnalyticsHeader`, `InventoryHeaderKpis`, `ReportsHeader`, `DocumentsHeader`, `PlacementsHeader`, `EventsHeader`, `ContentPlannerHeader`, `UsersHeader`, `PipelineView` header, `PipelineFilterBar`, `ProjectsFilterBar`, `QuarterlyRecapTab`, `QuarterlyPosmReportTab`, `OutletApprovalQueueTab`, `OutletMapView`, and `EventsTimelineView`).
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **Supabase Cloud PostgreSQL Migration, Schema Synchronization & Seeding (`prisma/schema.prisma`, `.env.local`, `.env`):**
   - **Project Integration:** Connected project `kkstcawepmqenghaqxzt` in region `aws-0-ap-southeast-1`.
   - **Dual-URL Invariant:** Configured `directUrl = env("DIRECT_URL")` in `prisma/schema.prisma` datasource. Set `DATABASE_URL` to transaction pooler (`aws-0-ap-southeast-1.pooler.supabase.com:6543?pgbouncer=true`) and `DIRECT_URL` to direct connection (`aws-0-ap-southeast-1.pooler.supabase.com:5432`).
   - **URI Encoding Handling:** URL-encoded leading `@` in database password (`%40...`) to prevent connection URI host delimiter corruption.
   - **Environment Variables Sync:** Added `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
   - **Schema & Data Migration:** Successfully executed `npx prisma db push` synchronizing all 14 models and relations, followed by `npx tsx prisma/seed.ts` populating standard master data (7 users, 12 branches, 10 outlets, 7 materials, 6 MOUs, 6 placements, 13 inventory items, 4 events, 4 content posts, 4 documents).
   - Gates: Direct Node query verified (`status: 'CONNECTED_SUCCESSFULLY'`), `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

3. **Production Build & ESLint Strict Cleanup (`next lint` & `next build`):**
   - **Issue Triaged:** Vercel / local `npm run build` failed during Next.js compile step due to strict TypeScript ESLint rules (`@typescript-eslint/no-unused-vars` and `@typescript-eslint/no-explicit-any`).
   - **Unused Imports & Variables Removed:** Cleaned up orphaned imports and variables across 28 components/routes resulting from previous atomic header extractions and dropdown standardizations (`ContentPlannerView`, `EventsView`, `DocumentsView`, `OutletsView`, `ReportsView`, `ProjectsFilterBar`, `BorrowDetailModal`, `DropLineIndicator`, etc.).
   - **Explicit Types & Elimination of `any`:** Replaced all `any` usages in inventory borrow endpoints and `auth-helpers.test.ts` with strict typed interfaces (`RawBorrowRecord`, `Parameters<HandleGoogleSignInParams[...]>[0]`).
   - Gates: `npm run lint` (0 errors), `npm run build` (compiled and generated all 27 static/dynamic pages with 0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

4. **Next.js Security Patch Upgrade (`15.2.0` -> `15.2.9` for CVE-2025-66478):**
   - **Issue Triaged:** Vercel security gate blocked deployment post-build with `Build Failed: Vulnerable version of Next.js detected, please update immediately (CVE-2025-66478)`.
   - **Patch Upgrade:** Upgraded `next` and `eslint-config-next` to `15.2.9` (the official patched security release in the 15.2.x series, zero breaking changes).
   - **Callback Narrowing Fix:** Fixed closure variable narrowing in `auth-helpers.test.ts` via object capture pattern (`captured.data`).
   - Gates: `npm run build:check` (0 errors), `npm run lint` (0 errors), `npm run build` (27/27 pages compiled), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **MOU Table Rows UI Redesign & Entity Consolidation (`mouColumns.tsx`, `MarcomTableShell.tsx`, `placementColumns.tsx`):**
   - Consolidated standalone `Partner` (190px) and `Outlet` (170px) columns into a single unified `Partner & Outlet` column (220px), saving ~170px of horizontal table width.
   - Formatted two-line entity cell with primary partner title (filtering table on click) and secondary outlet link with store icon (jumping to Outlets view on click).
   - Replaced redundant stacked `"No period set"` and `"No expiry"` badges in Validity column with a clean, subtle `—` when no dates are configured.
   - Replaced harsh fuchsia styling on MOU document buttons with neutral glassmorphic backdrop-blur chips (`bg-slate-100/80 dark:bg-slate-800/60`, border `border-slate-200/80 dark:border-slate-700/60`), subtle Drive/file icons (`FileText`, `ExternalLink`), and clean preview modal triggers.
   - Formatted `Type` column replacing raw database enum underscores with clean spaces.
   - Implemented right-aligned (`text-right font-medium tabular-nums`) financial currency formatting for `Value` column in `mouColumns.tsx` and normalized header right-alignment in `MarcomTableShell.tsx` via `meta: { align: "right" }`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **User Management Unified Header Component (`UsersHeader.tsx`, `UsersView.tsx`, `usersFilterHelpers.ts`):**
   - Extracted `src/components/views/UsersView/UsersHeader.tsx` (198 LOC), standardizing User Management view with `MousHeader`, `OutletsHeader`, and `DocumentsHeader`.
   - Title Row: Icon (`Users` indigo-500), Title ("Manajemen Pengguna"), Counter badge (`totalUsers` Pengguna), Alert badge (`counts.pending` Perlu Review), Subtitle, and Refresh button (`RefreshCw`).
   - Controls & Navigation Row: Segmented tab buttons with Framer Motion fluid sliding pill animation (`layoutId="activeUsersTabPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`) and real-time quick search input with clear button.
   - KPI Row: Embedded 4 `KpiSummaryCards` (Total Pengguna, Menunggu Review, Pengguna Aktif, Akun Ditolak/Nonaktif) with direct interactive click navigation to tabs.
   - Created pure filtering helper `filterUsers` in `usersFilterHelpers.ts` with unit test suite in `usersFilterHelpers.test.ts` (5 passed).
   - Refactored coordinator `UsersView.tsx` from 187 down to 123 LOC and applied full-bleed stage layout `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (608 passed, 0 failures).

2. **MOUs & Partnerships Unified Header Component (`MousHeader.tsx`, `MousView.tsx`):**
   - Extracted `src/components/views/MousView/MousHeader.tsx` (186 LOC), standardizing MOUs view with `OutletsHeader`, `DocumentsHeader`, and `PlacementsHeader`.
   - Title Row: Icon (`FileText`), Title ("MOUs & Partnerships"), Counter badge (`totalMous`), Subtitle, Refresh button (`RefreshCw`), Export button (`Download` -> `ExportCenter`), and "+ New MOU" button (`Plus`, conditional on `canCreate`).
   - Controls & Filter Row: Quick Search input with clear button, Status Chips with Framer Motion sliding pill animation (`layoutId="activeMouStatusPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`), searchable Branch and MOU Type `CustomDropdown` selectors, Urgency chips (`Expiring Soon`, `Expired`), and dynamic Reset Filters link.
   - KPI Row: `KpiSummaryCards` embedded directly within `MousHeader` beneath the controls row for zero layout shifting.
   - Refactored `MousView.tsx` (reduced from 417 to 348 LOC) consuming `MousHeader` and configuring `MarcomTableShell` with `noPadding` and `hideHeader`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (603 passed, 0 failures).

2. **Workspace Shell Integration for User Management (ADR 07):**
   - Added `"users"` to SSOT `ViewMode` union in `src/types/index.ts` and `VALID_VIEWS` in `src/lib/router/urlState.ts`.
   - Updated `src/components/views/ActiveViewStage.tsx` with dynamic lazy import of `<UsersView />` guarded by `isAdmin`.
   - Updated `UsersView.tsx` with self-hydrating session defaults and removed redundant page back-link.
   - Updated `GlobalRail.tsx` to set `activeView: "users"` and display active state (`isActive: activeView === "users"`) with 0ms transition.
   - Replaced `/admin/users/page.tsx` with a clean 307 server redirect to `/?view=users`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (603 passed, 0 failures).

2. **Supervisor Role & Scoped Area Permissions (`guards.ts` & full stack):**
   - Added `"supervisor"` to `UserRole` SSOT in `src/types/index.ts` and `assignedBranchIds?: string[]` to `AppUser`.
   - Added `SUPERVISOR` to `DbUserRole` enum and `assignedBranchIds String[] @default([])` to `model User` in `prisma/schema.prisma` (`prisma db push` + `prisma generate` synchronized).
   - Updated `normalizeRole` in `src/lib/server/auth-helpers.ts` and `roleToDbRole` in `/api/admin/users/[id]` with `assignedBranchIds` persistence.
   - Updated `src/lib/marcom/guards.ts` allowing Supervisor full operational authority (approving MoUs, Outlets, Equipment Borrows, deleting MoUs/documents) strictly bounded by assigned branch boundaries (`assignedBranchIds`), while strictly preventing access to `MANAGE_MASTER_DATA` and user administration.
   - Updated `UserRoleSelect.tsx` with Supervisor option and `UserMenuDropdown.tsx` with dedicated amber role badge.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (602 passed, 0 failures).

1. **Sitewide Active Pills Animation Upgrade (`framer-motion`):**
   - Implemented spring-animated sliding background pills using `motion.div layoutId="..."` across 10 components sitewide.
   - Configured high-performance physics: `type: "spring" as const, stiffness: 450, damping: 35` with tactile micro-interactions (`whileTap={{ scale: 0.95 }}`).
   - Added full accessibility support via `useReducedMotion()` gracefully disabling animations if the user prefers reduced motion.
   - Preserved text clarity and contrast with `relative z-10` on labels and icons.
   - Verified 10 targeted locations:
     1. `DocumentsHeader.tsx`: Cards / Table view switcher (`activeDocumentsViewPill`) & Category filter chips (`activeDocumentsCategoryPill`)
     2. `OutletsHeader.tsx`: Table / Map / Approval view switcher (`activeOutletsViewPill`)
     3. `ReportsHeader.tsx`: Monthly / Quarterly tab switcher (`activeReportsTabPill`)
     4. `InventoryHeaderKpis.tsx`: Catalog / Borrowing tab switcher (`activeInventoryTabPill`), Catalog view switcher (`activeInventoryCatalogViewPill`), Borrow view switcher (`activeInventoryBorrowViewPill`)
     5. `AnalyticsHeader.tsx`: Brand filter toggle pills: ALL / IM3 / TRI (`activeAnalyticsBrandPill`)
     6. `BranchesHeader.tsx`: Status filter chips: All / Active / Inactive (`activeBranchesStatusPill`)
     7. `ProjectsListHeader.tsx`: Group by selector pills: Status / Priority / Branch / None (`activeProjectsGroupByPill`)
     8. `HelpDocsModal.tsx`: Shortcuts / Guides modal tab switcher (`activeHelpDocsTabPill`)
     9. `SettingsModal.tsx`: Backup & Data / Appearance modal tab switcher (`activeSettingsTabPill`)
     10. `OutletSearchCombobox.tsx`: Brand override pills: IM3 / TRI (`activeComboboxBrandPill`)
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (599 passed, 0 failures).

1. **Database Schema & Migrations (`prisma/schema.prisma` & migration SQL):**
   - Added enums `EquipmentStatus` (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`), `BorrowStatus` (`PENDING`, `APPROVED`, `ACTIVE`, `RETURNED`, `CANCELLED`, `OVERDUE`), and `EquipmentCondition` (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`, `DAMAGED`, `LOST`).
   - Added models `InventoryItem` (master equipment catalog with unique code, category, units, storage location), `BorrowRecord` (transaction with sequential code `BRW-YYYYMMDD-NNN`, purpose, dates, status, approver), and `BorrowItem` (junction items with condition tracking).
   - Added `borrowRecords BorrowRecord[]` relation on `FieldEvent`.
   - Cleaned defunct legacy columns via `db push --accept-data-loss` (single-tenant invariant compliance) and recorded official migration `prisma/migrations/20261030192500_add_inventory_system/migration.sql`.
   - Seeded 13 items across Audio/Visual, Staging/Booth, Merchandising/Display, and Electrical/Cables categories.

2. **Domain Model & SSOT Types (`src/types/index.ts`):**
   - Added `"inventory"` to `ViewMode` union.
   - Added canonical interfaces: `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`, `InventoryItem`, `BorrowItem`, `BorrowRecord`.

3. **API Route Handlers (`src/app/api/marcom/inventory/`):**
   - `route.ts`: GET catalog with search/category/status filters; POST new catalog item with unique code.
   - `[id]/route.ts`: GET item details; PUT updates with available/total unit sanity check; DELETE blocking if active borrows exist.
   - `[id]/availability/route.ts`: GET real-time availability snapshot with active borrow records.
   - `borrow/route.ts`: GET borrow records with status/event filters; POST new borrow request with auto-generated `BRW-YYYYMMDD-NNN` code in PENDING status.
   - `borrow/[id]/route.ts`: GET single borrow record; PUT updates status and atomically decrements `availableUnits` when transitioning to `ACTIVE`.
   - `borrow/[id]/return/route.ts`: POST processes return, updates condition after return, logs damages/notes, and atomically restores `availableUnits` for non-LOST equipment.

4. **State Management & SWR Store (`src/lib/marcom/marcomDataStore.ts` & tests):**
   - Extended `useMarcomDataStore` with `inventoryItems`, `borrowRecords`, `fetchInventory()`, `fetchBorrowRecords()`, and optimistic mutations.
   - Updated store test suite in `marcomDataStore.test.ts` (18 passed).

5. **Navigation & Coordinator Views (`navConfig.ts`, `ActiveViewStage.tsx`, `src/components/views/InventoryView/`):**
   - Added `"Equipment Inventory"` item under Marcom Master Data navigation section.
   - Dynamically loaded `InventoryView` in `ActiveViewStage.tsx`.
   - Built full modular UI component tree under `src/components/views/InventoryView/`:
     - `inventoryConstants.ts`: categories, badge styles, icons.
     - `InventoryHeaderKpis.tsx`: 4 KPI summary cards, tab switchers, search and filter controls.
     - `InventoryItemsGrid.tsx`: visual item card grid with unit availability indicators.
     - `InventoryTableView.tsx`: detailed sortable table view.
     - `BorrowRecordsTable.tsx`: filterable table of borrow transactions.
     - `BorrowTrackingBoard.tsx`: 4-column kanban board for active workflows.
     - `InventoryItemFormModal.tsx`: add/edit modal with validation.
     - `BorrowRequestModal.tsx`: multi-step request modal with item selection.
     - `BorrowDetailModal.tsx`: detailed transaction inspector with status actions.
     - `ReturnProcessModal.tsx`: return inspection and condition check-in dialog.
     - `InventoryViewModals.tsx`: modal coordinator isolating dialog logic.
     - `InventoryView.tsx`: coordinator component strictly $\le 250$ LOC (223 LOC).

6. **Event Integration (`EventBorrowedEquipmentSection.tsx`, `EventFormModal.tsx`):**
   - Added collapsible borrowed equipment section and request shortcut in `EventFormModal.tsx`.

7. **Permissions & Security (`guards.ts`, `guards.test.ts`):**
   - Added permissions: `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN`.

8. **Automated Test Suites:**
   - `src/lib/marcom/inventoryLogic.test.ts`: pure domain logic tests for availability, code generation, and condition status.
   - `src/app/api/marcom/inventory/inventoryApi.test.ts`: API route tests.

9. **Sidebar Mode Switcher Restoration (`AppModeSegmentedControl.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`):**
   - Restored original Projects logo icon (`Kanban` from `lucide-react`) replacing `FolderKanban`.
   - Restored label text to `"Marcom Hub"` in mode switcher pills and `GlobalRail`.
   - Restored Framer Motion animated sliding pill (`motion.div layoutId="activeAppModeIndicator"` with spring physics and reduced-motion support).
   - Extracted `AppModeSegmentedControl.tsx` (104 LOC), bringing `Sidebar.tsx` coordinator down to 182 LOC.

10. **Bugfix: Equipment Inventory Mode Toggle Auto-Reversion (`createUiSlice.ts`, `urlState.ts`, `topNavConstants.ts`):**
   - Added `"inventory"` to `MARCOM_VIEW_SET` in `createUiSlice.ts` so `setActiveView("inventory")` resolves `appMode = "marcom"`.
   - Added `"inventory"` to `VALID_VIEW_MODES` and `MARCOM_VIEWS` in `urlState.ts`, plus `"equipment"` / `"equipments"` normalization aliases.
   - Added `"inventory"` to `MARCOM_VIEW_LABELS` in `topNavConstants.ts`.
   - Added Equipment Inventory view and quick action to `CommandPalette.tsx`.
   - Added automated tests in `marcomViews.test.ts` and `urlState.test.ts`.

11. **Bugfix: Stale Prisma Client Runtime on Development Server (500 error on fetchBorrowRecords):**
   - Root cause: Dev server process started before `BorrowRecord` / `BorrowItem` schema migration, retaining stale Prisma client in Node process memory where `prisma.borrowRecord` was `undefined`.
   - Terminated stale process, restarted clean Next.js server on port 3000, verified authenticated requests return HTTP 200 (`/api/marcom/inventory/borrow` and `/api/marcom/inventory`).

12. **Feature: Event Card Equipment Logistics Indicator Chip — IMPLEMENTED & VERIFIED:**
   - Created Spec: `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`
   - Created Plan: `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`
   - Created ADR: `docs/adr/0006-event-card-equipment-indicator.md` (ADR-06)
   - Created pure helper `getEventEquipmentSummary` in `src/lib/marcom/eventEquipmentHelpers.ts`.
   - Added unit test suite in `src/lib/marcom/eventEquipmentHelpers.test.ts` (4 passed).
   - Integrated reactive indicator chip into `EventCardsView.tsx` with teal active state, rose overdue state, and modal open trigger.
   - Added pre-fetch of `fetchBorrowRecords()` to `EventsView.tsx`.

13. **Feature: Open Detail Drawer on Row Click in Projects List View — IMPLEMENTED & VERIFIED:**
   - Attached `onClick={() => onSelect?.(item)}` to `<tr>` in `src/components/views/ProjectsView/ProjectsListRow.tsx` with `cursor-pointer` styling.
   - Isolated click event propagation (`e.stopPropagation()`) across all interactive cell controls (checkbox selection toggle, inline title edit input and double-click trigger, status dropdown button and options, due date editor and date button, PIC assignee editor and button, action button).
   - Preserved seamless row click behavior across non-control cell areas (type badge, branch, checklist, and empty cell padding) to open the domain drawer/modal (`ProjectsDetailDrawerHost`).

14. **Bugfix: HTML Redirect Response on Pipeline View (`SyntaxError: Unexpected token '<'`):**
   - Root cause: NextAuth edge middleware callback in `src/auth.config.ts` was returning `false` for unauthenticated requests on `/api/...` endpoints instead of a 401 JSON Response. NextAuth edge middleware automatically generated an HTTP 307 Temporary Redirect to the `/login` HTML page. The browser's client-side `fetch('/api/marcom/pipeline')` followed the redirect and received the HTML login page with HTTP 200 OK, causing `await res.json()` to fail with `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
   - Updated `src/auth.config.ts` `authorized` callback to inspect `request?.nextUrl?.pathname` and return an HTTP 401 JSON Response for unauthenticated/unapproved `/api/` requests, preserving page redirects only for non-API routes.
   - Updated `PipelineView.tsx` with defensive status handling (clean redirect to `/login` if 401 or redirected) and validated `content-type: application/json` before calling `.json()`.
   - Wrapped `src/app/api/marcom/pipeline/route.ts` GET handler in `try / catch` returning structured HTTP 500 JSON on database exceptions.
   - Added automated unit tests in `src/auth.config.test.ts` (8 passed).

15. **Comprehensive QA Edge-Case Database Seeder (`prisma/seed.ts`) — IMPLEMENTED & VERIFIED:**
   - Spec: `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`
   - Plan: `docs/superpowers/plans/2026-10-31-qa-comprehensive-seeder.md`
   - Implemented clean atomic reset protocol (`cleanDatabase`) deleting all tables in reverse FK topological order, guaranteeing idempotent re-runs in < 1 second.
   - Implemented realistic Indonesian corporate domain data across all entities without artificial `[QA]` label strings.
   - Covered edge cases: SLA critical expired MoU (45d ago), SLA warning near-expiry MoU (8d), pending legal approval aging (>60d), flagship multi-year agreement (Rp 150M), rejected MoU with finance reasons, GPS geolocation anomaly (>1.4km deviation, `isLocationValid: false`), installation blocked with `ISSUE` renovation status, permanent material without MoU warning, extreme dimensions installation (`1200 x 400 cm`), cold/orphan outlet with 0 operational records, inactive outlet, overdue borrow with event link, damaged returns (`MAJOR_DAMAGE` and `LOST` equipment condition check-in), content posts in review/revision/published states, document files up to 88.5MB, and executive Q3 report with rich JSON.
   - Standardized branch indexing (`branch-1`..`branch-12`) and preserved catalog item counts ($\ge 13$) to satisfy all downstream integration test suites.

16. **Active Pills Animation on Content Planner Page (`ContentPlannerView.tsx`):**
    - Implemented fluid animated sliding pill for the View Modes Switcher (Cards vs Table) and Platform Filter Pills.
    - Integrated Framer Motion `motion.div` with shared `layoutId` (`activeContentPlannerViewPill` and `activeContentPlannerPlatformPill`), natural spring physics (`stiffness: 450, damping: 35`), and `useReducedMotion()` accessibility support.
    - Added tactile tap gestures (`whileTap={{ scale: 0.95 }}`) and semantic accessibility attributes (`role="tablist"`, `role="tab"`, `aria-selected`).

17. **Placements Persistent Header & Static View Switcher (`PlacementsView.tsx`, `PlacementsHeader.tsx`, `PlacementFilterControls.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`
    - Upgraded `PlacementViewSwitcher` with Framer Motion `motion.div layoutId="activePlacementViewPill"`, spring physics (`stiffness: 450, damping: 35`), `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`.
    - Extracted atomic subcomponent `PlacementsHeader.tsx` (84 LOC) styled with Option B Card-Banner Container (`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs p-4 sm:p-5`), containing title, record badge, view switcher pills, refresh button, export trigger, and `+ Add Placement` action.
    - Added container padding (`p-4 sm:p-6 space-y-4 h-full overflow-y-auto`) to `PlacementsView.tsx` and aligned `MarcomTableShell` with `noPadding` and `hideRefreshButton`.
    - Positioned `KpiSummaryCards` conditionally (`viewMode !== "map"`), hiding the KPI cards on Map View to maximize the Leaflet interactive map viewport and prevent unwanted vertical scrollbars.
    - Streamlined `PlacementsMapTab.tsx` and `PlacementsRecapTab.tsx` by removing redundant duplicate headers.
    - Kept coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (214 LOC).

18. **Field Events Card-Banner Header Architecture (`EventsView.tsx`, `EventsHeader.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-events-card-header-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-events-card-header.md`
    - Created atomic subcomponent `EventsHeader.tsx` (129 LOC) styled with the Card-Banner container (`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5`), matching the design system of Media Placements.
    - Integrated title, flag icon badge, event counter badge (`{totalEvents} events`), subtitle, animated view switcher (`layoutId="activeFieldEventsViewPill"`), refresh action, and role-guarded `+ New Field Event` action (`can("CREATE_EVENT")`).
    - Reduced `EventsView.tsx` from 531 to 447 LOC by decomposing the coordinator header.

19. **Content Planner Container Margin & Padding Alignment (`ContentPlannerView.tsx`):**
    - Removed restrictive `max-w-7xl mx-auto` that caused excessive lateral empty space on widescreen viewports.
    - Aligned outer container styling with `PlacementsView.tsx`: `p-4 sm:p-6 space-y-4 h-full overflow-y-auto`.
    - Removed redundant `pt-2` on Controls Bar for uniform 16px (`space-y-4`) vertical rhythm.

20. **Outlets Header & Navigation Labels Alignment (`OutletsView.tsx`, `navConfig.ts`):**
    - Renamed header title in `OutletsView.tsx` from `"Store Command Center"` to `"Outlets Directory"`.
    - Renamed sidebar navigation item in `navConfig.ts` under Master Data from `"Outlets Directory"` to `"Outlets"`.

21. **Media Placements Inventory-Style Unified Header (`PlacementsHeader.tsx`, `PlacementsView.tsx`):**
    - Restyled header zone with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `MapPin` icon (`text-emerald-500`), count badge, and updated actions bar.
    - Integrated `KpiSummaryCards` directly within the header (conditionally hidden on map view to maximize interactive map canvas viewport).
    - Positioned `PlacementViewSwitcher` at the bottom controls row before the bottom border.
    - Updated `PlacementsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0`.
    - Maintained coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (213 LOC).

22. **Content Planner Inventory-Style Unified Header (`ContentPlannerHeader.tsx`, `ContentPlannerView.tsx`):**
    - Extracted atomic subcomponent `ContentPlannerHeader.tsx` (247 LOC) with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `Sparkles` icon (`text-pink-500`), count badge, subtitle, and top-right Refresh & Schedule Post buttons.
    - Integrated `KpiSummaryCards` directly within the header zone.
    - Standardized bottom controls row with Platform filter pills (`motion.div layoutId="activeContentPlannerPlatformPill"`), Search input, and Cards/Table view switcher (`layoutId="activeContentPlannerViewPill"`).
    - Updated `ContentPlannerView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0`.
    - Reduced `ContentPlannerView.tsx` by ~185 LOC by decoupling header and filter logic.

23. **Field Events Inventory-Style Unified Header (`EventsHeader.tsx`, `EventsView.tsx`):**
    - Upgraded `EventsHeader.tsx` with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `CalendarDays` icon (`text-blue-500`), event count badge, and top-right Refresh & New Field Event buttons.
    - Integrated `KpiSummaryCards` directly inside the header zone under Title row.
    - Positioned view switcher (Cards | Table | Calendar | Timeline with `activeFieldEventsViewPill`) at the bottom controls row before the bottom border.
    - Updated `EventsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 space-y-4 flex-1 min-h-0`.

24. **Pipeline Inventory-Style Unified Header (`PipelineView.tsx`):**
    - Upgraded header zone with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `Layers` icon (`text-indigo-500`), Cockpit 360° badge, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
    - Integrated `KpiSummaryCards` directly within the header zone.
    - Updated outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped content area in `p-4 sm:p-6 space-y-4 flex-1 min-h-0`.

25. **Analytics & ROI Hub Inventory-Style Unified Header (`AnalyticsHeader.tsx`, `AnalyticsActionableStrip.tsx`, `AnalyticsView.tsx`, `AnalyticsSkeleton.tsx`):**
    - Created `AnalyticsHeader.tsx` (~200 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `BarChart3` icon (`text-indigo-500`), `Live Metrics` badge, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
      - Embedded 4 KPI Cards (SLA Persetujuan MOU, POSM Deployment Rate, Efisiensi Event Lapangan, Reliabilitas Konten Sosmed) with drill-down routes to respective Marcom views and zero-CLS skeleton placeholders when loading.
      - Integrated bottom filter toolbar with Branch selector, Quarter selector, Brand toggle pills, and Reset button.
    - Extracted `AnalyticsActionableStrip.tsx` to surface unit economics and editorial turnaround in the stage content area.
    - Updated `AnalyticsSkeleton.tsx` to mirror stage content geometry (Actionable Telemetry strip + 2×2 Chart Grid).
    - Updated `AnalyticsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-6`.
    - Removed dead obsolete components `AnalyticsKpiRow.tsx` and `AnalyticsFilterBar.tsx`.

26. **Reports & Exports Hub Inventory-Style Unified Header (`ReportsHeader.tsx`, `ReportsView.tsx`):**
    - Created `ReportsHeader.tsx` following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `BarChart3` icon (`text-orange-500`), `Executive Archive` badge, subtitle, and top-right action buttons (Refresh, Export Center, and 1-Click Executive PDF).
      - Embedded 4 KPI Cards (Total Laporan, Total Aktivitas, Avg Completion, Laporan Terkini) with `KpiSummaryCards items={kpiCards}` within the header zone.
      - Bottom controls row with Tab switcher (Laporan Bulanan & Rekap POSM Kuartalan) and New Monthly Report button.
    - Updated `ReportsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

27. **Documents & Asset Library Hub Inventory-Style Unified Header (`DocumentsHeader.tsx`, `DocumentsView.tsx`):**
    - Created `DocumentsHeader.tsx` (~209 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Files` icon (`text-teal-500`), document count badge (`{count} dokumen`), concise subtitle, and top-right action buttons (Refresh and `+ Tambah Dokumen`).
      - Embedded 4 KPI Cards (Total Dokumen, Kapasitas Terpakai, Dokumen Aktif, Kategori Terbanyak) with `KpiSummaryCards items={kpiCards}` within the header zone.
      - Bottom controls row with Category filter chips (Semua Dokumen + individual categories with count badges), search input with clear button, and view mode switcher (Cards | Table).
    - Updated `DocumentsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` (removed restrictive `max-w-7xl mx-auto`), replaced inline headers with `<DocumentsHeader ... />`, and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

28. **Outlets Directory Inventory-Style Unified Header (`OutletsHeader.tsx`, `OutletsView.tsx`):**
    - Created `OutletsHeader.tsx` (~190 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Store` icon (`text-orange-500`), outlet count badge (`{totalOutlets} outlet`), concise subtitle, and top-right action buttons (Refresh and `+ Add Outlet` / `Ajukan Toko Baru`).
      - Embedded 5 KPI Cards (Total Outlets, Active Branches, Brand Portfolio, MoU Partnerships, Placements Installed) with `KpiSummaryCards items={kpiItems}` within the header zone.
      - Bottom controls row with View mode switcher tabs (Tabel Data, Peta Sebaran, Antrean Approval with pending count badge), Branch dropdown selector, Store Type dropdown selector, search input with clear button, and Reset Filters button.
    - Updated `OutletsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`, replaced inline header, floating KPI cards, and inline filterBar with `<OutletsHeader ... />`, and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

29. **Branches & Regional Hubs Inventory-Style Unified Header (`BranchesHeader.tsx`, `BranchesView.tsx`):**
    - Created `BranchesHeader.tsx` (~185 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Building2` icon (`text-cyan-600 dark:text-cyan-400`), branch count badge (`{totalBranches} branch`), concise subtitle, and top-right action buttons (Refresh and `+ Tambah Branch`).
      - Embedded 4 KPI Cards (Total Branches, Outlets Network, Active Partnerships, Avg Program Progress) with `KpiSummaryCards items={kpiItems}` within the header zone.
      - Bottom controls row with Status filter pills (Semua Status, Done, In Progress, Pending with count badges), Region dropdown selector, search input with clear button, and Reset Filters button.
    - Updated `BranchesView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`, replaced inline header, floating KPI cards, and inline filterBar with `<BranchesHeader ... />`, and wrapped table shell in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

30. **CustomDropdown Component & Sitewide Dropdown Standardization (`CustomDropdown.tsx`, Multiple Views):**
    - Spec: `docs/superpowers/specs/2026-10-31-custom-dropdown-standardization-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-custom-dropdown-standardization.md`
    - Built reusable, accessible, dark-mode-ready, and searchable `CustomDropdown` component (`src/components/ui/CustomDropdown.tsx`) and pure helpers (`src/components/ui/customDropdownHelpers.ts`).
    - Features:
      - Auto-activated search input when options count $\ge 6$ (or explicit `searchable={true}`) with real-time filtering and clear button.
      - Click-outside and Escape key dismissal powered by existing `useDropdown` hook with trigger focus restoration.
      - Keyboard navigation (ArrowDown, ArrowUp, Enter, Space) and ARIA attributes (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`).
      - Active item indicator checkmark (`Check` icon), optional option badges and leading icons.
      - Glassmorphic backdrop blur styling matching both light and dark modes.
    - Replaced native unstyled `<select>` elements across:
      - `BranchesHeader.tsx` (Region dropdown — resolves user screenshot)
      - `OutletsHeader.tsx` (Branch & Store Type dropdowns)
      - `AnalyticsHeader.tsx` (Branch & Quarter dropdowns with icons)
      - `PipelineFilterBar.tsx` (Branch dropdown)
      - `InventoryHeaderKpis.tsx` (Category dropdown)
      - `MousView.tsx` (Branch & Type dropdowns)
      - `QuarterlyRecapTab.tsx` (Quarter & Branch dropdowns)
      - `EventsTimelineView.tsx` (Days range dropdown)
      - `QuarterlyPosmReportTab.tsx` (Quarter dropdown)
      - `OutletApprovalQueueTab.tsx` (Branch dropdown)
      - `OutletMapView.tsx` (Brand, Store Type, Branch, and MoU Status dropdowns)
      - `MarcomTableShell.tsx` (Sitewide table pagination pageSize dropdown)
      - `ProjectsFilterBar.tsx` (Branch & PIC dropdowns)
      - `ProjectsBulkActionBar.tsx` (Bulk status dropdown)
      - `PlacementBulkActionBar.tsx` (Bulk status dropdown)
      - `UserRoleSelect.tsx` (User role select)
    - Created unit tests in `src/components/ui/CustomDropdown.test.ts` (8 tests passing).

31. **Header Layout Swap: Stabilize Pills Row Above KPI Cards Row (`BranchesHeader`, `ReportsHeader`, `OutletsHeader`, `DocumentsHeader`, `InventoryHeaderKpis`, `PlacementsHeader`, `EventsHeader`, `AnalyticsHeader`):**
    - Spec: `docs/superpowers/specs/2026-10-31-header-pills-cards-swap-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-header-pills-cards-swap.md`
    - Inverted vertical order of Controls/Pills row and dynamic KPI Summary Cards row across all 8 Marcom headers:
      - Row 1: Title, domain badges, primary action buttons (Add / Create / Export).
      - Row 2: Controls & Navigation row (View switcher pills, tab pills, status filter chips, CustomDropdowns, and search inputs).
      - Row 3: KPI Summary Cards row (`KpiSummaryCards items={kpiItems}`).
    - Completely eliminated layout jumping (Cumulative Layout Shift) when switching tabs or views where cards are conditionally hidden (e.g. Map View in Placements, Rekap POSM tab in Reports, or during metric recalculations).
    - Established deterministic $Y$-coordinate for all primary user interaction pills directly beneath the title bar.

---

## Verification Gates (this session)

- `npm run drift:check` → ✅ No drift detected (37 specs paired, single-tenant invariant OK, coordinator files LOC OK, SSOT OK)
- `npm run build:check` → ✅ 0 TypeScript errors
- `npm run lint` → ✅ 0 `@next/next/no-img-element` warnings
- `npm test` → ✅ 629 passed, 0 failed (109 suites)
- `npm run test:smoke` → ✅ 87 passed, 0 failed
- `npm run build` → ✅ 27/27 pages compiled cleanly

---

## Blocked / Risks

- None.

---

## Next Step for Following Session

1. Run verification commands (`npm run drift:check`, `npm run build:check`, `npm test`) on session start.
2. Push committed branch to remote (`git push origin vicky`).
3. Continue standardizing any remaining views if requested by user.
