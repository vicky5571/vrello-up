"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Trash2, Ban } from "lucide-react";
import type { AppUser, UserRole } from "@/types";
import { UserStatusBadge } from "./UserStatusBadge";
import { AppImage } from "@/components/ui/AppImage";

interface UsersRejectedTabProps {
  users: AppUser[];
  isLoading: boolean;
  onAction: () => void;
  actorRole?: UserRole;
}

export function UsersRejectedTab({ users, isLoading, onAction, actorRole }: UsersRejectedTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReapprove = async (user: AppUser) => {
    setProcessingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error("Failed to reapprove");
      toast.success(`Akun ${user.name} berhasil diaktifkan kembali`);
      onAction();
    } catch {
      toast.error("Gagal mengaktifkan kembali akun.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`Hapus permanen akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setProcessingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success(`Akun ${user.name} berhasil dihapus permanen`);
      onAction();
    } catch {
      toast.error("Gagal menghapus akun pengguna.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat data pengguna ditolak...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-border flex flex-col items-center justify-center space-y-3 bg-muted/20">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Ban className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-sm">Tidak Ada Pengguna Ditolak</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tidak ada akun yang ditolak atau dinonaktifkan dalam sistem.
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
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Terdaftar</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
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
                  <td className="py-3.5 px-4">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {(() => {
                      const isTargetAdmin = user.role === "admin";
                      const isSupervisorBlocked = actorRole === "supervisor" && isTargetAdmin;

                      return (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleReapprove(user)}
                            disabled={isBusy || isSupervisorBlocked}
                            title={isSupervisorBlocked ? "Supervisor tidak dapat mengaktifkan akun Admin" : "Aktifkan Kembali"}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Aktifkan Kembali</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={isBusy || isSupervisorBlocked}
                            title={isSupervisorBlocked ? "Supervisor tidak dapat menghapus akun Admin" : "Hapus"}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

