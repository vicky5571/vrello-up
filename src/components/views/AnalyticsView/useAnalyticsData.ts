"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import {
  filterPlacementsByCriteria,
  filterMousByCriteria,
  filterEventsByCriteria,
  filterContentByCriteria,
  DEFAULT_ANALYTICS_FILTERS,
  isAnyFilterActive,
  type AnalyticsFilterState,
} from "@/lib/marcom/analyticsFilterHelpers";
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
 *
 * When operational filters (branch / brand / quarter) are active, the
 * in-memory filtered dashboard takes precedence over the unfiltered remote
 * payload so that every metric reflects the selected scope instantly.
 */
export function useAnalyticsData(
  filters: AnalyticsFilterState = DEFAULT_ANALYTICS_FILTERS
): UseAnalyticsDataResult {
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

  // In-memory instant aggregation when store has data (respects active filters)
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
      mous: filterMousByCriteria(mous || [], filters),
      placements: filterPlacementsByCriteria(placements || [], filters),
      contents: filterContentByCriteria(posts || [], filters),
      events: filterEventsByCriteria(events || [], filters),
      outlets: outlets || [],
      activeOutletCount: outlets?.filter((o) => o.active !== false).length,
    });
  }, [placements, mous, events, posts, outlets, filters]);

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

  // When filters are active, the in-memory filtered dashboard must win over
  // the unfiltered remote payload. Otherwise prefer remote fresh data and
  // immediately fall back to local in-memory store.
  const filtersActive = isAnyFilterActive(filters);
  const activeData =
    filtersActive && localDashboard
      ? localDashboard
      : remoteData || localDashboard;
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
