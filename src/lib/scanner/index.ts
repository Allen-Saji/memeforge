import type { TrendSignal, SignalSource, NarrativeCluster } from "@/types";
import crypto from "crypto";

// ── Source 1: Reddit ──────────────────────────────────────────────
const SUBREDDITS = ["memes", "dankmemes", "wallstreetbets", "CryptoCurrency"];
const REDDIT_MIN_SCORE = 1000;

async function fetchReddit(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
        { headers: { "User-Agent": "MemeForge/0.1" } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const posts = data?.data?.children || [];

      for (const post of posts) {
        const d = post.data;
        if (d.stickied || d.score < REDDIT_MIN_SCORE) continue;

        signals.push({
          id: `reddit_${d.id}`,
          source: "reddit",
          title: d.title,
          url: `https://reddit.com${d.permalink}`,
          engagement: d.score,
          detectedAt: new Date(d.created_utc * 1000).toISOString(),
          metadata: {
            subreddit: sub,
            numComments: d.num_comments,
            thumbnail: d.thumbnail,
            isVideo: d.is_video,
          },
        });
      }
    } catch (err) {
      console.error(`[Scanner] Reddit r/${sub} failed:`, err);
    }
  }

  return signals;
}

// ── Source 2: Google Trends RSS ────────────────────────────────────
async function fetchGoogleTrends(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  try {
    const res = await fetch(
      "https://trends.google.com/trending/rss?geo=US"
    );
    if (!res.ok) return signals;

    const xml = await res.text();

    // Parse RSS items — extract <title> and <ht:approx_traffic>
    const items = xml.split("<item>").slice(1);
    for (const item of items) {
      const title = item.match(/<title>([^<]+)<\/title>/)?.[1] || "";
      const traffic = item.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/)?.[1] || "0";
      const link = item.match(/<link>([^<]+)<\/link>/)?.[1];
      const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];

      // Parse traffic like "200,000+" → 200000
      const trafficNum = parseInt(traffic.replace(/[^0-9]/g, "")) || 0;

      if (title) {
        signals.push({
          id: `gtrends_${crypto.randomUUID().slice(0, 8)}`,
          source: "google_trends",
          title: title.trim(),
          url: link,
          engagement: trafficNum,
          detectedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          metadata: { approxTraffic: traffic },
        });
      }
    }
  } catch (err) {
    console.error("[Scanner] Google Trends failed:", err);
  }

  return signals;
}

// ── Source 3: Dexscreener (cross-chain token trends) ──────────────
async function fetchDexscreener(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  try {
    // Token boosts — trending tokens across all chains
    const res = await fetch("https://api.dexscreener.com/token-boosts/top/v1");
    if (!res.ok) return signals;

    const tokens: Array<{
      tokenAddress: string;
      chainId: string;
      description?: string;
      icon?: string;
      url?: string;
      amount?: number;
    }> = await res.json();

    // Filter OUT bsc tokens — we want cross-chain trends that DON'T exist on BNB yet
    const nonBsc = tokens.filter((t) => t.chainId !== "bsc");

    for (const token of nonBsc.slice(0, 30)) {
      signals.push({
        id: `dex_${token.chainId}_${token.tokenAddress.slice(0, 8)}`,
        source: "dexscreener",
        title: token.description || token.tokenAddress,
        url: `https://dexscreener.com/${token.chainId}/${token.tokenAddress}`,
        engagement: token.amount || 0,
        detectedAt: new Date().toISOString(),
        metadata: {
          chainId: token.chainId,
          tokenAddress: token.tokenAddress,
          icon: token.icon,
        },
      });
    }

    // Also fetch latest token profiles for names
    const profileRes = await fetch("https://api.dexscreener.com/token-profiles/latest/v1");
    if (profileRes.ok) {
      const profiles: Array<{
        tokenAddress: string;
        chainId: string;
        description?: string;
        icon?: string;
        url?: string;
      }> = await profileRes.json();

      const nonBscProfiles = profiles.filter(
        (p) => p.chainId !== "bsc" && !signals.some((s) => s.id.includes(p.tokenAddress.slice(0, 8)))
      );

      for (const p of nonBscProfiles.slice(0, 20)) {
        signals.push({
          id: `dex_${p.chainId}_${p.tokenAddress.slice(0, 8)}`,
          source: "dexscreener",
          title: p.description || p.tokenAddress,
          url: `https://dexscreener.com/${p.chainId}/${p.tokenAddress}`,
          engagement: 0,
          detectedAt: new Date().toISOString(),
          metadata: {
            chainId: p.chainId,
            tokenAddress: p.tokenAddress,
            icon: p.icon,
          },
        });
      }
    }
  } catch (err) {
    console.error("[Scanner] Dexscreener failed:", err);
  }

  return signals;
}

// ── Source 4: CoinGecko Trending ──────────────────────────────────
async function fetchCoinGecko(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return signals;

    const data = await res.json();
    const coins = data?.coins || [];

    for (const entry of coins) {
      const coin = entry.item;
      signals.push({
        id: `cg_${coin.id}`,
        source: "coingecko",
        title: coin.name,
        url: `https://coingecko.com/en/coins/${coin.id}`,
        engagement: coin.score != null ? 1000 - coin.score * 100 : 0, // lower rank = higher engagement
        detectedAt: new Date().toISOString(),
        metadata: {
          symbol: coin.symbol,
          marketCapRank: coin.market_cap_rank,
          thumb: coin.thumb,
        },
      });
    }
  } catch (err) {
    console.error("[Scanner] CoinGecko failed:", err);
  }

  return signals;
}

// ── Source 5: TwitterAPI.io (broad viral tweets) ──────────────────
const TWITTER_QUERIES = [
  "min_faves:5000 -filter:replies lang:en", // viral tweets in general
  "meme viral min_faves:2000 lang:en",
];

async function fetchTwitter(apiKey: string): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  for (const query of TWITTER_QUERIES) {
    try {
      const url = new URL("https://api.twitterapi.io/twitter/tweet/advanced_search");
      url.searchParams.set("query", query);
      url.searchParams.set("queryType", "Latest");

      const res = await fetch(url.toString(), {
        headers: { "x-api-key": apiKey },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const tweets = (data.tweets || []).slice(0, 10); // conservative to save credits

      for (const t of tweets) {
        signals.push({
          id: `tw_${t.id}`,
          source: "twitter",
          title: t.text,
          url: `https://x.com/${t.author?.userName}/status/${t.id}`,
          engagement: (t.likeCount || 0) + (t.retweetCount || 0) * 2,
          detectedAt: t.createdAt || new Date().toISOString(),
          metadata: {
            author: t.author?.userName,
            likes: t.likeCount,
            retweets: t.retweetCount,
            views: t.viewCount,
            hashtags: t.entities?.hashtags?.map((h: { text: string }) => h.text) || [],
          },
        });
      }
    } catch (err) {
      console.error(`[Scanner] Twitter query failed:`, err);
    }
  }

  return signals;
}

// ── Aggregator ────────────────────────────────────────────────────
export interface ScanResult {
  signals: TrendSignal[];
  sourcesSummary: Record<SignalSource, number>;
}

export async function fetchAllTrends(twitterApiKey?: string): Promise<ScanResult> {
  // Fire all free sources in parallel. Twitter only if key is available.
  const promises: Promise<TrendSignal[]>[] = [
    fetchReddit(),
    fetchGoogleTrends(),
    fetchDexscreener(),
    fetchCoinGecko(),
  ];

  if (twitterApiKey) {
    promises.push(fetchTwitter(twitterApiKey));
  }

  const results = await Promise.allSettled(promises);
  const allSignals: TrendSignal[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allSignals.push(...result.value);
    }
  }

  // Deduplicate by ID
  const seen = new Set<string>();
  const deduped = allSignals.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  // Summary
  const sourcesSummary: Record<SignalSource, number> = {
    reddit: 0,
    google_trends: 0,
    dexscreener: 0,
    coingecko: 0,
    twitter: 0,
  };
  for (const s of deduped) {
    sourcesSummary[s.source]++;
  }

  console.log(
    `[Scanner] Aggregated ${deduped.length} signals:`,
    Object.entries(sourcesSummary)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")
  );

  return { signals: deduped, sourcesSummary };
}

// ── Clustering ────────────────────────────────────────────────────
export function clusterNarratives(signals: TrendSignal[]): NarrativeCluster[] {
  const clusters = new Map<string, TrendSignal[]>();

  for (const signal of signals) {
    const theme = extractTheme(signal);
    if (!clusters.has(theme)) {
      clusters.set(theme, []);
    }
    clusters.get(theme)!.push(signal);
  }

  return Array.from(clusters.entries())
    .filter(([, sigs]) => sigs.length >= 1) // even 1 strong signal from a non-twitter source is valid
    .map(([theme, clusterSignals]): NarrativeCluster => {
      const avgEngagement =
        clusterSignals.reduce((sum, s) => sum + s.engagement, 0) / clusterSignals.length;

      const topSignal = clusterSignals.reduce((best, s) =>
        s.engagement > best.engagement ? s : best
      );

      const sources = [...new Set(clusterSignals.map((s) => s.source))];
      const keywords = extractKeywords(clusterSignals);

      return {
        id: crypto.randomUUID(),
        theme,
        keywords,
        signals: clusterSignals,
        signalCount: clusterSignals.length,
        sources,
        avgEngagement,
        topSignal,
        detectedAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => {
      // Boost multi-source clusters (same narrative trending across platforms = strong signal)
      const sourceBoostA = a.sources.length > 1 ? 1.5 : 1;
      const sourceBoostB = b.sources.length > 1 ? 1.5 : 1;
      return b.avgEngagement * sourceBoostB - a.avgEngagement * sourceBoostA;
    });
}

function extractTheme(signal: TrendSignal): string {
  const text = signal.title
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();

  // For short titles (Google Trends, CoinGecko), use the whole thing
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  if (words.length <= 3) return text;

  // For longer text (Reddit posts, tweets), take the first 3-4 significant words
  const stopWords = new Set([
    "the", "this", "that", "with", "from", "have", "been", "will", "would",
    "could", "should", "just", "like", "what", "when", "where", "which",
    "their", "there", "about", "more", "some", "into", "also", "than",
    "then", "very", "your", "has", "are", "was", "were", "for", "and",
    "but", "not", "you", "all", "can", "her", "his", "how", "its",
    "may", "new", "now", "old", "see", "way", "who", "did", "get",
    "got", "had", "him", "let", "say", "she", "too", "use",
  ]);

  const significant = words.filter((w) => !stopWords.has(w));
  return significant.slice(0, 3).join(" ") || words.slice(0, 3).join(" ") || "uncategorized";
}

function extractKeywords(signals: TrendSignal[]): string[] {
  const wordFreq = new Map<string, number>();
  const stopWords = new Set([
    "the", "this", "that", "with", "from", "have", "been", "will", "would",
    "could", "should", "just", "like", "what", "when", "where", "which",
    "their", "there", "about", "more", "some", "into", "also", "than",
    "then", "very", "your",
  ]);

  for (const signal of signals) {
    const words = signal.title
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, "")
      .replace(/@\w+/g, "")
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
