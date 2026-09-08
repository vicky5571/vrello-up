"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  X,
  MapPin,
  User,
  Phone,
  Store,
  FileText,
  ExternalLink,
  Filter,
  Loader2,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { cn } from "@/lib/utils";

interface BranchDetail {
  id: string;
  code: string;
  name: string;
  region: string;
  city: string;
  status: string;
  picName: string;
  picPhone: string;
  address: string;
  outletCount: number;
  mouCount: number;
  outlets?: { id: string; code: string; name: string; type: string; city: string; active: boolean }[];
  mous?: { id: string; partnerName: string; mouType: string; status: string; compensationValue: number }[];
}

export function BranchDetailDrawer() {
  const { selectedBranchId, setSelectedBranchId, navigateToMarcom } = useWorkspaceStore();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBranchId) {
      setBranch(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/marcom/branches/${selectedBranchId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load branch (${res.status})`);
        const json = await res.json();
        if (isMounted) setBranch(json.data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Error loading branch");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedBranchId) {
        setSelectedBranchId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBranchId, setSelectedBranchId]);

  if (!selectedBranchId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedBranchId(null)}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-over Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {branch?.code || "..."}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        branch?.status === "DONE"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : branch?.status === "ON_PROGRESS"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-slate-500/10 text-slate-500"
                      )}
                    >
                      {branch?.status?.replace("_", " ") || "BRANCH"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {branch?.name || "Branch Details"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBranchId(null)}
                aria-label="Close branch drawer"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                  <span>Loading branch details...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                  {error}
                </div>
              ) : branch ? (
                <>
                  {/* Location & PIC info */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Region & City
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{branch.city}, {branch.region}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Person In Charge
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                        <User className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="truncate">{branch.picName || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Phone
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Phone className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{branch.picPhone || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Address
                      </span>
                      <div className="text-slate-700 dark:text-slate-200 truncate">
                        {branch.address || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Connected Relationships Cards */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Connected Operations</span>
                    </h4>

                    {/* Outlets Link Card */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-cyan-500/50 transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Outlets Network
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          {branch.outletCount} {branch.outletCount === 1 ? "outlet" : "outlets"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        All traditional and modern retail outlets operating under this branch.
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigateToMarcom("outlets", branch.name);
                            setSelectedBranchId(null);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>View Outlets in this Branch</span>
                        </button>
                      </div>
                    </div>

                    {/* MOUs Link Card */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-fuchsia-500/50 transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-fuchsia-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Partnerships & MOUs
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
                          {branch.mouCount} {branch.mouCount === 1 ? "MOU" : "MOUs"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Legal agreements, sponsorships, and compensation contracts in this branch.
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigateToMarcom("mous", branch.name);
                            setSelectedBranchId(null);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>View MOUs in this Branch</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Outlets List if available */}
                  {branch.outlets && branch.outlets.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Sample Outlets ({branch.outlets.length})
                        </span>
                      </div>
                      <div className="space-y-1 max-h-44 overflow-y-auto">
                        {branch.outlets.slice(0, 5).map((outlet) => (
                          <div
                            key={outlet.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                          >
                            <div className="truncate">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {outlet.name}
                              </span>
                              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                                ({outlet.code})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigateToMarcom("outlets", outlet.name);
                                setSelectedBranchId(null);
                              }}
                              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  navigateToMarcom("branches", branch?.code || branch?.name);
                  setSelectedBranchId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Jump to Branches Table</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBranchId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
