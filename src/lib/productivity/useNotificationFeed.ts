"use client";

import { useEffect, useState, useCallback } from "react";
import type { MouLike } from "./notifications";

export interface UseNotificationFeedOptions {
  isOpen?: boolean;
  endpoint?: string;
}

export interface UseNotificationFeedResult {
  mouRows: MouLike[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationFeed({
  isOpen = false,
  endpoint = "/api/marcom/mous",
}: UseNotificationFeedOptions = {}): UseNotificationFeedResult {
  const [mouRows, setMouRows] = useState<MouLike[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMous = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setMouRows(json.data);
        }
      }
    } catch {
      // Gracefully retain existing notification state on network error
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // 1. Initial mount fetch + re-fetch when isOpen transitions to true
  useEffect(() => {
    fetchMous();
  }, [fetchMous, isOpen]);

  // 2. Proactive sync on window focus (when user returns to the tab)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onFocus = () => {
      fetchMous();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchMous]);

  return {
    mouRows,
    isLoading,
    refresh: fetchMous,
  };
}

