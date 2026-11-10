"use client";

import { useEffect, useState, useCallback } from "react";
import type { MouLike, BorrowNotificationRow } from "./notifications";

export interface UseNotificationFeedOptions {
  isOpen?: boolean;
  endpoint?: string;
  borrowEndpoint?: string;
}

export interface UseNotificationFeedResult {
  mouRows: MouLike[];
  borrowRows: BorrowNotificationRow[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationFeed({
  isOpen = false,
  endpoint = "/api/marcom/mous",
  borrowEndpoint = "/api/marcom/inventory/borrow?status=ACTIVE",
}: UseNotificationFeedOptions = {}): UseNotificationFeedResult {
  const [mouRows, setMouRows] = useState<MouLike[]>([]);
  const [borrowRows, setBorrowRows] = useState<BorrowNotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMous = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mouRes, borrowRes] = await Promise.allSettled([
        fetch(endpoint),
        fetch(borrowEndpoint),
      ]);

      if (mouRes.status === "fulfilled" && mouRes.value.ok) {
        const json = await mouRes.value.json();
        if (Array.isArray(json.data)) {
          setMouRows(json.data);
        }
      }

      if (borrowRes.status === "fulfilled" && borrowRes.value.ok) {
        const json = await borrowRes.value.json();
        if (Array.isArray(json.data)) {
          setBorrowRows(json.data);
        }
      }
    } catch {
      // Gracefully retain existing notification state on network error
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, borrowEndpoint]);

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
    borrowRows,
    isLoading,
    refresh: fetchMous,
  };
}
