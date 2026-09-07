import { realtimeHub, type RealtimeEvent } from "@/lib/server/realtimeHub";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let listener: ((event: RealtimeEvent) => void) | null = null;
  let keepAlive: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial presence state immediately on connection
      const initialPresence = {
        type: "presence:sync",
        data: realtimeHub.getPresenceSnapshot(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPresence)}\n\n`));

      // Listen for realtime events and forward to SSE stream
      listener = (event: RealtimeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream may be closed
        }
      };

      realtimeHub.on("event", listener);

      // Heartbeat comment to prevent client/proxy timeouts
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (keepAlive) clearInterval(keepAlive);
        }
      }, 15_000);

      request.signal.addEventListener("abort", () => {
        if (keepAlive) clearInterval(keepAlive);
        if (listener) realtimeHub.off("event", listener);
        try {
          controller.close();
        } catch {
          // Ignored
        }
      });
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      if (listener) realtimeHub.off("event", listener);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

