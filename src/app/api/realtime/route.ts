import { realtimeHub, RealtimeHub, type RealtimeEvent } from "@/lib/server/realtimeHub";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") || undefined;
  const channel = RealtimeHub.getWorkspaceChannel(workspaceId);

  let unsubscribe: (() => void) | null = null;
  let keepAlive: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial presence state immediately on connection for the active workspace
      const initialPresence = {
        type: "presence:sync",
        workspaceId,
        data: realtimeHub.getPresenceSnapshot(workspaceId || "default"),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPresence)}\n\n`));

      // Listen for realtime events on the workspace channel (or wildcard)
      unsubscribe = realtimeHub.subscribe(channel, (event: RealtimeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream may be closed or in error state
        }
      });

      // Heartbeat comment to prevent proxy or serverless timeouts
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (keepAlive) clearInterval(keepAlive);
        }
      }, 15_000);

      // Clean up cleanly on connection abort
      request.signal.addEventListener("abort", () => {
        if (keepAlive) clearInterval(keepAlive);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        try {
          controller.close();
        } catch {
          // Ignored if already closed
        }
      });
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
