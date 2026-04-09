import type {
  NarrativeGap,
  LaunchPackage,
  NarrativeCluster,
  Tweet,
} from "@/types";

// ── Mock Tweets ──────────────────────────────────────────────

const mockTweets: Tweet[] = [
  {
    id: "tw-1",
    text: "BNB Chain is cooking something WILD with AI agents. The narrative is early af. Who's building the $BNBAI token? 👀🔥",
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    likeCount: 2847,
    retweetCount: 891,
    replyCount: 234,
    viewCount: 187000,
    hashtags: ["BNBAI", "BNBChain", "AI"],
    author: {
      userName: "CryptoKaleo",
      name: "Kaleo",
      followers: 542000,
      isVerified: true,
    },
  },
  {
    id: "tw-2",
    text: "Everyone sleeping on the restaking narrative on BNB. EigenLayer vibes but for BSC. Need a memecoin for this fr 💰",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    likeCount: 1563,
    retweetCount: 445,
    replyCount: 178,
    viewCount: 98000,
    hashtags: ["BNBRestaking", "DeFi"],
    author: {
      userName: "DegenSpartan",
      name: "Degen Spartan",
      followers: 312000,
      isVerified: false,
    },
  },
  {
    id: "tw-3",
    text: "CZ just dropped another alpha bomb. Man said 'think bigger about memes'. The BNB meme season is JUST starting 🚀",
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    likeCount: 5210,
    retweetCount: 2100,
    replyCount: 890,
    viewCount: 450000,
    hashtags: ["CZ", "BNBMemes", "FourMeme"],
    author: {
      userName: "AltcoinGordon",
      name: "Gordon",
      followers: 890000,
      isVerified: true,
    },
  },
  {
    id: "tw-4",
    text: "RWA memes are the next play. Real World Assets meet internet culture. $RWAPEPE when? 🐸",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    likeCount: 987,
    retweetCount: 234,
    replyCount: 56,
    viewCount: 45000,
    hashtags: ["RWA", "Memes"],
    author: {
      userName: "MoonOverlord",
      name: "Moon Overlord",
      followers: 178000,
      isVerified: false,
    },
  },
  {
    id: "tw-5",
    text: "Onchain gaming on BNB is about to have its moment. The infrastructure is ready, we just need the killer meme token to go with it 🎮",
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    likeCount: 1200,
    retweetCount: 356,
    replyCount: 145,
    viewCount: 67000,
    hashtags: ["BNBGaming", "GameFi"],
    author: {
      userName: "Hsaka",
      name: "Hsaka",
      followers: 650000,
      isVerified: true,
    },
  },
];

// ── Mock Narrative Clusters ──────────────────────────────────

const mockClusters: NarrativeCluster[] = [
  {
    id: "nc-1",
    theme: "BNB AI Agent Meta",
    keywords: ["AI agents", "BNB AI", "autonomous", "GPT onchain", "agent economy"],
    tweets: [mockTweets[0], mockTweets[2]],
    tweetCount: 847,
    avgEngagement: 12400,
    topTweet: mockTweets[0],
    detectedAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: "nc-2",
    theme: "BNB Restaking Wave",
    keywords: ["restaking", "liquid staking", "BNB yield", "EigenLayer BSC"],
    tweets: [mockTweets[1]],
    tweetCount: 312,
    avgEngagement: 5600,
    topTweet: mockTweets[1],
    detectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "nc-3",
    theme: "CZ Alpha Memes",
    keywords: ["CZ", "Binance alpha", "think bigger", "BNB season"],
    tweets: [mockTweets[2]],
    tweetCount: 2100,
    avgEngagement: 28900,
    topTweet: mockTweets[2],
    detectedAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: "nc-4",
    theme: "RWA Meme Fusion",
    keywords: ["RWA", "real world", "tokenization", "meme RWA", "RWAPEPE"],
    tweets: [mockTweets[3]],
    tweetCount: 156,
    avgEngagement: 3200,
    topTweet: mockTweets[3],
    detectedAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: "nc-5",
    theme: "BNB Gaming Renaissance",
    keywords: ["gaming", "GameFi", "onchain games", "BNB arcade"],
    tweets: [mockTweets[4]],
    tweetCount: 234,
    avgEngagement: 4800,
    topTweet: mockTweets[4],
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
    narrative: mockClusters[2],
    score: 0.88,
    matchScore: 0.12,
    detectedAt: new Date(Date.now() - 1 * 60000).toISOString(),
    status: "pending",
  },
  {
    id: "gap-3",
    narrative: mockClusters[1],
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
    tokenName: "AgentBNB",
    ticker: "$ABNB",
    tagline: "The autonomous economy starts on BNB Chain",
    description:
      "AgentBNB is the community token for the emerging AI agent ecosystem on BNB Chain. As autonomous agents become the dominant force in DeFi, $ABNB positions itself as the cultural token of the agent-powered future. Born from the narrative gap between massive AI agent discourse and zero representation in the BNB meme space.",
    talkingPoints: [
      "847 tweets detected about AI agents on BNB in the last hour",
      "Zero existing AI agent meme tokens on Four.meme",
      "CZ has been tweeting about AI x crypto convergence",
      "AI agent narrative has 10x'd in engagement this week",
      "First mover advantage in an untapped vertical",
    ],
    launchStrategy:
      "Launch with stealth mode on Four.meme. Seed initial liquidity at 0.5 BNB. Target CT influencers who are already talking about BNB AI agents. Use the agent narrative timing — post during peak US/Asia overlap hours. Create a Telegram with an AI bot moderator for meta-narrative appeal.",
    imageUrls: [
      "https://placehold.co/400x400/0a0e17/f0b90b?text=ABNB+LOGO",
      "https://placehold.co/800x400/0a0e17/f0b90b?text=ABNB+MEME",
    ],
    generatedAt: new Date(Date.now() - 2.5 * 60000).toISOString(),
    textReadyMs: 4200,
  },
  {
    id: "pkg-2",
    gapId: "gap-3",
    tokenName: "StakePepe",
    ticker: "$STPEPE",
    tagline: "Restake your memes, earn your culture",
    description:
      "StakePepe merges the restaking revolution with meme culture on BNB Chain. As liquid staking and restaking protocols emerge on BSC, $STPEPE becomes the community rallying point for yield-loving degens who also love memes. The intersection of DeFi infrastructure and internet culture.",
    talkingPoints: [
      "312 tweets about BNB restaking in the past 2 hours",
      "EigenLayer comparisons driving BNB DeFi narrative",
      "No meme token capturing the restaking hype on BNB",
      "Liquid staking TVL on BNB up 340% in 30 days",
      "Perfect timing as restaking narrative hits mainnet",
    ],
    launchStrategy:
      "Time launch with upcoming BNB Chain restaking announcements. Cross-post in DeFi communities. Create staking-themed meme templates. Partner with BNB DeFi protocols for co-marketing. Target the overlap between DeFi power users and meme traders.",
    imageUrls: [
      "https://placehold.co/400x400/0a0e17/22c55e?text=STPEPE+LOGO",
      "https://placehold.co/800x400/0a0e17/22c55e?text=STPEPE+MEME",
    ],
    generatedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    textReadyMs: 3800,
  },
];
