"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { TopNavBreadcrumbs } from "./TopNavBreadcrumbs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { ProjectsFilterBar } from "./ProjectsFilterBar";
import { shouldRenderProjectsFilterBar } from "./layoutHierarchyHelpers";
import { getEffectiveProfile } from "./userProfileHelpers";
import { AppImage } from "@/components/ui/AppImage";
import { Search } from "lucide-react";

export function TopNav() {
  const users = useWorkspaceStore((s) => s.users);
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const setCurrentUserId = useWorkspaceStore((s) => s.setCurrentUserId);
  const syncSessionUser = useWorkspaceStore((s) => s.syncSessionUser);
  const appMode = useWorkspaceStore((s) => s.appMode);
  const activeView = useWorkspaceStore((s) => s.activeView);
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);

  const me = users.find((u) => u.id === currentUserId) ?? users[0];
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(
    () => getEffectiveProfile({ sessionUser: session?.user, fallbackUser: me }),
    [session?.user, me],
  );

  // Synchronize active session user ID and profile to Zustand store
  useEffect(() => {
    if (session?.user?.id) {
      if (currentUserId !== session.user.id) {
        setCurrentUserId(session.user.id);
      }
      syncSessionUser({
        id: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        avatar: session.user.image ?? undefined,
        role: session.user.role,
        assignedBranchIds: session.user.assignedBranchIds,
      });
    }
  }, [session?.user, currentUserId, setCurrentUserId, syncSessionUser]);

  // Reset image error state whenever the effective profile image URL changes
  useEffect(() => {
    setImageError(false);
  }, [profile.image]);

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

  return (
    <div className="relative z-40 flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
      <header className="h-11 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-[#18191B]">
        {/* Left: Breadcrumbs */}
        <TopNavBreadcrumbs variant="full" />

        {/* Center: Command Palette Trigger */}
        <div
          onClick={openCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/40"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search marketing, ops & projects...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <NotificationCenter />
          <ThemeToggle />

          {/* Profile Avatar / User Menu */}
          <div ref={userMenuRef} className="relative ml-1 flex items-center gap-1.5">
            <button
              type="button"
              title={
                profile.isAuthenticated
                  ? `Signed in as ${profile.name} (${profile.email})`
                  : `Active profile: ${profile.name}`
              }
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="relative w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px] shadow-2xs cursor-pointer overflow-hidden"
            >
              {profile.image && !imageError ? (
                <AppImage
                  src={profile.image}
                  alt={profile.name}
                  fill
                  sizes="avatar"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{profile.initials}</span>
              )}

              {profile.isAuthenticated && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900 z-10" />
              )}
            </button>

            {isUserMenuOpen && (
              <UserMenuDropdown
                onClose={() => setIsUserMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </header>
      {shouldRenderProjectsFilterBar(appMode, activeView) && <ProjectsFilterBar />}
    </div>
  );
}
