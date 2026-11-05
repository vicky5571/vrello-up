"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { getEffectiveProfile } from "./userProfileHelpers";
import { AppImage } from "@/components/ui/AppImage";

export interface UserMenuDropdownProps {
  onClose: () => void;
}

export function UserMenuDropdown({ onClose }: UserMenuDropdownProps) {
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);

  const profile = getEffectiveProfile({ sessionUser: session?.user });
  const isGoogle = Boolean(session?.user?.image);

  const handleNavigateProfile = () => {
    setActiveView("profile");
    onClose();
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-card shadow-xl border border-border p-2 z-50 text-xs">
      {/* Profile Header Card */}
      <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
            {profile.image && !imageError ? (
              <AppImage
                src={profile.image}
                alt={profile.name}
                fill
                sizes="36px"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground truncate">
                {profile.name}
              </span>
              <span
                className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  profile.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : profile.role === "supervisor"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : profile.role === "staff"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {profile.role}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {profile.email}
            </div>
          </div>
        </div>

        {isGoogle && (
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Google Verified Account</span>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="mt-2 pt-1 border-t border-border/40 space-y-0.5">
        <button
          type="button"
          onClick={handleNavigateProfile}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-foreground hover:bg-muted font-medium text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Lihat Profil & Akun</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-medium text-xs transition-colors cursor-pointer ${
            isLoggingOut ? "pointer-events-none opacity-70 cursor-wait" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-destructive" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isLoggingOut ? "Keluar..." : "Keluar (Sign Out)"}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
