import { fetchAllTrends, clusterNarratives } from "@/lib/scanner";
import { fetchFourMemeTokens } from "@/lib/fourmeme";
import { scoreGaps } from "@/lib/scoring";
import { insertGap, checkDiskSpace } from "@/lib/db";
import type { PipelineEvent, SignalSource } from "@/types";

type EventCallback = (event: PipelineEvent) => void;

let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners: Set<EventCallback> = new Set();

export function subscribe(callback: EventCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emit(event: PipelineEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error("Event listener error:", err);
    }
  }
}

export async function runCycle(): Promise<{ gaps: number; sources: Record<SignalSource, number> }> {
  if (isRunning) {
    console.log("Pipeline cycle already running, skipping");
    return { gaps: 0, sources: { reddit: 0, google_trends: 0, dexscreener: 0, coingecko: 0, twitter: 0 } };
  }

  isRunning = true;
  const twitterApiKey = process.env.TWITTER_API_KEY;

  try {
    checkDiskSpace();

    // 1. Fetch trends from all sources
    console.log("[Pipeline] Scanning all sources...");
    const { signals, sourcesSummary } = await fetchAllTrends(twitterApiKey || undefined);

    emit({ type: "scan_cycle", data: { timestamp: new Date().toISOString(), sourcesSummary } });

    if (signals.length === 0) {
      console.log("[Pipeline] No signals found this cycle");
      return { gaps: 0, sources: sourcesSummary };
    }
    console.log(`[Pipeline] Got ${signals.length} signals`);

    // 2. Cluster into narratives
    const narratives = clusterNarratives(signals);
    console.log(`[Pipeline] Found ${narratives.length} narrative clusters`);

    // 3. Fetch existing Four.meme tokens
    const existingTokens = await fetchFourMemeTokens();
    console.log(`[Pipeline] ${existingTokens.length} existing Four.meme tokens loaded`);

    // 4. Score gaps
    const gaps = scoreGaps(narratives, existingTokens);
    console.log(`[Pipeline] ${gaps.length} narrative gaps detected`);

    // 5. Save gaps and emit events
    for (const gap of gaps) {
      insertGap(gap);
      emit({ type: "gap_detected", data: gap });
    }

    return { gaps: gaps.length, sources: sourcesSummary };
  } catch (err) {
    console.error("[Pipeline] Cycle error:", err);
    return { gaps: 0, sources: { reddit: 0, google_trends: 0, dexscreener: 0, coingecko: 0, twitter: 0 } };
  } finally {
    isRunning = false;
  }
}

export function startPipeline(intervalMs = 300_000) {
  if (intervalId) {
    console.log("Pipeline already running");
    return;
  }

  console.log(`[Pipeline] Starting with ${intervalMs / 1000}s interval`);
  runCycle();
  intervalId = setInterval(runCycle, intervalMs);
}

export function stopPipeline() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Pipeline] Stopped");
  }
}
