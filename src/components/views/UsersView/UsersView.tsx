"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Users, UserX, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import type { AppUser, UserStatus } from "@/types";
import { UsersPendingTab } from "./UsersPendingTab";
import { UsersActiveTab } from "./UsersActiveTab";
import { UsersRejectedTab } from "./UsersRejectedTab";

interface UsersViewProps {
  initialCounts?: {
    pending: number;
    active: number;
    rejected: number;
  };
  currentUserId?: string;
}

export function UsersView({ initialCounts, currentUserId: propUserId }: UsersViewProps = {}) {
  const { data: session } = useSession();
  const currentUserId = propUserId ?? session?.user?.id ?? "";

  const [activeTab, setActiveTab] = useState<UserStatus>(
    (initialCounts?.pending ?? 0) > 0 ? "PENDING" : "APPROVED"
  );
  const [counts, setCounts] = useState(
    initialCounts ?? { pending: 0, active: 0, rejected: 0 }
  );
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tabRes, pendingRes, activeRes, rejectedRes] = await Promise.all([
        fetch(`/api/admin/users?status=${activeTab}&limit=50`),
        fetch("/api/admin/users?status=PENDING&limit=1"),
        fetch("/api/admin/users?status=APPROVED&limit=1"),
        fetch("/api/admin/users?status=REJECTED&limit=1"),
      ]);

      if (tabRes.ok) {
        const data = await tabRes.json();
        setUsers(data.users || []);
      }

      if (pendingRes.ok && activeRes.ok && rejectedRes.ok) {
        const [pData, aData, rData] = await Promise.all([
          pendingRes.json(),
          activeRes.json(),
          rejectedRes.json(),
        ]);
        setCounts({
          pending: pData.total || 0,
          active: aData.total || 0,
          rejected: rData.total || 0,
        });
      }
    } catch (error) {
      console.error("[UsersView] Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span>Workspace</span>
              <span>/</span>
              <span>Administrasi</span>
              <span>/</span>
              <span className="text-foreground font-semibold">Manajemen Pengguna</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manajemen Pengguna
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola persetujuan akun, penugasan role, dan status akses pengguna sistem
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/60 text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "PENDING"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pendaftaran Pending</span>
            {counts.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("APPROVED")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "APPROVED"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengguna Aktif</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REJECTED")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "REJECTED"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Ditolak / Nonaktif</span>
            {counts.rejected > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                {counts.rejected}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "PENDING" && (
          <UsersPendingTab
            users={users}
            isLoading={isLoading}
            onAction={fetchUsers}
          />
        )}

        {activeTab === "APPROVED" && (
          <UsersActiveTab
            users={users}
            currentUserId={currentUserId}
            isLoading={isLoading}
            onAction={fetchUsers}
          />
        )}

        {activeTab === "REJECTED" && (
          <UsersRejectedTab
            users={users}
            isLoading={isLoading}
            onAction={fetchUsers}
          />
        )}
      </div>
    </div>
  );
}

