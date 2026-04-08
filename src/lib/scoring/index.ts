import Fuse from "fuse.js";
import type { NarrativeCluster, FourMemeToken, NarrativeGap } from "@/types";
import crypto from "crypto";

const GAP_THRESHOLD = 0.4; // minimum score to surface a gap

export function scoreGaps(
  narratives: NarrativeCluster[],
  existingTokens: FourMemeToken[]
): NarrativeGap[] {
  const fuse = new Fuse(existingTokens, {
    keys: ["name", "ticker"],
    threshold: 0.4, // fuzzy match sensitivity
    includeScore: true,
  });

  const gaps: NarrativeGap[] = [];

  for (const narrative of narratives) {
    // Check if a token already exists for this narrative
    const searchTerms = [narrative.theme, ...narrative.keywords.slice(0, 3)];
    let bestMatchScore = 0;
    let closestToken: FourMemeToken | undefined;

    for (const term of searchTerms) {
      const results = fuse.search(term);
      if (results.length > 0 && results[0].score !== undefined) {
        const matchScore = 1 - results[0].score; // fuse score is 0=perfect, 1=no match
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          closestToken = results[0].item;
        }
      }
    }

    // Calculate gap score
    // Higher = more opportunity (trending + no existing token)
    const trendStrength = calculateTrendStrength(narrative);
    const recencyBoost = calculateRecencyBoost(narrative);
    const noTokenMultiplier = bestMatchScore > 0.7 ? 0.1 : 1 - bestMatchScore;

    const score = trendStrength * recencyBoost * noTokenMultiplier;

    if (score >= GAP_THRESHOLD) {
      gaps.push({
        id: crypto.randomUUID(),
        narrative,
        score: Math.round(score * 100) / 100,
        matchScore: Math.round(bestMatchScore * 100) / 100,
        closestToken: bestMatchScore > 0.3 ? closestToken : undefined,
        detectedAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  return gaps.sort((a, b) => b.score - a.score).slice(0, 10); // top 10 gaps
}

function calculateTrendStrength(narrative: NarrativeCluster): number {
  // Normalize tweet count and engagement
  // A cluster with 10+ tweets and high engagement is strong
  const countScore = Math.min(narrative.tweetCount / 20, 1); // cap at 20 tweets
  const engagementScore = Math.min(narrative.avgEngagement / 500, 1); // cap at 500 avg engagement
  return countScore * 0.4 + engagementScore * 0.6;
}

function calculateRecencyBoost(narrative: NarrativeCluster): number {
  const detectedAt = new Date(narrative.detectedAt).getTime();
  const now = Date.now();
  const minutesAgo = (now - detectedAt) / (1000 * 60);

  // Full boost for last 30 min, linear decay to 0.3 over 2 hours
  if (minutesAgo <= 30) return 1;
  if (minutesAgo >= 120) return 0.3;
  return 1 - (minutesAgo - 30) * (0.7 / 90);
}
