# Implementation Plan — Workspace Shell Integration for User Management

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-workspace-user-management-integration-design.md`  
**Refs:** ADR 07 (`docs/adr/0007-integrate-user-management-into-workspace-stage.md`)  
**Status:** READY TO EXECUTE  

---

## 1. Overview & Phased Roadmap

This plan integrates User Management (`UsersView`) directly into the central Workspace Stage (`ActiveViewStage.tsx`), replacing the legacy `/admin/users` page dislocation with a unified single-page shell experience.

### Phased Roadmap
- [x] **Phase 1: Domain Types & Router State**
  - Add `"users"` to `ViewMode` in `src/types/index.ts`.
  - Add `"users"` to `VALID_VIEWS` in `src/lib/router/urlState.ts`.
  - Add test in `src/lib/router/urlState.test.ts`.
- [x] **Phase 2: ActiveViewStage Integration & Gating**
  - Dynamically load `UsersView` in `src/components/views/ActiveViewStage.tsx`.
  - Add fail-closed check (`session?.user?.role === "admin"`).
  - Update `UsersView.tsx` props to make `initialCounts` and `currentUserId` optional with self-hydrating defaults.
- [x] **Phase 3: GlobalRail Navigation Update**
  - Update `GlobalRail.tsx` Users button to call `setActiveView("users")`.
  - Set `isActive: activeView === "users"`.
- [x] **Phase 4: Backward Compatibility & Redirect**
  - Update `src/app/admin/users/page.tsx` to redirect to `/?view=users`.
- [x] **Phase 5: Verification & Verification Gates**
  - Run `npm run build:check`.
  - Run `npm run drift:check`.
  - Run `npm run test:smoke`.
  - Run `npm test`.

---

## 2. File Manifest & LOC Estimates

| File Path | Action | Est. LOC Change | Purpose |
| :--- | :---: | :---: | :--- |
| `src/types/index.ts` | Edit | ~2 LOC | Add `"users"` to `ViewMode` union |
| `src/lib/router/urlState.ts` | Edit | ~2 LOC | Add `"users"` to `VALID_VIEWS` |
| `src/lib/router/urlState.test.ts` | Edit | ~8 LOC | Unit test `parseUrlNavState` with `users` view |
| `src/components/views/ActiveViewStage.tsx` | Edit | ~15 LOC | Render `UsersView` inside workspace stage |
| `src/components/views/UsersView/UsersView.tsx` | Edit | ~10 LOC | Self-hydrate session & clean up redundant back button |
| `src/components/layout/GlobalRail.tsx` | Edit | ~6 LOC | Trigger `setActiveView("users")` instead of `router.push` |
| `src/app/admin/users/page.tsx` | Edit | ~8 LOC | Redirect to `/?view=users` |

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Non-admin accessing `users` view via URL parameter | High | Enforce client-side check in `ActiveViewStage` that falls back to default view if user is not `admin`, backed by 403 API responses |
| Loss of existing bookmarks to `/admin/users` | Medium | Retain `/admin/users/page.tsx` as a clean 307 server redirect to `/?view=users` |
| Coordinator file size limit in `ActiveViewStage.tsx` | Medium | Maintain dynamic import `dynamic(() => import(...))` keeping LOC well under 250 LOC |

---

## 4. Dependencies

- Next.js dynamic imports
- NextAuth.js session verification
- Workspace store (`useWorkspaceStore`)
