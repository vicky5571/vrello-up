"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useTheme } from "next-themes";
import {
  Search,
  X,
  List as ListIcon,
  Kanban,
  Table as TableIcon,
  Calendar,
  GanttChart,
  Plus,
  Folder as FolderIcon,
  Layers,
  Moon,
  Sun,
  PanelLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Flame,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Priority, ViewMode } from "@/types";

interface PaletteItem {
  id: string;
  title: string;
  category: "tasks" | "navigation" | "views" | "actions";
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  priority?: Priority;
  onSelect: () => void;
}

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    openCommandPalette,
    tasks,
    workspaces,
    activeWorkspaceId,
    setActiveSpace,
    setActiveList,
    setActiveView,
    setSelectedTaskId,
    toggleSidebar,
    setCreateTaskModalOpen,
  } = useWorkspaceStore();

  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const allStatuses = useMemo(() => {
    return currentWorkspace?.spaces.flatMap((s) => s.statuses) || [];
  }, [currentWorkspace]);

  // Global shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, openCommandPalette, closeCommandPalette]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Build searchable items list
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];
    const q = query.trim().toLowerCase();

    // 1. Tasks
    const matchingTasks = tasks.filter((t) => {
      if (!q) return true;
      const titleMatch = t.title.toLowerCase().includes(q);
      const descMatch = t.description.toLowerCase().includes(q);
      const tagMatch = t.tags.some((tag) => tag.name.toLowerCase().includes(q));
      return titleMatch || descMatch || tagMatch;
    });

    // Take top 6 task matches
    matchingTasks.slice(0, 6).forEach((task) => {
      const status = allStatuses.find((s) => s.id === task.statusId);
      // Find list name
      let listName = "General";
      for (const space of currentWorkspace?.spaces || []) {
        const foundList =
          space.lists.find((l) => l.id === task.listId) ||
          space.folders.flatMap((f) => f.lists).find((l) => l.id === task.listId);
        if (foundList) {
          listName = `${space.name} / ${foundList.name}`;
          break;
        }
      }

      items.push({
        id: `task-${task.id}`,
        title: task.title,
        category: "tasks",
        subtitle: listName,
        badge: status?.name || "Task",
        badgeColor: status?.color || "#0073ea",
        priority: task.priority,
        icon: CheckCircle2,
        onSelect: () => {
          setSelectedTaskId(task.id);
          closeCommandPalette();
        },
      });
    });

    // 2. Navigation (Spaces & Lists)
    for (const space of currentWorkspace?.spaces || []) {
      if (!q || space.name.toLowerCase().includes(q)) {
        items.push({
          id: `space-${space.id}`,
          title: space.name,
          category: "navigation",
          subtitle: `Space • ${space.lists.length + space.folders.reduce((acc, f) => acc + f.lists.length, 0)} lists`,
          icon: Layers,
          iconColor: space.color,
          onSelect: () => {
            setActiveSpace(space.id);
            closeCommandPalette();
          },
        });
      }

      // Direct Lists
      for (const list of space.lists) {
        if (!q || list.name.toLowerCase().includes(q)) {
          items.push({
            id: `list-${list.id}`,
            title: list.name,
            category: "navigation",
            subtitle: `${space.name} • List`,
            icon: ListIcon,
            onSelect: () => {
              setActiveSpace(space.id);
              setActiveList(list.id);
              closeCommandPalette();
            },
          });
        }
      }

      // Folders & Folder Lists
      for (const folder of space.folders) {
        if (!q || folder.name.toLowerCase().includes(q)) {
          items.push({
            id: `folder-${folder.id}`,
            title: folder.name,
            category: "navigation",
            subtitle: `${space.name} • Folder`,
            icon: FolderIcon,
            onSelect: () => {
              setActiveSpace(space.id);
              if (folder.lists[0]) {
                setActiveList(folder.lists[0].id);
              }
              closeCommandPalette();
            },
          });
        }

        for (const list of folder.lists) {
          if (!q || list.name.toLowerCase().includes(q)) {
            items.push({
              id: `folder-list-${list.id}`,
              title: list.name,
              category: "navigation",
              subtitle: `${space.name} / ${folder.name} • List`,
              icon: ListIcon,
              onSelect: () => {
                setActiveSpace(space.id);
                setActiveList(list.id);
                closeCommandPalette();
              },
            });
          }
        }
      }
    }

    // 3. Views
    const viewsList: { id: ViewMode; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { id: "list", name: "List View", icon: ListIcon },
      { id: "board", name: "Board (Kanban) View", icon: Kanban },
      { id: "table", name: "Table Spreadsheet View", icon: TableIcon },
      { id: "calendar", name: "Calendar View", icon: Calendar },
      { id: "gantt", name: "Gantt Timeline View", icon: GanttChart },
    ];

    viewsList.forEach((v) => {
      if (!q || v.name.toLowerCase().includes(q) || v.id.includes(q)) {
        items.push({
          id: `view-${v.id}`,
          title: `Switch to ${v.name}`,
          category: "views",
          icon: v.icon,
          onSelect: () => {
            setActiveView(v.id);
            closeCommandPalette();
          },
        });
      }
    });

    // 4. Quick Actions
    const actions: { id: string; title: string; subtitle?: string; icon: React.ComponentType<{ className?: string }>; onSelect: () => void }[] = [
      {
        id: "action-create-task",
        title: "Create New Task",
        subtitle: "Add a task to the active list",
        icon: Plus,
        onSelect: () => {
          closeCommandPalette();
          setCreateTaskModalOpen(true);
        },
      },
      {
        id: "action-toggle-theme",
        title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
        subtitle: `Currently using ${theme === "dark" ? "Dark" : "Light"} theme`,
        icon: theme === "dark" ? Sun : Moon,
        onSelect: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          closeCommandPalette();
        },
      },
      {
        id: "action-toggle-sidebar",
        title: "Toggle Sidebar",
        subtitle: "Expand or collapse navigation tree",
        icon: PanelLeft,
        onSelect: () => {
          toggleSidebar();
          closeCommandPalette();
        },
      },
    ];

    actions.forEach((act) => {
      if (!q || act.title.toLowerCase().includes(q) || act.id.includes(q)) {
        items.push({
          id: act.id,
          title: act.title,
          category: "actions",
          subtitle: act.subtitle,
          icon: act.icon,
          onSelect: act.onSelect,
        });
      }
    });

    return items;
  }, [
    query,
    tasks,
    currentWorkspace,
    allStatuses,
    theme,
    setTheme,
    setSelectedTaskId,
    setActiveSpace,
    setActiveList,
    setActiveView,
    toggleSidebar,
    setCreateTaskModalOpen,
    closeCommandPalette,
  ]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          selected.onSelect();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeCommandPalette();
      }
    },
    [allItems, selectedIndex, closeCommandPalette]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Group items by category
  const categorized = useMemo(() => {
    const groups: { [key in PaletteItem["category"]]?: PaletteItem[] } = {};
    allItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    });
    return groups;
  }, [allItems]);

  const CATEGORY_LABELS: Record<PaletteItem["category"], string> = {
    tasks: "Tasks",
    navigation: "Spaces & Lists",
    views: "Switch View",
    actions: "Actions",
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCommandPalette}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#18191B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70vh] select-none"
          >
            {/* Search Header */}
            <div className="flex items-center px-4 py-3 border-b border-slate-200/80 dark:border-white/10 gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search tasks, spaces, views..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 divide-y divide-transparent space-y-3"
            >
              {allItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Search className="w-6 h-6 mx-auto mb-2 text-slate-400/50" />
                  <p>No results found for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                (Object.keys(categorized) as PaletteItem["category"][]).map(
                  (category) => {
                    const categoryItems = categorized[category];
                    if (!categoryItems || categoryItems.length === 0) return null;

                    return (
                      <div key={category} className="space-y-1">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {CATEGORY_LABELS[category]}
                        </div>

                        <div className="space-y-0.5">
                          {categoryItems.map((item) => {
                            const itemGlobalIndex = allItems.findIndex(
                              (i) => i.id === item.id
                            );
                            const isSelected = selectedIndex === itemGlobalIndex;
                            const Icon = item.icon || ArrowRight;

                            return (
                              <div
                                key={item.id}
                                data-index={itemGlobalIndex}
                                onClick={item.onSelect}
                                onMouseEnter={() =>
                                  setSelectedIndex(itemGlobalIndex)
                                }
                                className={cn(
                                  "group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-[#7B68EE]/10 text-slate-900 dark:text-white"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-white/5"
                                )}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div
                                    className={cn(
                                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                      isSelected
                                        ? "bg-[#7B68EE] text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                                    )}
                                    style={
                                      item.iconColor
                                        ? {
                                            backgroundColor: item.iconColor,
                                            color: "#FFFFFF",
                                          }
                                        : undefined
                                    }
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>

                                  <div className="truncate flex flex-col">
                                    <span className="font-semibold truncate">
                                      {item.title}
                                    </span>
                                    {item.subtitle && (
                                      <span className="text-[10px] text-slate-400 truncate">
                                        {item.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {item.priority && (
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
                                      <Flame
                                        className={cn(
                                          "w-3 h-3",
                                          item.priority === "urgent" && "text-red-500",
                                          item.priority === "high" && "text-amber-500",
                                          item.priority === "normal" && "text-blue-500",
                                          item.priority === "low" && "text-slate-400"
                                        )}
                                      />
                                      {item.priority}
                                    </span>
                                  )}

                                  {item.badge && (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                      style={{
                                        backgroundColor: `${item.badgeColor || "#0073ea"}20`,
                                        color: item.badgeColor || "#0073ea",
                                        border: `1px solid ${item.badgeColor || "#0073ea"}40`,
                                      }}
                                    >
                                      {item.badge}
                                    </span>
                                  )}

                                  {isSelected && (
                                    <CornerDownLeft className="w-3.5 h-3.5 text-[#7B68EE] shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-4 py-2 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 bg-slate-200/60 dark:bg-white/10 rounded font-mono text-[9px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.2 bg-slate-200/60 dark:bg-white/10 rounded font-mono text-[9px]">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.2 bg-slate-200/60 dark:bg-white/10 rounded font-mono text-[9px]">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
              </div>

              <div className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-[#7B68EE]" />
                <span>ClickUp Quick Switcher</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
