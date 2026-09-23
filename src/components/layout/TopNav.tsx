"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { TopNavBreadcrumbs } from "./TopNavBreadcrumbs";
import { TopNavActionModals } from "./TopNavActionModals";
import { ViewSwitcher } from "./ViewSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenuDropdown } from "./UserMenuDropdown";
import type { Workspace } from "@/types";
import { Search, Download, LogIn } from "lucide-react";

const LoginModal = dynamic(
  () => import("@/components/modals/LoginModal").then((m) => m.LoginModal),
  { ssr: false },
);

export function TopNav() {
  const appMode = useWorkspaceStore((s) => s.appMode);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const setCurrentUserId = useWorkspaceStore((s) => s.setCurrentUserId);
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const members = currentWorkspace?.members ?? [];
  const me = members.find((u) => u.id === currentUserId) ?? members[0];

  const { data: session } = useSession();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [editWsModalState, setEditWsModalState] = useState<{
    isOpen: boolean;
    workspace: Workspace | null;
  }>({ isOpen: false, workspace: null });

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initials = me
    ? me.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <div className="relative z-30 flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
        {appMode === "marcom" ? (
          /* Lean Single-Tier Header for Marketing Hub (~44px) */
          <header className="h-11 px-4 flex items-center justify-between gap-3 bg-white dark:bg-[#18191B]">
            {/* Left: Breadcrumbs */}
            <TopNavBreadcrumbs
              variant="full"
              onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
              onOpenEditWorkspace={(ws) => setEditWsModalState({ isOpen: true, workspace: ws })}
            />

            {/* Center: Command Palette Trigger */}
            <div
              onClick={openCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/40"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search marketing & ops...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono shadow-2xs">
                ⌘K
              </kbd>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setExportCenterOpen(true)}
                title="Export Center"
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <NotificationCenter />
              <ThemeToggle />

              {/* Profile Avatar / User Menu */}
              <div ref={userMenuRef} className="relative ml-1 flex items-center gap-1.5">
                <button
                  type="button"
                  title={
                    session?.user
                      ? `Signed in as ${session.user.name} (${session.user.email})`
                      : me
                      ? `Active profile: ${me.name}`
                      : "User Profile"
                  }
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative w-6 h-6 rounded-full bg-pink-600 dark:bg-pink-500 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs cursor-pointer"
                >
                  {initials}
                  {session && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {isUserMenuOpen && (
                  <UserMenuDropdown
                    session={session}
                    me={me}
                    members={members}
                    setCurrentUserId={setCurrentUserId}
                    onClose={() => setIsUserMenuOpen(false)}
                    onOpenLogin={() => setIsLoginModalOpen(true)}
                  />
                )}
              </div>
            </div>
          </header>
        ) : (
          <>
            {/* Tier 1: Global Workspace & Utility Bar */}
            <header className="h-11 px-4 flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">
              {/* Left: Workspace dropdown */}
              <TopNavBreadcrumbs
                variant="workspace-only"
                onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
                onOpenEditWorkspace={(ws) => setEditWsModalState({ isOpen: true, workspace: ws })}
              />

              {/* Center: Search Pill */}
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
              </div>

              {/* Right: Quick actions, call controls & user avatar */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Audio/Video Call Buttons */}
                <TopNavActionModals
                  showCallActions={true}
                  showQuickActions={false}
                  isCreateWsOpen={isCreateWsOpen}
                  setIsCreateWsOpen={setIsCreateWsOpen}
                  editWsModalState={editWsModalState}
                  setEditWsModalState={setEditWsModalState}
                />

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <NotificationCenter />

                <button
                  type="button"
                  onClick={() => setExportCenterOpen(true)}
                  title="Export Center — reports, placements & MOUs to PDF / Excel"
                  className="p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <ThemeToggle />

                {/* User Profile */}
                <div ref={userMenuRef} className="relative ml-1 flex items-center gap-1.5">
                  {!session && (
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                  )}

                  <button
                    type="button"
                    title={
                      session?.user
                        ? `Signed in as ${session.user.name} (${session.user.email})`
                        : me
                        ? `Active profile: ${me.name}`
                        : "User Profile"
                    }
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="relative w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px] shadow-2xs cursor-pointer"
                  >
                    {initials}
                    {session && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <UserMenuDropdown
                      session={session}
                      me={me}
                      members={members}
                      setCurrentUserId={setCurrentUserId}
                      onClose={() => setIsUserMenuOpen(false)}
                      onOpenLogin={() => setIsLoginModalOpen(true)}
                    />
                  )}
                </div>
              </div>
            </header>

            {/* Tier 2: Space / Project Breadcrumbs & View Switcher Bar */}
            <div className="relative z-20 px-4 py-1.5 flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60">
              <TopNavBreadcrumbs
                variant="space-list"
                onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
                onOpenEditWorkspace={(ws) => setEditWsModalState({ isOpen: true, workspace: ws })}
              />

              {/* View Switcher Tabs */}
              <div className="min-w-0 flex-1 flex items-center">
                <ViewSwitcher />
              </div>
            </div>

            {/* Tier 3: Quick Action Controls (Agents, Automate, Brain², Share) */}
            <div className="relative z-10 px-4 py-1 flex items-center justify-end gap-1.5 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar">
              <TopNavActionModals
                showCallActions={false}
                showQuickActions={true}
                isCreateWsOpen={isCreateWsOpen}
                setIsCreateWsOpen={setIsCreateWsOpen}
                editWsModalState={editWsModalState}
                setEditWsModalState={setEditWsModalState}
              />
            </div>
          </>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
