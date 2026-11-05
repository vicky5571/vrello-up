# Handover: Hide Brain² AI Assistant from User-Facing Navigation Surfaces

- **Date:** 2026-11-06
- **Status:** READY FOR EXECUTION
- **Spec:** docs/superpowers/specs/2026-11-06-hide-brain2-ai-assistant-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-hide-brain2-ai-assistant.md
- **Refs:** ADR-0056

---

## 1. Overview & Objective

This handover provides execution-ready instructions to cleanly hide the prototype **Brain² AI Assistant** across all user-facing surfaces (`GlobalRail`, `MoreAppsMenu`, `src/app/page.tsx`, `HelpDocsModal`), aligning test assertions without permanently deleting dormant UI components.

---

## 2. File Manifest

1. `src/components/modals/MoreAppsMenu.test.ts` — Unit test verifying `MoreAppsMenu` tool options.
2. `src/components/layout/GlobalRail.tsx` — Global left rail navigation bar.
3. `src/components/modals/MoreAppsMenu.tsx` — "More" applications and tools popover modal.
4. `src/app/page.tsx` — Root workspace canvas coordinator.
5. `src/components/modals/HelpDocsModal.tsx` — Help documentation modal and guide cards.
6. `src/components/ai/AiDrawer.tsx` — Dormant AI drawer component (add documentation comment).

---

## 3. Explicit "Do Not Touch" List

- **`src/components/ai/AiDrawer.tsx`**: DO NOT delete this file. It is retained dormant for future AI integration.
- **`src/lib/store/slices/createUiSlice.ts`**: DO NOT remove `isAiDrawerOpen` or `setAiDrawerOpen`. They remain dormant to prevent breaking global hotkey listeners.
- **`src/lib/hooks/useWorkspaceHotkeys.ts`**: DO NOT remove the `Escape` key handling for `state.isAiDrawerOpen`.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Update Test Assertion in `src/components/modals/MoreAppsMenu.test.ts`

**Location:** Lines 90-100 of `src/components/modals/MoreAppsMenu.test.ts`

**Current Code:**
```ts
  it("retains core system tools and eliminates dark mode toggle in MoreAppsMenu", () => {
    assert.ok(
      moreContent.includes("Command Palette"),
      "Expected MoreAppsMenu to retain Command Palette"
    );
    assert.ok(
      moreContent.includes("Brain² AI Assistant"),
      "Expected MoreAppsMenu to retain Brain² AI Assistant"
    );
```

**Replacement Code:**
```ts
  it("retains core system tools and eliminates dark mode toggle in MoreAppsMenu", () => {
    assert.ok(
      moreContent.includes("Command Palette"),
      "Expected MoreAppsMenu to retain Command Palette"
    );
    assert.strictEqual(
      moreContent.includes("Brain² AI Assistant"),
      false,
      "Expected MoreAppsMenu to omit Brain² AI Assistant per ADR-0056"
    );
```

**Verification:** Run `npx tsx --test src/components/modals/MoreAppsMenu.test.ts` and verify it fails (Red phase).

---

### Step 2: Remove AI Entry from `src/components/layout/GlobalRail.tsx`

**A. Clean Imports:**
In `src/components/layout/GlobalRail.tsx` line 1-25, remove `Sparkles` from the `lucide-react` import:
```tsx
// REMOVE Sparkles from:
import {
  Kanban,
  Megaphone,
  ChevronsLeft,
  ChevronsRight,
  Home,
  CalendarDays,
  Sparkles, // <-- DELETE THIS
  Users,
  Grid3X3,
} from "lucide-react";
```

**B. Clean Zustand Selectors:**
In `src/components/layout/GlobalRail.tsx` lines 39-49, remove `isAiDrawerOpen` and `setAiDrawerOpen`:
```tsx
// BEFORE:
  const { isSidebarOpen, activeView, isAiDrawerOpen } = useWorkspaceStore(
    useShallow((s) => ({
      isSidebarOpen: s.isSidebarOpen,
      activeView: s.activeView,
      isAiDrawerOpen: s.isAiDrawerOpen,
    })),
  );
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAiDrawerOpen = useWorkspaceStore((s) => s.setAiDrawerOpen);

// AFTER:
  const { isSidebarOpen, activeView } = useWorkspaceStore(
    useShallow((s) => ({
      isSidebarOpen: s.isSidebarOpen,
      activeView: s.activeView,
    })),
  );
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
```

**C. Remove AI item from `NAV_ITEMS`:**
In `src/components/layout/GlobalRail.tsx` lines 68-75, remove the `ai` item:
```tsx
// REMOVE THIS OBJECT:
    {
      id: "ai",
      label: "AI",
      icon: Sparkles,
      isActive: isAiDrawerOpen,
      onClick: () => setAiDrawerOpen(true),
    },
```

---

### Step 3: Remove Brain² Button from `src/components/modals/MoreAppsMenu.tsx`

**A. Clean Imports & Selectors:**
In `src/components/modals/MoreAppsMenu.tsx`:
1. Remove `Sparkles` from `lucide-react` imports (line 7).
2. Remove `const setAiDrawerOpen = useWorkspaceStore((s) => s.setAiDrawerOpen);` (line 33).

**B. Remove the Button:**
In `src/components/modals/MoreAppsMenu.tsx` lines 151-167, delete the entire button:
```tsx
// REMOVE:
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setAiDrawerOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="font-semibold">Brain² AI Assistant</span>
                </div>
                <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </button>
```

---

### Step 4: Unmount `<AiDrawer />` from `src/app/page.tsx`

**A. Remove Dynamic Import:**
In `src/app/page.tsx` lines 17-20:
```tsx
// REMOVE:
const AiDrawer = dynamic(
  () => import("@/components/ai/AiDrawer").then((m) => m.AiDrawer),
  { ssr: false },
);
```

**B. Remove from JSX:**
In `src/app/page.tsx` line 77:
```tsx
// REMOVE:
        <AiDrawer />
```

---

### Step 5: Replace AI Guide in `src/components/modals/HelpDocsModal.tsx`

**A. Update Imports:**
In `src/components/modals/HelpDocsModal.tsx` line 1-18, replace `Bot` with `Package`:
```tsx
// BEFORE:
import {
  X,
  BookOpen,
  Keyboard,
  Sparkles,
  Search,
  Kanban,
  ListTodo,
  Calendar,
  Zap,
  Bot,
  HelpCircle,
} from "lucide-react";

// AFTER:
import {
  X,
  BookOpen,
  Keyboard,
  Sparkles,
  Search,
  Kanban,
  ListTodo,
  Calendar,
  Zap,
  Package,
  HelpCircle,
} from "lucide-react";
```

**B. Update `GUIDES` Array:**
In `src/components/modals/HelpDocsModal.tsx` lines 52-56:
```tsx
// BEFORE:
  {
    icon: Bot,
    title: "Brain² & Autonomous Agents",
    desc: "AI-assisted triage, blocker watchdogs, automated sprint summaries, and code security audits built right into your workspace.",
  },

// AFTER:
  {
    icon: Package,
    title: "Field Inventory & Equipment Loans",
    desc: "Kelola peminjaman sound system, genset, dan aset lapangan; catat hasil inspeksi pengembalian fisik dan klaim kompensasi barang rusak.",
  },
```

---

### Step 6: Add Dormancy Note to `src/components/ai/AiDrawer.tsx`

Prepend to `src/components/ai/AiDrawer.tsx` line 1:
```tsx
// ponytail: deferred AI assistant UI dormant until LLM backend integration.
// Not mounted in user-facing navigation (ADR-0056).
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Test (Ensure Green Phase)
npx tsx --test src/components/modals/MoreAppsMenu.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 83/83)
npm run drift:check

# 3. TypeScript Compilation (0 errors required)
npm run build:check

# 4. Smoke Test Suite (137 tests passing)
npm run test:smoke

# 5. Full Test Suite (899+ tests passing)
npm test
```

---

## 6. Acceptance Criteria Checklist

- [ ] `GlobalRail.tsx` does not render an "AI" icon or button.
- [ ] `MoreAppsMenu.tsx` does not render the "Brain² AI Assistant" button.
- [ ] `src/app/page.tsx` does not dynamically import or render `<AiDrawer />`.
- [ ] `HelpDocsModal.tsx` replaces "Brain² & Autonomous Agents" with "Field Inventory & Equipment Loans".
- [ ] `src/components/ai/AiDrawer.tsx` remains safely on disk as dormant code.
- [ ] `npx tsx --test src/components/modals/MoreAppsMenu.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes with 83/83 spec-plan pairs and 0 drift.
- [ ] `npm run build:check` exits with code 0.
- [ ] `npm test` and `npm run test:smoke` pass with 0 failures.



