"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Loader2, Clock, UserCheck } from "lucide-react";
import { AppImage } from "@/components/ui/AppImage";
import type { AppUser, UserRole } from "@/types";
import { ApproveUserModal } from "./ApproveUserModal";
import type { BranchLookupItem } from "@/lib/marcom/branchAssignmentHelpers";

interface UsersPendingTabProps {
  users: AppUser[];
  isLoading: boolean;
  onAction: () => void;
  branches?: BranchLookupItem[];
  actorRole?: UserRole;
  actorBranchIds?: string[];
}

export function UsersPendingTab({
  users,
  isLoading,
  onAction,
  branches = [],
  actorRole = "admin",
  actorBranchIds = [],
}: UsersPendingTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingUser, setApprovingUser] = useState<AppUser | null>(null);

  const handleConfirmApprove = async (role: UserRole, assignedBranchIds: string[]) => {
    if (!approvingUser) return;
    setProcessingId(approvingUser.id);
    try {
      const res = await fetch(`/api/admin/users/${approvingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          role,
          assignedBranchIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyetujui akun");
      }
      toast.success(`Akun ${approvingUser.name} berhasil disetujui`);
      setApprovingUser(null);
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyetujui akun.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (user: AppUser) => {
    setProcessingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          reason: rejectionReason.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success(`Pendaftaran ${user.name} ditolak`);
      setRejectingId(null);
      setRejectionReason("");
      onAction();
    } catch {
      toast.error("Gagal menolak pendaftaran.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat data pendaftaran...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-border flex flex-col items-center justify-center space-y-3 bg-muted/20">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Clock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-sm">Tidak Ada Pendaftaran Pending</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Semua registrasi akun baru telah diproses atau belum ada pendaftaran baru.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4">Pengguna</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Waktu Daftar</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const isRejecting = rejectingId === user.id;
              const isBusy = processingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {user.avatar ? (
                          <AppImage src={user.avatar} alt={user.name} fill sizes="32px" className="object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isRejecting ? (
                      <div className="flex flex-col items-end gap-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Alasan penolakan (opsional)..."
                          className="w-64 p-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-destructive resize-none"
                          rows={2}
                          disabled={isBusy}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                            disabled={isBusy}
                            className="px-2.5 py-1 text-xs rounded-md text-muted-foreground hover:bg-muted font-medium transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmReject(user)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium transition-colors"
                          >
                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setApprovingUser(user)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Setujui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(user.id);
                            setRejectionReason("");
                          }}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ApproveUserModal
        user={approvingUser}
        isOpen={!!approvingUser}
        branches={branches}
        actorRole={actorRole}
        actorBranchIds={actorBranchIds}
        isBusy={!!processingId}
        onConfirm={handleConfirmApprove}
        onClose={() => setApprovingUser(null)}
      />
    </div>
  );
}

