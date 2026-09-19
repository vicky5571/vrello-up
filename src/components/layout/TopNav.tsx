"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ViewSwitcher } from "./ViewSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import {
  ChevronDown,
  Search,
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
  Download,
  LogIn,
  Menu,
  Megaphone,
  ArrowLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import type { ViewMode } from "@/types";

const AgentsModal = dynamic(
  () => import("@/components/modals/AgentsModal").then((m) => m.AgentsModal),
  { ssr: false },
);
const ShareModal = dynamic(
  () => import("@/components/modals/ShareModal").then((m) => m.ShareModal),
  { ssr: false },
);
const CallModal = dynamic(
  () => import("@/components/modals/CallModal").then((m) => m.CallModal),
  { ssr: false },
);
const LoginModal = dynamic(
  () => import("@/components/modals/LoginModal").then((m) => m.LoginModal),
  { ssr: false },
);

const AutomationsModal = dynamic(
  () =>
    import("@/components/modals/AutomationsModal").then(
      (m) => m.AutomationsModal,
    ),
  { ssr: false },
);

const CreateWorkspaceModal = dynamic(
  () =>
    import("@/components/workspaces/CreateWorkspaceModal").then(
      (m) => m.CreateWorkspaceModal,
    ),
  { ssr: false },
);
const EditWorkspaceModal = dynamic(
  () =>
    import("@/components/workspaces/EditWorkspaceModal").then(
      (m) => m.EditWorkspaceModal,
    ),
  { ssr: false },
);

import { MARCOM_VIEW_LABELS } from "./topNavConstants";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { WorkspaceMenuDropdown } from "./WorkspaceMenuDropdown";

export function TopNav() {
  const {
    appMode,
    setAppMode,
    activeView,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    setActiveWorkspace,
    setActiveList,
    setActiveView,
    openCommandPalette,
    setAiDrawerOpen,
    toggleSidebar,
    currentUserId,
    setCurrentUserId,
    setExportCenterOpen,
    navigatedFromMarcom,
    setNavigatedFromMarcom,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const members = currentWorkspace?.members ?? [];
  const me = members.find((u) => u.id === currentUserId) ?? members[0];

  const { data: session } = useSession();

  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals state
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [editWsModalState, setEditWsModalState] = useState<{
    isOpen: boolean;
    workspace: (typeof workspaces)[0] | null;
  }>({ isOpen: false, workspace: null });
  const [callModalState, setCallModalState] = useState<{
    isOpen: boolean;
    mode: "audio" | "video";
  }>({ isOpen: false, mode: "audio" });

  const wsMenuRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wsMenuRef.current && !wsMenuRef.current.contains(target)) {
        setIsWsMenuOpen(false);
      }
      if (listMenuRef.current && !listMenuRef.current.contains(target)) {
        setIsListMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWsMenuOpen(false);
        setIsListMenuOpen(false);
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

  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );

  const allListsInSpace = currentSpace
    ? [
        ...currentSpace.lists,
        ...currentSpace.folders.flatMap((f) => f.lists),
      ]
    : [];

  let currentListName = "Project 1";
  if (currentSpace) {
    if (!activeListId) {
      currentListName = "All Tasks";
    } else {
      const list =
        currentSpace.lists.find((l) => l.id === activeListId) ||
        currentSpace.folders
          .flatMap((f) => f.lists)
          .find((l) => l.id === activeListId);
      if (list) currentListName = list.name;
    }
  }

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    toast.success(
      next
        ? `Added "${currentListName}" to Favorites`
        : `Removed "${currentListName}" from Favorites`,
    );
  };

  return (
    <>
      <div className="relative z-30 flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
        {appMode === "marcom" ? (
          /* Lean Single-Tier Header for Marketing Hub (~44px) */
          <header className="h-11 px-4 flex items-center justify-between gap-3 bg-white dark:bg-[#18191B]">
            {/* Left: Workspace Anchor + Marcom Breadcrumbs & mobile toggle */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Workspace Avatar */}
              <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
                {currentWorkspace?.avatar || "V"}
              </div>

              {/* Workspace Selector Dropdown */}
              <div ref={wsMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsWsMenuOpen(!isWsMenuOpen)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">
                    {currentWorkspace?.name || "Acme Workspace"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isWsMenuOpen && (
                  <WorkspaceMenuDropdown
                    workspaces={workspaces}
                    currentWorkspaceId={currentWorkspace?.id}
                    onSelectWorkspace={setActiveWorkspace}
                    onClose={() => setIsWsMenuOpen(false)}
                    onOpenEditWorkspace={(ws) =>
                      setEditWsModalState({ isOpen: true, workspace: ws })
                    }
                    onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
                  />
                )}
              </div>

              <span className="text-slate-300 dark:text-slate-700">/</span>

              {/* Marketing Hub Badge */}
              <span className="font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1 shrink-0">
                <Megaphone className="w-3 h-3" />
                <span>Marketing Hub</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700">/</span>

              {/* Active View Label */}
              <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0">
                {MARCOM_VIEW_LABELS[activeView] || "Overview"}
              </span>
            </div>

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
            <div className="flex items-center gap-1.5 sm:gap-2">
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
          <div className="flex items-center gap-2">
            {/* Mobile nav hamburger */}
            <button
              type="button"
              onClick={toggleSidebar}
              title="Open navigation"
              className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            {/* Green V Workspace Avatar */}
            <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
              {currentWorkspace?.avatar || "V"}
            </div>

            {/* Workspace Selector Dropdown */}
            <div ref={wsMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsWsMenuOpen(!isWsMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[220px]">
                  {currentWorkspace?.name || "Acme Workspace"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isWsMenuOpen && (
                <WorkspaceMenuDropdown
                  workspaces={workspaces}
                  currentWorkspaceId={currentWorkspace?.id}
                  onSelectWorkspace={setActiveWorkspace}
                  onClose={() => setIsWsMenuOpen(false)}
                  onOpenEditWorkspace={(ws) =>
                    setEditWsModalState({ isOpen: true, workspace: ws })
                  }
                  onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
                />
              )}
            </div>
          </div>

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

          {/* Right: Quick actions & user avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCallModalState({ isOpen: true, mode: "audio" })}
              title="Start audio huddle"
              className="p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCallModalState({ isOpen: true, mode: "video" })}
              title="Start video meeting"
              className="p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

            {/* Notification & Activity Center */}
            <NotificationCenter />

            <button
              type="button"
              onClick={() => setExportCenterOpen(true)}
              title="Export Center — reports, placements & MOUs to PDF / Excel"
              className="p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Theme Switcher */}
            <ThemeToggle />

            {/* Sign In Button / User Profile Avatar + Switcher */}
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
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
              <FolderIcon className="w-3.5 h-3.5 fill-blue-500/20" />
              <span>{currentSpace?.name || "Team Space"}</span>
            </div>

            <span className="text-slate-400">/</span>

            {/* List selector breadcrumb */}
            <div ref={listMenuRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100 hover:text-[#0073ea] transition-colors cursor-pointer"
              >
                <ListIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentListName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isListMenuOpen && allListsInSpace.length > 0 && (
                <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Lists in {currentSpace?.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveList(null);
                      setIsListMenuOpen(false);
                      toast.success(`Switched to all tasks in "${currentSpace?.name}"`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ListIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        All Tasks
                      </span>
                    </div>
                    {!activeListId && (
                      <Check className="w-3.5 h-3.5 text-[#0073ea] shrink-0" />
                    )}
                  </button>
                  <div className="my-1 border-t border-slate-200/60 dark:border-slate-800/60" />
                  {allListsInSpace.map((l) => {
                    const isSelected = l.id === activeListId;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setActiveList(l.id);
                          setIsListMenuOpen(false);
                          toast.success(`Switched to list "${l.name}"`);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ListIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {l.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#0073ea] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Favorite Star Toggle */}
            <button
              type="button"
              onClick={toggleFavorite}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              className="text-slate-300 hover:text-amber-400 transition-colors ml-1 cursor-pointer p-0.5 rounded"
            >
              <Star
                className={`w-3.5 h-3.5 transition-all ${
                  isFavorite ? "fill-amber-400 text-amber-400 scale-110" : ""
                }`}
              />
            </button>

            {/* Quick return to Marcom if navigated from there */}
            {navigatedFromMarcom && (
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const targetView = (navigatedFromMarcom.view as ViewMode) || "events";
                    setNavigatedFromMarcom(null);
                    setAppMode("marcom");
                    setActiveView(targetView);
                    toast.info(`Back to ${navigatedFromMarcom.label}`);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                  title={`Back to ${navigatedFromMarcom.label}`}
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to {navigatedFromMarcom.label}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNavigatedFromMarcom(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer rounded"
                  title="Dismiss return shortcut"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Center: View Switcher Tabs */}
          <div className="min-w-0 flex-1 flex items-center">
            <ViewSwitcher />
          </div>
        </div>

        {/* Tier 3: Quick Action Controls (Below View Switcher) */}
        <div className="relative z-10 px-4 py-1 flex items-center justify-end gap-1.5 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setIsAgentsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-purple-500" />
            <span>Agents</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutomationsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Automate</span>
          </button>

          <button
            type="button"
            onClick={() => setAiDrawerOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span>Brain²</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium text-slate-700 dark:text-slate-200"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Share</span>
          </button>
        </div>
          </>
        )}
      </div>

      {/* TopNav Attached Modals */}
      <AgentsModal
        isOpen={isAgentsOpen}
        onClose={() => setIsAgentsOpen(false)}
      />

      <AutomationsModal
        isOpen={isAutomationsOpen}
        onClose={() => setIsAutomationsOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <CallModal
        isOpen={callModalState.isOpen}
        mode={callModalState.mode}
        onClose={() => setCallModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />

      <EditWorkspaceModal
        isOpen={editWsModalState.isOpen}
        workspace={editWsModalState.workspace}
        onClose={() => setEditWsModalState({ isOpen: false, workspace: null })}
      />
    </>
  );
}
