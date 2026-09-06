"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ViewSwitcher } from "./ViewSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  ChevronDown,
  Search,
  Sparkles,
  Bot,
  Zap,
  Brain,
  Share2,
  Phone,
  Video,
  Star,
  Check,
  Folder as FolderIcon,
  List as ListIcon,
  Calendar,
} from "lucide-react";

export function TopNav() {
  const {
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    openCommandPalette,
    setAiDrawerOpen,
    currentUserId,
    setCurrentUserId,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const members = currentWorkspace?.members ?? [];
  const me = members.find((u) => u.id === currentUserId) ?? members[0];
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const initials = me
    ? me.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId
  );

  let currentListName = "Project 1";
  if (currentSpace) {
    const list =
      currentSpace.lists.find((l) => l.id === activeListId) ||
      currentSpace.folders
        .flatMap((f) => f.lists)
        .find((l) => l.id === activeListId);
    if (list) currentListName = list.name;
  }

  return (
    <div className="flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
      {/* Tier 1: Global Workspace & Utility Bar */}
      <header className="h-11 px-4 flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Left: Workspace dropdown */}
        <div className="flex items-center gap-2">
          {/* Green V Workspace Avatar */}
          <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
            V
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="truncate max-w-[220px]">
              {currentWorkspace?.name || "Vicky Galih Pamungkas's Workspace"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            title="Toggle Calendar"
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Search Pill & AI Chats */}
        <div className="hidden md:flex items-center gap-2">
          <div
            onClick={openCommandPalette}
            className="relative flex items-center cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            <input
              type="text"
              readOnly
              onClick={openCommandPalette}
              placeholder="Search ⌘K"
              className="w-48 lg:w-56 pl-8 pr-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 placeholder-slate-400 border border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-700 cursor-pointer focus:outline-hidden transition-all shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>AI Chats</span>
          </button>
        </div>

        {/* Right: Quick actions & user avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            title="Start call"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Start video"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Profile Avatar + Switcher */}
          <div ref={userMenuRef} className="relative ml-1">
            <button
              type="button"
              title={me ? `Signed in as ${me.name} — switch user` : "Switch user"}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px] shadow-2xs cursor-pointer"
            >
              {initials}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch user
                </div>
                {members.map((u) => {
                  const isCurrent = u.id === me?.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCurrentUserId(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <UserAvatar user={u} size="xs" showTooltip={false} />
                      <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">
                        {u.name}
                      </span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#0073ea] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tier 2: Space / Project Breadcrumbs & View Switcher Bar */}
      <div className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
            <FolderIcon className="w-3.5 h-3.5 fill-blue-500/20" />
            <span>{currentSpace?.name || "Team Space"}</span>
          </div>

          <span className="text-slate-400">/</span>

          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
            <ListIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentListName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 cursor-pointer" />
          </div>

          <button
            type="button"
            title="Favorite"
            className="text-slate-300 hover:text-amber-400 transition-colors ml-1 cursor-pointer"
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center">
          <ViewSwitcher />
        </div>

        {/* Right: Quick Action Controls */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agents</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Automate</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span>Brain²</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium text-slate-700 dark:text-slate-200"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
