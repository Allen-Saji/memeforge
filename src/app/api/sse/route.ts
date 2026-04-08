import { subscribe } from "@/lib/pipeline";
import { getRecentGaps, getRecentPackages } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data dump
      const gaps = getRecentGaps(20);
      const packages = getRecentPackages(20);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "init", gaps, packages })}\n\n`
        )
      );

      // Subscribe to pipeline events
      const unsubscribe = subscribe((event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Client disconnected
          unsubscribe();
        }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30_000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
