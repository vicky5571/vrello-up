# Spec: Hide Brain² AI Assistant from User-Facing Navigation Surfaces

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0056

---

## 1. Executive Summary & Business Objective

*vrello-up* is dedicated to the field marketing and operational logistics of Indosat Ooredoo Hutchison (IM3 & Tri). To optimize ergonomics, streamline navigation, and eliminate user confusion, all user-facing entry points for the prototype **Brain² AI Assistant** are removed from the application interface.

The underlying components and state bindings are placed into a clean, dormant state rather than hard-deleted. This guarantees zero initial bundle load overhead on `src/app/page.tsx`, unclutters the left rail navigation and quick tools popover, and retains the developed UI assets for potential future integration with an enterprise LLM backend.

---

## 2. User Experience & Navigation Flows

### Before:
1. **Global Rail:** User sees a prominent violet `Sparkles` icon labeled "AI" between "Calendar" and "Users/More". Clicking it opens the AI slide-over drawer with mock chat bubbles.
2. **More Apps Menu:** User opens "More", seeing "Command Palette", "Brain² AI Assistant" (with an 'AI' badge), "Export Center", and "Backup & Data".
3. **Workspace Canvas (`page.tsx`):** Every session loads and mounts the `<AiDrawer />` dynamic bundle in the root React tree.
4. **Help & Docs (`HelpDocsModal.tsx`):** Displays a guide card for "Brain² & Autonomous Agents".

### After:
1. **Global Rail:** The "AI" item is completely gone. Navigation cleanly consists of `Home`, `Calendar`, `Users` (for admin/supervisor), and `More`.
2. **More Apps Menu:** The "Brain² AI Assistant" button is removed. The "Main Tools" section cleanly houses `Command Palette` (`⌘K`) and `Export Center` (`CSV / PDF`), followed by `Backup & Data`.
3. **Workspace Canvas (`page.tsx`):** `<AiDrawer />` dynamic chunk is unmounted and excluded from the root render tree, eliminating initial client evaluation.
4. **Help & Docs (`HelpDocsModal.tsx`):** The AI guide card is replaced with *"Field Inventory & Equipment Loans"*, informing users about asset checkout, return inspections, and compensation workflows.

---

## 3. UI Component Modifications & Architectural Contracts

### 3.1. `src/components/layout/GlobalRail.tsx`
- Remove the `{ id: "ai", label: "AI", icon: Sparkles, isActive: isAiDrawerOpen, onClick: () => setAiDrawerOpen(true) }` entry from `NAV_ITEMS`.
- Remove `Sparkles` from `lucide-react` imports.
- Remove `isAiDrawerOpen` and `setAiDrawerOpen` store bindings from `GlobalRail.tsx`.
- Coordinator LOC check: Ensure file remains far below the 250 LOC threshold (`scripts/drift-check.ts`).

### 3.2. `src/components/modals/MoreAppsMenu.tsx`
- Remove the entire `<button>` block triggering `setAiDrawerOpen(true)` with `"Brain² AI Assistant"`.
- Remove `Sparkles` from `lucide-react` imports.
- Remove `setAiDrawerOpen` from store selectors.
- Maintain `Command Palette`, `Export Center`, and `Backup & Data` operations with pixel-perfect spacing.

### 3.3. `src/app/page.tsx`
- Remove dynamic import:
  ```tsx
  // REMOVE:
  const AiDrawer = dynamic(
    () => import("@/components/ai/AiDrawer").then((m) => m.AiDrawer),
    { ssr: false },
  );
  ```
- Remove `<AiDrawer />` from the JSX tree inside `WorkspacePage`.
- Coordinator LOC check: Ensure `src/app/page.tsx` remains strictly under 250 LOC.

### 3.4. `src/components/modals/HelpDocsModal.tsx`
- Replace `Bot` icon and AI guide in `GUIDES`:
  ```tsx
  // REPLACE:
  {
    icon: Bot,
    title: "Brain² & Autonomous Agents",
    desc: "AI-assisted triage, blocker watchdogs, automated sprint summaries, and code security audits built right into your workspace.",
  }
  // WITH:
  {
    icon: Package,
    title: "Field Inventory & Equipment Loans",
    desc: "Kelola peminjaman sound system, genset, dan aset lapangan; catat hasil inspeksi pengembalian fisik dan klaim kompensasi barang rusak.",
  }
  ```
- Import `Package` from `lucide-react` (or replace `Bot`).

### 3.5. `src/components/ai/AiDrawer.tsx` (Dormant Preservation)
- File remains on disk at `src/components/ai/AiDrawer.tsx`.
- Add header comment:
  ```tsx
  // ponytail: deferred AI assistant UI dormant until LLM backend integration.
  // Not mounted in user-facing navigation (ADR-0056).
  ```
- Zustand store keys `isAiDrawerOpen` and `setAiDrawerOpen` remain in `src/lib/store/slices/createUiSlice.ts` to prevent runtime breaks in hotkey escape listeners.

---

## 4. Test Invariants & Verification Contracts

### 4.1. Unit Test Updates (`src/components/modals/MoreAppsMenu.test.ts`)
- Modify the test suite `describe("MoreAppsMenu & SettingsModal YAGNI Elimination (ADR-0031)")`:
  - Locate test `"retains core system tools and eliminates dark mode toggle in MoreAppsMenu"` (line 90-114).
  - Update assertion from:
    ```ts
    assert.ok(
      moreContent.includes("Brain² AI Assistant"),
      "Expected MoreAppsMenu to retain Brain² AI Assistant"
    );
    ```
    To negative assertion:
    ```ts
    assert.strictEqual(
      moreContent.includes("Brain² AI Assistant"),
      false,
      "Expected MoreAppsMenu to omit Brain² AI Assistant per ADR-0056"
    );
    ```

### 4.2. Acceptance Criteria Checklist
- [ ] `GlobalRail.tsx` has NO "AI" icon or button in `NAV_ITEMS`.
- [ ] `GlobalRail.tsx` does not import `Sparkles` or subscribe to `isAiDrawerOpen`.
- [ ] `MoreAppsMenu.tsx` has NO "Brain² AI Assistant" button in the "Main Tools" list.
- [ ] `src/app/page.tsx` does NOT dynamically import or mount `<AiDrawer />`.
- [ ] `HelpDocsModal.tsx` replaces the AI guide card with "Field Inventory & Equipment Loans".
- [ ] `src/components/modals/MoreAppsMenu.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (83 spec-plan pairs, 0 drift, coordinator sizes ≤250 LOC).
- [ ] `npm run build:check` passes (`tsc --noEmit` 0 errors).
- [ ] `npm test` passes all tests with 0 failures.
- [ ] `npm run test:smoke` passes with 0 failures.

---

## 5. Non-Goals
- Deleting `src/components/ai/AiDrawer.tsx` from the project repository.
- Introducing a feature-flag system or `.env` variable for toggling AI visibility.
- Modifying backend API routes or database models.



