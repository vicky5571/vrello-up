"use client";

import React from "react";
import { User, RefreshCw, ShieldCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileHeaderProps {
  isGoogleAccount?: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProfileHeader({
  isGoogleAccount = false,
  isLoading,
  onRefresh,
}: ProfileHeaderProps) {
  return (
    <div className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
              <User className="w-4 h-4" />
            </div>
            <span>Profil & Keamanan Akun</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola foto profil personal, nama tampilan, penugasan cabang, dan kredensial keamanan akun Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Account provider badge */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border",
              isGoogleAccount
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
            )}
          >
            {isGoogleAccount ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Google Verified</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Credentials Account</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Muat ulang profil"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-indigo-600")} />
          </button>
        </div>
      </div>
    </div>
  );
}

