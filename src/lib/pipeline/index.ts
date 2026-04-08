import { fetchTrends, clusterNarratives } from "@/lib/scanner";
import { fetchFourMemeTokens } from "@/lib/fourmeme";
import { scoreGaps } from "@/lib/scoring";
import { generatePackage } from "@/lib/creative";
import { insertGap, insertPackage, updateGapStatus, checkDiskSpace } from "@/lib/db";
import type { PipelineEvent, NarrativeGap } from "@/types";

const MAX_GAPS_PER_CYCLE = 3;

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

export async function runCycle(): Promise<void> {
  if (isRunning) {
    console.log("Pipeline cycle already running, skipping");
    return;
  }

  isRunning = true;
  const twitterApiKey = process.env.TWITTER_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!twitterApiKey || !openaiApiKey) {
    console.error("Missing API keys: TWITTER_API_KEY and/or OPENAI_API_KEY");
    isRunning = false;
    return;
  }

  try {
    // Check disk space
    checkDiskSpace();

    emit({ type: "scan_cycle", data: { timestamp: new Date().toISOString() } });

    // 1. Fetch trending tweets
    console.log("[Pipeline] Fetching trends...");
    const tweets = await fetchTrends(twitterApiKey);
    if (tweets.length === 0) {
      console.log("[Pipeline] No tweets found this cycle");
      isRunning = false;
      return;
    }
    console.log(`[Pipeline] Got ${tweets.length} tweets`);

    // 2. Cluster into narratives
    const narratives = clusterNarratives(tweets);
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

    // 6. Generate packages for top gaps (max 3 per cycle)
    const gapsToProcess = gaps.slice(0, MAX_GAPS_PER_CYCLE);
    for (const gap of gapsToProcess) {
      try {
        updateGapStatus(gap.id, "generating");
        emit({
          type: "package_generating",
          data: { ...gap, status: "generating" } as NarrativeGap,
        });

        const pkg = await generatePackage(gap, openaiApiKey);
        insertPackage(pkg);

        emit({ type: "package_complete", data: pkg });
        console.log(
          `[Pipeline] Package generated for "${gap.narrative.theme}" in ${pkg.textReadyMs}ms`
        );
      } catch (err) {
        console.error(
          `[Pipeline] Failed to generate package for "${gap.narrative.theme}":`,
          err
        );
        updateGapStatus(gap.id, "failed");
      }
    }
  } catch (err) {
    console.error("[Pipeline] Cycle error:", err);
  } finally {
    isRunning = false;
  }
}

export function startPipeline(intervalMs = 60_000) {
  if (intervalId) {
    console.log("Pipeline already running");
    return;
  }

  console.log(
    `[Pipeline] Starting with ${intervalMs / 1000}s interval`
  );

  // Run first cycle immediately
  runCycle();

  // Then run on interval
  intervalId = setInterval(runCycle, intervalMs);
}

export function stopPipeline() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Pipeline] Stopped");
  }
}
