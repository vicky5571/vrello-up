"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, ShieldCheck, Clock, UserX, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import type { UserStatus } from "@/types";

export interface UsersHeaderProps {
  counts: {
    pending: number;
    active: number;
    rejected: number;
  };
  activeTab: UserStatus;
  onTabChange: (tab: UserStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function UsersHeader({
  counts,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isLoading,
  onRefresh,
}: UsersHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  const totalUsers = counts.pending + counts.active + counts.rejected;

  const tabs: {
    id: UserStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }[] = [
    {
      id: "PENDING",
      label: "Pendaftaran Pending",
      icon: Clock,
      count: counts.pending,
    },
    {
      id: "APPROVED",
      label: "Pengguna Aktif",
      icon: ShieldCheck,
      count: counts.active,
    },
    {
      id: "REJECTED",
      label: "Ditolak / Nonaktif",
      icon: UserX,
      count: counts.rejected,
    },
  ];

  const kpiItems: KpiCardItem[] = [
    {
      label: "Total Pengguna",
      value: totalUsers,
      helper: "Terdaftar dalam database",
      icon: Users,
      color: "indigo",
    },
    {
      label: "Menunggu Review",
      value: counts.pending,
      helper:
        counts.pending > 0
          ? "Memerlukan persetujuan admin"
          : "Tidak ada antrean pending",
      icon: Clock,
      color: "amber",
      onClick: () => onTabChange("PENDING"),
      active: activeTab === "PENDING",
    },
    {
      label: "Pengguna Aktif",
      value: counts.active,
      helper: "Akses sistem diizinkan",
      icon: ShieldCheck,
      color: "emerald",
      onClick: () => onTabChange("APPROVED"),
      active: activeTab === "APPROVED",
    },
    {
      label: "Akun Ditolak / Nonaktif",
      value: counts.rejected,
      helper: "Akses akun diblokir",
      icon: UserX,
      color: "rose",
      onClick: () => onTabChange("REJECTED"),
      active: activeTab === "REJECTED",
    },
  ];

  return (
    <div className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola persetujuan registrasi akun, konfigurasi role otoritas, dan status hak akses pengguna sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Segarkan data pengguna"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-4 h-4", isLoading && "animate-spin text-indigo-600")}
            />
          </button>
        </div>
      </div>

      {/* 2. Controls & Navigation Row (Pills above Cards to avoid CLS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer select-none",
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeUsersTabPill"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                    transition={pillTransition}
                  />
                )}
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 relative z-10",
                    isActive && "text-indigo-600 dark:text-indigo-400"
                  )}
                />
                <span className="relative z-10">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "relative z-10 ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold border",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                        : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 border-transparent",
                      tab.id === "PENDING" &&
                        tab.count > 0 &&
                        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      tab.id === "REJECTED" &&
                        tab.count > 0 &&
                        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Search input with clear button */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, email, atau role..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. KPI Summary Cards Bar */}
      <KpiSummaryCards items={kpiItems} mobileStrip />
    </div>
  );
}
