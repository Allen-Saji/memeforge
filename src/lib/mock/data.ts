import type {
  NarrativeGap,
  LaunchPackage,
  NarrativeCluster,
  TrendSignal,
} from "@/types";

// ── Mock Signals ──────────────────────────────────────────────

const mockSignals: TrendSignal[] = [
  {
    id: "reddit_abc1",
    source: "reddit",
    title: "This AI generated image of a dog in a spacesuit is going viral and I can't stop laughing",
    url: "https://reddit.com/r/memes/comments/abc1",
    engagement: 48200,
    detectedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    metadata: { subreddit: "memes", numComments: 2340 },
  },
  {
    id: "gtrends_xyz2",
    source: "google_trends",
    title: "Space Dog Meme",
    engagement: 200000,
    detectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    metadata: { approxTraffic: "200,000+" },
  },
  {
    id: "dex_sol_abc3",
    source: "dexscreener",
    title: "SPACEDOG — the original space-themed doge on Solana, 500% in 24h",
    url: "https://dexscreener.com/solana/abc3",
    engagement: 5000,
    detectedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    metadata: { chainId: "solana", tokenAddress: "abc3..." },
  },
  {
    id: "cg_pepe2",
    source: "coingecko",
    title: "Pepe 2.0",
    url: "https://coingecko.com/en/coins/pepe-2",
    engagement: 900,
    detectedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    metadata: { symbol: "PEPE2", marketCapRank: 150 },
  },
  {
    id: "tw_viral5",
    source: "twitter",
    title: "just saw someone pay for their lambo entirely in meme coins. we really live in the future 😂",
    url: "https://x.com/someuser/status/12345",
    engagement: 15400,
    detectedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    metadata: { author: "CryptoKaleo", likes: 12000, retweets: 3400 },
  },
  {
    id: "reddit_rwa6",
    source: "reddit",
    title: "RWA tokenization is boring but what if we made it a meme? $RWAPEPE anyone?",
    url: "https://reddit.com/r/CryptoCurrency/comments/rwa6",
    engagement: 3400,
    detectedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    metadata: { subreddit: "CryptoCurrency", numComments: 178 },
  },
  {
    id: "reddit_gaming7",
    source: "reddit",
    title: "Onchain gaming is having a renaissance and nobody is paying attention",
    url: "https://reddit.com/r/CryptoCurrency/comments/gaming7",
    engagement: 5600,
    detectedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    metadata: { subreddit: "CryptoCurrency", numComments: 245 },
  },
];

// ── Mock Narrative Clusters ──────────────────────────────────

const mockClusters: NarrativeCluster[] = [
  {
    id: "nc-1",
    theme: "Space Dog Meme",
    keywords: ["space", "dog", "AI", "viral", "spacesuit", "doge"],
    signals: [mockSignals[0], mockSignals[1], mockSignals[2]],
    signalCount: 3,
    sources: ["reddit", "google_trends", "dexscreener"],
    avgEngagement: 84400,
    topSignal: mockSignals[1],
    detectedAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: "nc-2",
    theme: "Lambo Meme Coins",
    keywords: ["lambo", "meme coins", "future", "payment", "crypto"],
    signals: [mockSignals[4]],
    signalCount: 1,
    sources: ["twitter"],
    avgEngagement: 15400,
    topSignal: mockSignals[4],
    detectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "nc-3",
    theme: "Pepe 2.0 Resurgence",
    keywords: ["pepe", "pepe2", "frog", "meme", "resurgence"],
    signals: [mockSignals[3]],
    signalCount: 1,
    sources: ["coingecko"],
    avgEngagement: 900,
    topSignal: mockSignals[3],
    detectedAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: "nc-4",
    theme: "RWA Meme Fusion",
    keywords: ["RWA", "real world", "tokenization", "meme RWA", "RWAPEPE"],
    signals: [mockSignals[5]],
    signalCount: 1,
    sources: ["reddit"],
    avgEngagement: 3400,
    topSignal: mockSignals[5],
    detectedAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: "nc-5",
    theme: "Onchain Gaming Renaissance",
    keywords: ["gaming", "GameFi", "onchain games", "renaissance"],
    signals: [mockSignals[6]],
    signalCount: 1,
    sources: ["reddit"],
    avgEngagement: 5600,
    topSignal: mockSignals[6],
    detectedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

// ── Mock Narrative Gaps ──────────────────────────────────────

export const mockGaps: NarrativeGap[] = [
  {
    id: "gap-1",
    narrative: mockClusters[0],
    score: 0.92,
    matchScore: 0.08,
    detectedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    status: "pending",
  },
  {
    id: "gap-2",
    narrative: mockClusters[1],
    score: 0.88,
    matchScore: 0.12,
    detectedAt: new Date(Date.now() - 1 * 60000).toISOString(),
    status: "pending",
  },
  {
    id: "gap-3",
    narrative: mockClusters[2],
    score: 0.74,
    matchScore: 0.15,
    detectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "pending",
  },
  {
    id: "gap-4",
    narrative: mockClusters[4],
    score: 0.67,
    matchScore: 0.22,
    closestToken: {
      address: "0x1234...abcd",
      name: "GameBNB",
      ticker: "GBNB",
      launchedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      marketCap: 45000,
      holderCount: 234,
      bondingCurveProgress: 0.12,
    },
    detectedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    status: "pending",
  },
  {
    id: "gap-5",
    narrative: mockClusters[3],
    score: 0.55,
    matchScore: 0.31,
    closestToken: {
      address: "0x5678...efgh",
      name: "RealPepe",
      ticker: "RPEPE",
      launchedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      marketCap: 12000,
      holderCount: 89,
      bondingCurveProgress: 0.05,
    },
    detectedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    status: "failed",
  },
];

// ── Mock Launch Packages ─────────────────────────────────────

export const mockPackages: LaunchPackage[] = [
  {
    id: "pkg-1",
    gapId: "gap-1",
    tokenName: "SpaceDogBNB",
    ticker: "$SDOG",
    tagline: "One small step for dog, one giant leap for BNB",
    description:
      "SpaceDogBNB captures the viral space dog meme trending across Reddit, Google, and Dexscreener. Already pumping on Solana with no BNB equivalent. First mover advantage on Four.meme.",
    talkingPoints: [
      "Trending on Reddit with 48K upvotes",
      "200K+ Google search volume",
      "Already 500% on Solana — zero BNB representation",
      "Multi-source signal: Reddit + Google Trends + Dexscreener",
      "First mover advantage on Four.meme",
    ],
    launchStrategy:
      "Launch on Four.meme immediately. Cross-post the Reddit meme. Target CT accounts already sharing the space dog image. BNB Chain has zero representation of this narrative — pure gap play.",
    imageUrls: [
      "https://placehold.co/400x400/0a0e17/f0b90b?text=SDOG+LOGO",
      "https://placehold.co/800x400/0a0e17/f0b90b?text=SDOG+MEME",
    ],
    generatedAt: new Date(Date.now() - 2.5 * 60000).toISOString(),
    textReadyMs: 4200,
  },
];
