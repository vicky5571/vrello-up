# Technical Specification: Migrate Backup & Data to More Apps Menu and Eliminate Settings Modal

- **Status:** IMPLEMENTED (ADR-0031)
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer
- **References:** `docs/adr/0031-migrate-backup-data-to-more-and-eliminate-settings-modal.md`

## 1. Executive Summary

This specification defines the consolidation of data backup operations into `MoreAppsMenu.tsx` (the "More" popover triggered from `GlobalRail.tsx`) and the complete deletion of `SettingsModal.tsx` and its sidebar trigger. Additionally, the redundant "New Task" button is removed from `MoreAppsMenu.tsx`.

## 2. Background & Problem Statement

1. **SettingsModal Overengineering**: `src/components/modals/SettingsModal.tsx` spans ~279 LOC across two tabs:
   - *Appearance Tab*: Exposes Light Mode and Dark Mode toggles, which duplicate existing controls in `<TopNav>` and `<MoreAppsMenu>`.
   - *Data Tab*: Exposes JSON Export and Import for Zustand workspace state (`spaces`, `tasks`, `tags`).
2. **Sidebar Bloat**: `Sidebar.tsx` maintains modal state `isSettingsOpen` and a gear icon button in its footer purely to launch this dialog.
3. **Redundant Actions in MoreAppsMenu**: `MoreAppsMenu.tsx` contains a "New Task" button that is already redundant with primary project canvas actions and Command Palette (`⌘K`).

## 3. User Experience & Interaction Flow

```
[Global Rail]
    │
    ▼ (click "More" 9-dots button)
[MoreAppsMenu Popover]
    ├── Section 1: Main Tools
    │     ├── Command Palette (⌘K) ──► Opens CommandPalette modal
    │     └── Brain² AI Assistant (AI) ──► Opens AI Drawer
    │
    ├── Section 2: Data & Storage (New)
    │     ├── Export Backup (JSON) ──► Instant browser file download (vrello-backup-YYYY-MM-DD.json)
    │     └── Import Backup (JSON) ──► Triggers hidden file input
    │                                       │
    │                                       ▼ File selected (.json)
    │                                  Confirmation dialog (window.confirm)
    │                                       │
    │                                       ├─ Confirm ──► importBackup() + Success Toast
    │                                       └─ Cancel  ──► Abort operation
    │
    └── Section 3: System Preferences
          └── Toggle Light/Dark Mode ──► Switches next-themes theme
```

## 4. Component Architecture & Implementation Details

### 4.1. `src/components/modals/MoreAppsMenu.tsx` Changes
- **Zustand State Ingestion**:
  ```typescript
  const { spaces, tasks, tags } = useWorkspaceStore(
    useShallow((s) => ({
      spaces: s.spaces,
      tasks: s.tasks,
      tags: s.tags,
    }))
  );
  const importBackup = useWorkspaceStore((s) => s.importBackup);
  ```
- **File Input Ref & Handlers**:
  ```typescript
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      spaces,
      tasks,
      tags,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vrello-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded successfully!");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (
        !window.confirm(
          `Restore backup from "${file.name}"? Spaces, tasks, and tags will be replaced.`
        )
      ) {
        return;
      }
      if (importBackup(parsed)) {
        toast.success("Backup restored!");
        onClose();
      } else {
        toast.error("Invalid backup file — import aborted.");
      }
    } catch {
      toast.error("Could not read backup file — import aborted.");
    }
  };
  ```
- **Cleanup in `MoreAppsMenu.tsx`**:
  - Remove `setCreateTaskModalOpen` from Zustand bindings.
  - Remove `Plus` icon import from `lucide-react`.
  - Delete the "New Task" JSX button element.

### 4.2. `src/components/layout/Sidebar.tsx` Changes
- Remove `import { SettingsModal } from "@/components/modals/SettingsModal";`.
- Remove `const [isSettingsOpen, setIsSettingsOpen] = useState(false);`.
- Remove the settings gear `<button>` element from the footer.
- Remove `<SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />`.
- Clean footer styling to render `HelpCircle` ("Help & Docs") cleanly centered or left-aligned.

### 4.3. Deletion of `src/components/modals/SettingsModal.tsx`
- Delete `src/components/modals/SettingsModal.tsx` completely.

## 5. Acceptance Criteria

1. **AC-1 (More Menu Data Actions)**:
   - Clicking "Export Backup (JSON)" in the More popover triggers an immediate file download named `vrello-backup-YYYY-MM-DD.json` containing `spaces`, `tasks`, and `tags`.
   - Clicking "Import Backup (JSON)" opens a native file selector filtering for `.json`. Selecting a valid JSON file triggers a confirmation prompt and then calls `importBackup()`.
2. **AC-2 (Elimination of New Task in More Menu)**:
   - The pop-up `MoreAppsMenu.tsx` no longer contains a "New Task" button or references `setCreateTaskModalOpen`.
3. **AC-3 (SettingsModal Elimination)**:
   - `src/components/modals/SettingsModal.tsx` is completely deleted from disk.
   - No lingering references to `SettingsModal` exist in `Sidebar.tsx` or anywhere in `src/`.
4. **AC-4 (Sidebar Footer Cleanliness)**:
   - The footer of `Sidebar.tsx` renders only the "Help & Docs" button without a gear button or `isSettingsOpen` state.
5. **AC-5 (Quality & Architectural Gates)**:
   - `npm run drift:check` passes with 0 drift.
   - `npm run build:check` compiles TypeScript with 0 errors.
   - `npm test` passes all tests with 0 failures.

## 6. Non-Goals

- Modifying the underlying Zustand `importBackup` algorithm or JSON structure.
- Modifying `HelpDocsModal.tsx`.
- Modifying `<ThemeToggle />` in `TopNav`.

## 7. Verification Checklist

- [ ] `node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts` passes.
- [ ] `npm run drift:check` passes with no drift.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across all test suites.



