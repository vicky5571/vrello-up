"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";

export interface UserMenuDropdownProps {
  onClose: () => void;
}

export function UserMenuDropdown({ onClose }: UserMenuDropdownProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;
  const isGoogle = Boolean(user?.image);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Berhasil keluar dari akun.");
      router.push("/login");
      router.refresh();
      onClose();
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-card shadow-xl border border-border p-2 z-50 text-xs">
      {/* Profile Header Card */}
      <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground truncate">
                {user?.name || "Pengguna"}
              </span>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {user?.role || "viewer"}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {user?.email || ""}
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

      {/* Sign Out Button */}
      <div className="mt-2 pt-1 border-t border-border/40">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-medium text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Sign Out)</span>
          </div>
        </button>
      </div>
    </div>
  );
}
