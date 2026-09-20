"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { type User } from "@/types";

export function useRealtime() {
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const selectedTaskId = useWorkspaceStore((s) => s.selectedTaskId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const setPresenceByTaskId = useWorkspaceStore((s) => s.setPresenceByTaskId);
  const applyRemoteTaskUpsert = useWorkspaceStore((s) => s.applyRemoteTaskUpsert);
  const applyRemoteTaskDelete = useWorkspaceStore((s) => s.applyRemoteTaskDelete);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const currentUser: User =
    activeWorkspace?.members?.find((m) => m.id === currentUserId) || {
      id: currentUserId,
      name: "Anonymous",
      email: "user@vrelloup.dev",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    };

  const selectedTaskIdRef = useRef(selectedTaskId);
  selectedTaskIdRef.current = selectedTaskId;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // 1. Establish SSE Connection scoped to active workspace
  useEffect(() => {
    if (typeof window === "undefined" || !activeWorkspaceId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      const url = `/api/realtime?workspaceId=${encodeURIComponent(activeWorkspaceId)}`;
      eventSource = new EventSource(url);

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload || !payload.type) return;

          switch (payload.type) {
            case "presence:sync":
              setPresenceByTaskId(payload.data || {});
              break;
            case "task:upsert":
              if (payload.data) applyRemoteTaskUpsert(payload.data);
              break;
            case "task:delete":
              if (payload.data?.taskId) applyRemoteTaskDelete(payload.data.taskId);
              break;
          }
        } catch {
          // Keepalive comments or non-JSON payloads
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [activeWorkspaceId, setPresenceByTaskId, applyRemoteTaskUpsert, applyRemoteTaskDelete]);

  // 2. Presence Heartbeat scoped to active workspace
  useEffect(() => {
    if (typeof window === "undefined" || !activeWorkspaceId) return;

    function sendPresence(taskId: string | null) {
      const user = currentUserRef.current;
      if (!user) return;
      fetch("/api/realtime/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          user,
          taskId,
          workspaceId: activeWorkspaceId,
        }),
      }).catch(() => {});
    }

    // Send immediately when selectedTaskId changes
    sendPresence(selectedTaskId);

    // Periodic heartbeat every 10 seconds
    const interval = setInterval(() => {
      sendPresence(selectedTaskIdRef.current);
    }, 10_000);

    return () => {
      clearInterval(interval);
      // Clean up presence on unmount
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/realtime/presence",
          JSON.stringify({
            userId: currentUserRef.current.id,
            user: currentUserRef.current,
            taskId: null,
            workspaceId: activeWorkspaceId,
          }),
        );
      }
    };
  }, [activeWorkspaceId, selectedTaskId]);
}
