"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, UserX } from "lucide-react";
import type { AppUser, UserRole } from "@/types";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserRoleSelect } from "./UserRoleSelect";
import { AppImage } from "@/components/ui/AppImage";

interface UsersActiveTabProps {
  users: AppUser[];
  currentUserId: string;
  isLoading: boolean;
  onAction: () => void;
}

export function UsersActiveTab({
  users,
  currentUserId,
  isLoading,
  onAction,
}: UsersActiveTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

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
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Terakhir Masuk</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3.5 px-4">
                    <UserRoleSelect
                      value={user.role}
                      onChange={(newRole) => handleRoleChange(user, newRole)}
                      disabled={isBusy || (isCurrentUser && user.role === "admin")}
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Belum pernah"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeactivate(user)}
                      disabled={isBusy || isCurrentUser}
                      title={isCurrentUser ? "Tidak dapat menonaktifkan akun sendiri" : "Nonaktifkan akun"}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      <span>Nonaktifkan</span>
                    </button>
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

