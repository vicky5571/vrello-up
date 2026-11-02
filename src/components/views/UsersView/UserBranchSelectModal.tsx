"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Building2, Check } from "lucide-react";
import type { AppUser, UserRole } from "@/types";
import {
  getAssignableBranches,
  type BranchLookupItem,
} from "@/lib/marcom/branchAssignmentHelpers";

interface UserBranchSelectModalProps {
  user: AppUser | null;
  isOpen: boolean;
  branches: BranchLookupItem[];
  actorRole?: UserRole;
  actorBranchIds?: string[];
  isBusy: boolean;
  onSave: (assignedBranchIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function UserBranchSelectModal({
  user,
  isOpen,
  branches,
  actorRole = "admin",
  actorBranchIds = [],
  isBusy,
  onSave,
  onClose,
}: UserBranchSelectModalProps) {
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedBranchIds(user.assignedBranchIds || []);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const assignableBranches = getAssignableBranches(actorRole, actorBranchIds, branches);
  const isTargetAdmin = user.role === "admin";

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBranchIds(assignableBranches.map((b) => b.id));
  };

  const handleClearAll = () => {
    setSelectedBranchIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(selectedBranchIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Penugasan Cabang</h3>
              <p className="text-xs text-muted-foreground">{user.name} ({user.role})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {isTargetAdmin ? (
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center space-y-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                Semua Cabang (Nasional)
              </span>
              <p className="text-xs text-muted-foreground">
                Akun Administrator memiliki akses penuh lintas cabang di seluruh Indonesia secara otomatis.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Pilih Cabang Operasional
                </label>
                {assignableBranches.length > 1 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-primary hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Kosongkan
                    </button>
                  </div>
                )}
              </div>

              {assignableBranches.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  Tidak ada cabang yang tersedia dalam otoritas penugasan Anda.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2 bg-muted/10">
                  {assignableBranches.map((branch) => {
                    const isChecked = selectedBranchIds.includes(branch.id);
                    return (
                      <label
                        key={branch.id}
                        className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-primary/10 text-foreground font-medium"
                            : "hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => toggleBranch(branch.id)}
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors pointer-events-none ${
                              isChecked
                                ? "bg-primary border-primary text-white"
                                : "border-muted-foreground/30 bg-card"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span>{branch.name}</span>
                          {branch.code && (
                            <span className="text-[10px] text-muted-foreground uppercase">
                              ({branch.code})
                            </span>
                          )}
                        </div>
                        {branch.region && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {branch.region}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Batal
            </button>
            {!isTargetAdmin && (
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Simpan Perubahan</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

