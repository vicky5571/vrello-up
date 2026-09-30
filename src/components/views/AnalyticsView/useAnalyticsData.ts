"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import {
  buildMarcomAnalyticsDashboard,
  type MarcomAnalyticsDashboardData,
} from "@/lib/marcom/analyticsEngine";

export interface UseAnalyticsDataResult {
  data: MarcomAnalyticsDashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Dual-persistence Analytics data hook.
 *
 * Reads directly from the client Marcom store caches and executes the pure
 * `buildMarcomAnalyticsDashboard` aggregation in memory (0ms latency, offline
 * capable) before falling back to a background HTTP revalidation.
 */
export function useAnalyticsData(): UseAnalyticsDataResult {
  const activeWorkspaceId =
    useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";

  // Subscribe to client Marcom store caches
  const placements = useMarcomDataStore(
    (state) => state.placementsByWorkspace[activeWorkspaceId]
  );
  const mous = useMarcomDataStore(
    (state) => state.mousByWorkspace[activeWorkspaceId]
  );
  const events = useMarcomDataStore(
    (state) => state.eventsByWorkspace[activeWorkspaceId]
  );
  const posts = useMarcomDataStore(
    (state) => state.postsByWorkspace[activeWorkspaceId]
  );
  const outlets = useMarcomDataStore((state) => state.outlets);

  const [remoteData, setRemoteData] =
    useState<MarcomAnalyticsDashboardData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-memory instant aggregation when store has data
  const localDashboard = useMemo(() => {
    const hasLocalData =
      Boolean(placements?.length) ||
      Boolean(mous?.length) ||
      Boolean(events?.length) ||
      Boolean(posts?.length);

    if (!hasLocalData) {
      return null;
    }

    return buildMarcomAnalyticsDashboard({
      mous: mous || [],
      placements: placements || [],
      contents: posts || [],
      events: events || [],
      outlets: outlets || [],
      activeOutletCount: outlets?.filter((o) => o.active !== false).length,
    });
  }, [placements, mous, events, posts, outlets]);

  // Track whether we already hold local data without re-triggering fetches
  const hasLocalDataRef = useRef(false);
  hasLocalDataRef.current = Boolean(localDashboard);

  const fetchRemote = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/marcom/analytics?workspaceId=${encodeURIComponent(activeWorkspaceId)}`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Gagal memuat analitik`);
      }
      const json = await res.json();
      if (json.ok && json.data) {
        setRemoteData(json.data);
      }
    } catch (err) {
      // In offline mode, do not surface an error if local data is already present
      if (!hasLocalDataRef.current) {
        setError(err instanceof Error ? err.message : "Gagal memuat analitik");
      }
    } finally {
      setIsFetching(false);
    }
  }, [activeWorkspaceId]);

  // Reset remote state whenever the active workspace changes
  useEffect(() => {
    setRemoteData(null);
    setError(null);
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchRemote();
  }, [fetchRemote]);

  // Prefer remote fresh data, but immediately fallback to local in-memory store
  const activeData = remoteData || localDashboard;
  const isLoading = !activeData && isFetching;

  const refresh = useCallback(async () => {
    setRemoteData(null);
    await fetchRemote();
  }, [fetchRemote]);

  return {
    data: activeData,
    isLoading,
    isRefreshing: Boolean(activeData && isFetching),
    error: activeData ? null : error,
    refresh,
  };
}
