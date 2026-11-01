"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import type { AppUser, UserRole } from "@/types";
import { UserActiveRow } from "./UserActiveRow";
import { UserBranchSelectModal } from "./UserBranchSelectModal";
import type { BranchLookupItem } from "@/lib/marcom/branchAssignmentHelpers";

interface UsersActiveTabProps {
  users: AppUser[];
  currentUserId: string;
  isLoading: boolean;
  onAction: () => void;
  actorRole?: UserRole;
  actorBranchIds?: string[];
  branches?: BranchLookupItem[];
}

export function UsersActiveTab({
  users,
  currentUserId,
  isLoading,
  onAction,
  actorRole,
  actorBranchIds = [],
  branches = [],
}: UsersActiveTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingBranchUser, setEditingBranchUser] = useState<AppUser | null>(null);

  const handleRoleChange = async (user: AppUser, newRole: UserRole) => {
    if (user.role === newRole) return;
    setProcessingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast.success(`Role ${user.name} diubah menjadi ${newRole}`);
      onAction();
    } catch {
      toast.error("Gagal mengubah role pengguna.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (user: AppUser) => {
    if (user.id === currentUserId) {
      toast.error("Anda tidak dapat menonaktifkan akun sendiri.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menonaktifkan akun ${user.name}?`)) {
      return;
    }

    setProcessingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      toast.success(`Akun ${user.name} berhasil dinonaktifkan`);
      onAction();
    } catch {
      toast.error("Gagal menonaktifkan akun.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBranchSave = async (assignedBranchIds: string[]) => {
    if (!editingBranchUser) return;
    setProcessingId(editingBranchUser.id);
    try {
      const res = await fetch(`/api/admin/users/${editingBranchUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedBranchIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengubah cabang");
      }
      toast.success(`Cabang penugasan ${editingBranchUser.name} berhasil diperbarui`);
      setEditingBranchUser(null);
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah penugasan cabang.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat data pengguna aktif...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-border flex flex-col items-center justify-center space-y-3 bg-muted/20">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Users className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-sm">Tidak Ada Pengguna Aktif</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Belum ada pengguna yang berstatus aktif di dalam sistem.
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
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Cabang</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Terakhir Masuk</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <UserActiveRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                isBusy={processingId === user.id}
                actorRole={actorRole}
                branches={branches}
                onRoleChange={handleRoleChange}
                onDeactivate={handleDeactivate}
                onEditBranches={setEditingBranchUser}
              />
            ))}
          </tbody>
        </table>
      </div>

      <UserBranchSelectModal
        user={editingBranchUser}
        isOpen={!!editingBranchUser}
        branches={branches}
        actorRole={actorRole}
        actorBranchIds={actorBranchIds}
        isBusy={!!processingId}
        onSave={handleBranchSave}
        onClose={() => setEditingBranchUser(null)}
      />
    </div>
  );
}
