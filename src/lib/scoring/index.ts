import Fuse from "fuse.js";
import type { NarrativeCluster, FourMemeToken, NarrativeGap } from "@/types";
import crypto from "crypto";

const GAP_THRESHOLD = 0.3; // lowered — multi-source signals are more reliable

export function scoreGaps(
  narratives: NarrativeCluster[],
  existingTokens: FourMemeToken[]
): NarrativeGap[] {
  const fuse = new Fuse(existingTokens, {
    keys: ["name", "ticker"],
    threshold: 0.4,
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
        const matchScore = 1 - results[0].score;
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          closestToken = results[0].item;
        }
      }
    }

    const trendStrength = calculateTrendStrength(narrative);
    const recencyBoost = calculateRecencyBoost(narrative);
    const sourceBoost = narrative.sources.length > 1 ? 1.3 : 1; // multi-source = stronger signal
    const noTokenMultiplier = bestMatchScore > 0.7 ? 0.1 : 1 - bestMatchScore;

    const score = trendStrength * recencyBoost * sourceBoost * noTokenMultiplier;

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

  return gaps.sort((a, b) => b.score - a.score).slice(0, 10);
}

function calculateTrendStrength(narrative: NarrativeCluster): number {
  const countScore = Math.min(narrative.signalCount / 10, 1);
  const engagementScore = Math.min(narrative.avgEngagement / 5000, 1);
  return countScore * 0.3 + engagementScore * 0.7;
}

function calculateRecencyBoost(narrative: NarrativeCluster): number {
  const detectedAt = new Date(narrative.detectedAt).getTime();
  const now = Date.now();
  const minutesAgo = (now - detectedAt) / (1000 * 60);

  if (minutesAgo <= 30) return 1;
  if (minutesAgo >= 120) return 0.3;
  return 1 - (minutesAgo - 30) * (0.7 / 90);
}
