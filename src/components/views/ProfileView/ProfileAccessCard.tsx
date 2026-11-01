"use client";

import React from "react";
import { Shield, Building2, Calendar, Check } from "lucide-react";
import { formatBranchBadges, type BranchLookupItem } from "./profileHelpers";

export interface ProfileAccessCardProps {
  role?: string;
  createdAt?: string;
  assignedBranchIds?: string[];
  branches: BranchLookupItem[];
}

export function ProfileAccessCard({
  role,
  createdAt,
  assignedBranchIds = [],
  branches = [],
}: ProfileAccessCardProps) {
  const branchBadges = formatBranchBadges(assignedBranchIds, branches, role);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Hak Akses & Penugasan Operasional
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Peran Akun (RBAC)</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            <Check className="w-3 h-3" />
            {role || "MEMUAT..."}
          </span>
        </div>

        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Terdaftar Sejak</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium inline-flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {createdAt ? new Date(createdAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Wilayah Cabang yang Ditugaskan</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {branchBadges.map((badge, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

