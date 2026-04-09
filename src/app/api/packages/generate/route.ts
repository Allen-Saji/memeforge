import { NextResponse } from "next/server";
import { getDb, insertPackage, updateGapStatus } from "@/lib/db";
import { generatePackage } from "@/lib/creative";
import { subscribe } from "@/lib/pipeline";
import type { NarrativeGap, NarrativeCluster, FourMemeToken } from "@/types";

// POST /api/packages/generate
// Body: { gapId: string, conceptIndex?: number }
// Triggers on-demand package generation for a specific gap
export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { gapId } = body as { gapId: string };

  if (!gapId) {
    return NextResponse.json({ error: "gapId required" }, { status: 400 });
  }

  // Load gap from DB
  const db = getDb();
  const row = db
    .prepare(
      `SELECT g.*, n.id as narrative_id, n.theme, n.keywords, n.tweet_count,
              n.avg_engagement, n.top_tweet, n.detected_at as narrative_detected_at,
              t.address as token_address, t.name as token_name, t.ticker as token_ticker,
              t.market_cap, t.holder_count, t.bonding_curve_progress
       FROM gaps g
       JOIN narratives n ON g.narrative_id = n.id
       LEFT JOIN four_meme_tokens t ON g.closest_token_address = t.address
       WHERE g.id = ?`
    )
    .get(gapId) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: "Gap not found" }, { status: 404 });
  }

  // Check if package already exists
  const existing = db
    .prepare("SELECT id FROM packages WHERE gap_id = ?")
    .get(gapId) as { id: string } | undefined;

  if (existing) {
    return NextResponse.json(
      { error: "Package already generated", packageId: existing.id },
      { status: 409 }
    );
  }

  // Reconstruct gap object
  const gap: NarrativeGap = {
    id: row.id as string,
    score: row.score as number,
    matchScore: row.match_score as number,
    detectedAt: row.detected_at as string,
    status: "generating",
    narrative: {
      id: row.narrative_id as string,
      theme: row.theme as string,
      keywords: JSON.parse(row.keywords as string),
      tweets: [],
      tweetCount: row.tweet_count as number,
      avgEngagement: row.avg_engagement as number,
      topTweet: JSON.parse(row.top_tweet as string),
      detectedAt: row.narrative_detected_at as string,
    } as NarrativeCluster,
    closestToken: row.token_address
      ? ({
          address: row.token_address as string,
          name: row.token_name as string,
          ticker: row.token_ticker as string,
          launchedAt: "",
          marketCap: row.market_cap as number | undefined,
          holderCount: row.holder_count as number | undefined,
          bondingCurveProgress: row.bonding_curve_progress as number | undefined,
        } as FourMemeToken)
      : undefined,
  };

  // Update status
  updateGapStatus(gapId, "generating");

  // Emit SSE event
  const emit = (type: string, data: unknown) => {
    subscribe((event) => {})(); // no-op, just to access the pattern
  };

  try {
    const pkg = await generatePackage(gap, openaiKey);
    insertPackage(pkg);
    updateGapStatus(gapId, "complete");

    return NextResponse.json(pkg);
  } catch (err) {
    updateGapStatus(gapId, "failed");
    console.error(`[Generate] Failed for gap ${gapId}:`, err);
    return NextResponse.json(
      { error: "Generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
