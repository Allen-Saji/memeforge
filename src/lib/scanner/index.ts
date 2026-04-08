import type { Tweet, NarrativeCluster } from "@/types";
import crypto from "crypto";

const TWITTERAPI_BASE = "https://api.twitterapi.io/twitter/tweet/advanced_search";

const DEFAULT_QUERIES = [
  '"meme coin" BNB min_faves:5 min_retweets:2 lang:en',
  '"four meme" OR "four.meme" min_faves:3 lang:en',
  '#BNBmeme OR #bnbchain meme min_faves:5 lang:en',
];

interface TwitterApiResponse {
  tweets: Array<{
    id: string;
    text: string;
    createdAt: string;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    viewCount: number;
    entities?: {
      hashtags?: Array<{ text: string }>;
    };
    author: {
      userName: string;
      name: string;
      followers: number;
      isVerified: boolean;
    };
  }>;
  has_next_page: boolean;
  next_cursor: string;
}

export async function fetchTrends(
  apiKey: string,
  queries: string[] = DEFAULT_QUERIES,
  maxPerQuery = 20
): Promise<Tweet[]> {
  const allTweets: Tweet[] = [];

  for (const query of queries) {
    try {
      const url = new URL(TWITTERAPI_BASE);
      url.searchParams.set("query", query);
      url.searchParams.set("queryType", "Latest");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        console.error(`Twitter API error for query "${query}": ${res.status}`);
        continue;
      }

      const data: TwitterApiResponse = await res.json();
      const tweets = (data.tweets || []).slice(0, maxPerQuery).map(
        (t): Tweet => ({
          id: t.id,
          text: t.text,
          createdAt: t.createdAt,
          likeCount: t.likeCount || 0,
          retweetCount: t.retweetCount || 0,
          replyCount: t.replyCount || 0,
          viewCount: t.viewCount || 0,
          hashtags: t.entities?.hashtags?.map((h) => h.text) || [],
          author: {
            userName: t.author.userName,
            name: t.author.name,
            followers: t.author.followers || 0,
            isVerified: t.author.isVerified || false,
          },
        })
      );
      allTweets.push(...tweets);
    } catch (err) {
      console.error(`Failed to fetch tweets for query "${query}":`, err);
    }
  }

  // Deduplicate by tweet ID
  const seen = new Set<string>();
  return allTweets.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

export function clusterNarratives(tweets: Tweet[]): NarrativeCluster[] {
  // Simple keyword-based clustering
  // Group tweets by their most prominent hashtag or keyword pattern
  const clusters = new Map<string, Tweet[]>();

  for (const tweet of tweets) {
    const theme = extractTheme(tweet);
    if (!clusters.has(theme)) {
      clusters.set(theme, []);
    }
    clusters.get(theme)!.push(tweet);
  }

  return Array.from(clusters.entries())
    .filter(([, tweets]) => tweets.length >= 2) // need at least 2 tweets to form a cluster
    .map(([theme, clusterTweets]): NarrativeCluster => {
      const avgEngagement =
        clusterTweets.reduce(
          (sum, t) => sum + t.likeCount + t.retweetCount * 2,
          0
        ) / clusterTweets.length;

      const topTweet = clusterTweets.reduce((best, t) =>
        t.likeCount + t.retweetCount * 2 > best.likeCount + best.retweetCount * 2
          ? t
          : best
      );

      const keywords = extractKeywords(clusterTweets);

      return {
        id: crypto.randomUUID(),
        theme,
        keywords,
        tweets: clusterTweets,
        tweetCount: clusterTweets.length,
        avgEngagement,
        topTweet,
        detectedAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

function extractTheme(tweet: Tweet): string {
  // Use the most popular hashtag, or extract key noun phrases
  if (tweet.hashtags.length > 0) {
    return tweet.hashtags[0].toLowerCase();
  }

  // Fallback: extract the most distinctive 2-3 word phrase
  const text = tweet.text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();

  const words = text.split(/\s+/).filter((w) => w.length > 3);
  return words.slice(0, 3).join(" ") || "uncategorized";
}

function extractKeywords(tweets: Tweet[]): string[] {
  const wordFreq = new Map<string, number>();
  const stopWords = new Set([
    "the", "this", "that", "with", "from", "have", "been",
    "will", "would", "could", "should", "just", "like", "what",
    "when", "where", "which", "their", "there", "about", "more",
    "some", "into", "also", "than", "then", "very", "your",
  ]);

  for (const tweet of tweets) {
    const words = tweet.text
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
