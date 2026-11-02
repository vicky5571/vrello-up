"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Building2, ShieldCheck, Check } from "lucide-react";
import type { AppUser, UserRole } from "@/types";
import {
  getAssignableBranches,
  type BranchLookupItem,
} from "@/lib/marcom/branchAssignmentHelpers";

interface ApproveUserModalProps {
  user: AppUser | null;
  isOpen: boolean;
  branches: BranchLookupItem[];
  actorRole?: UserRole;
  actorBranchIds?: string[];
  isBusy: boolean;
  onConfirm: (role: UserRole, assignedBranchIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function ApproveUserModal({
  user,
  isOpen,
  branches,
  actorRole = "admin",
  actorBranchIds = [],
  isBusy,
  onConfirm,
  onClose,
}: ApproveUserModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("staff");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role === "admin" ? "staff" : user.role);
      setSelectedBranchIds(user.assignedBranchIds || []);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const assignableBranches = getAssignableBranches(actorRole, actorBranchIds, branches);
  const isSupervisorActor = actorRole === "supervisor";

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
    await onConfirm(selectedRole, selectedRole === "admin" ? [] : selectedBranchIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Setujui Pendaftaran</h3>
              <p className="text-xs text-muted-foreground">{user.name} ({user.email})</p>
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
          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Tetapkan Peran (Role)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["staff", "supervisor", ...(isSupervisorActor ? [] : ["admin"])] as UserRole[]).map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                      selectedRole === role
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {role}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Branch Assignment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Penugasan Cabang</span>
              </label>
              {selectedRole !== "admin" && assignableBranches.length > 1 && (
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

            {selectedRole === "admin" ? (
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                Role Administrator memiliki akses penuh ke seluruh cabang secara nasional.
              </div>
            ) : assignableBranches.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                Tidak ada cabang yang tersedia dalam kewenangan Anda untuk ditugaskan.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2 bg-muted/10">
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
            <p className="text-[11px] text-muted-foreground">
              {selectedRole === "supervisor"
                ? "Supervisor dapat membawahi satu atau beberapa cabang."
                : "Staf biasanya ditugaskan pada satu cabang operasional."}
            </p>
          </div>

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
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Setujui & Aktifkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

