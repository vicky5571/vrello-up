"use client";

import React from "react";
import { signOut } from "next-auth/react";
import type { User } from "@/types";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ShieldCheck, LogOut, LogIn, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface UserMenuDropdownProps {
  session: any;
  me: User;
  members: User[];
  setCurrentUserId: (id: string) => void;
  onClose: () => void;
  onOpenLogin: () => void;
}

export function UserMenuDropdown({
  session,
  me,
  members,
  setCurrentUserId,
  onClose,
  onOpenLogin,
}: UserMenuDropdownProps) {
  const isGoogleSession = Boolean(session?.user);

  return (
    <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs">
      {/* Profile Header Card */}
      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <UserAvatar user={me} size="sm" showTooltip={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {session?.user?.name || me?.name}
              </span>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {me?.role || "Member"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {session?.user?.email || me?.email}
            </div>
          </div>
        </div>

        {isGoogleSession ? (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Verified</span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await signOut({ redirect: false });
                setCurrentUserId("user-1");
                onClose();
                toast.success("Signed out of Google session. Switched to demo mode.");
              }}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:underline cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="mt-2 w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>

      {isGoogleSession ? (
        /* Authenticated Session: Persona Simulation is Locked */
        <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Identity Locked</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
            Task creations, comments, and activities are strictly attributed to your verified Google account. Persona switching is disabled while authenticated.
          </p>
        </div>
      ) : (
        /* Demo Mode: Persona Simulation List */
        <div className="mt-2">
          <div className="px-1.5 py-1 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Simulate Persona</span>
            <span className="text-[9px] font-normal normal-case text-amber-600 dark:text-amber-400 font-medium">
              local demo only
            </span>
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {members.map((u) => {
              const isCurrent = u.id === me?.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setCurrentUserId(u.id);
                    onClose();
                    toast.success(`Switched active persona to ${u.name}`);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left cursor-pointer transition-colors",
                    isCurrent
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  <UserAvatar user={u} size="xs" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs">{u.name}</div>
                    <div className="text-[9px] text-slate-400 capitalize">{u.role || "Member"}</div>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
