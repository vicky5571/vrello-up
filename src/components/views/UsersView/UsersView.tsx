"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { AppUser, UserRole, UserStatus } from "@/types";
import { UsersPendingTab } from "./UsersPendingTab";
import { UsersActiveTab } from "./UsersActiveTab";
import { UsersRejectedTab } from "./UsersRejectedTab";
import { UsersHeader } from "./UsersHeader";
import { filterUsers } from "./usersFilterHelpers";

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
  const actorRole = (session?.user?.role as UserRole) || "viewer";
  const setPendingUsersCount = useWorkspaceStore((s) => s.setPendingUsersCount);

  const [activeTab, setActiveTab] = useState<UserStatus>(
    (initialCounts?.pending ?? 0) > 0 ? "PENDING" : "APPROVED"
  );
  const [counts, setCounts] = useState(
    initialCounts ?? { pending: 0, active: 0, rejected: 0 }
  );
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
        const pendingTotal = pData.total || 0;
        setCounts({
          pending: pendingTotal,
          active: aData.total || 0,
          rejected: rData.total || 0,
        });
        setPendingUsersCount(pendingTotal);
      }
    } catch (error) {
      console.error("[UsersView] Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, setPendingUsersCount]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(
    () => filterUsers(users, searchQuery),
    [users, searchQuery]
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      <UsersHeader
        counts={counts}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        onRefresh={fetchUsers}
      />

      <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4">
        {activeTab === "PENDING" && (
          <UsersPendingTab
            users={filteredUsers}
            isLoading={isLoading}
            onAction={fetchUsers}
          />
        )}

        {activeTab === "APPROVED" && (
          <UsersActiveTab
            users={filteredUsers}
            currentUserId={currentUserId}
            isLoading={isLoading}
            onAction={fetchUsers}
            actorRole={actorRole}
          />
        )}

        {activeTab === "REJECTED" && (
          <UsersRejectedTab
            users={filteredUsers}
            isLoading={isLoading}
            onAction={fetchUsers}
            actorRole={actorRole}
          />
        )}
      </div>
    </div>
  );
}

