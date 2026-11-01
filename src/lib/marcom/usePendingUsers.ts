"use client";

import { useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { fetchPendingUsersCountApi } from "./pendingUsersHelpers";

export interface UsePendingUsersOptions {
  isAdmin?: boolean;
  pollIntervalMs?: number;
}

export function usePendingUsers({
  isAdmin = false,
  pollIntervalMs = 60000,
}: UsePendingUsersOptions = {}) {
  const pendingUsersCount = useWorkspaceStore((s) => s.pendingUsersCount);
  const setPendingUsersCount = useWorkspaceStore((s) => s.setPendingUsersCount);

  const refreshPendingCount = useCallback(async () => {
    if (!isAdmin) return;
    const count = await fetchPendingUsersCountApi();
    setPendingUsersCount(count);
  }, [isAdmin, setPendingUsersCount]);

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;
    fetchPendingUsersCountApi().then((count) => {
      if (mounted) setPendingUsersCount(count);
    });

    const onFocus = () => {
      fetchPendingUsersCountApi().then((count) => {
        if (mounted) setPendingUsersCount(count);
      });
    };

    window.addEventListener("focus", onFocus);

    let intervalId: NodeJS.Timeout | null = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        fetchPendingUsersCountApi().then((count) => {
          if (mounted) setPendingUsersCount(count);
        });
      }, pollIntervalMs);
    }

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAdmin, pollIntervalMs, setPendingUsersCount]);

  return {
    pendingUsersCount,
    refreshPendingCount,
  };
}

