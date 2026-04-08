export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
  hashtags: string[];
  author: {
    userName: string;
    name: string;
    followers: number;
    isVerified: boolean;
  };
}

export interface NarrativeCluster {
  id: string;
  theme: string;
  keywords: string[];
  tweets: Tweet[];
  tweetCount: number;
  avgEngagement: number;
  topTweet: Tweet;
  detectedAt: string;
}

export interface FourMemeToken {
  address: string;
  name: string;
  ticker: string;
  launchedAt: string;
  marketCap?: number;
  holderCount?: number;
  bondingCurveProgress?: number;
}

export interface NarrativeGap {
  id: string;
  narrative: NarrativeCluster;
  score: number;
  matchScore: number; // 0 = no existing token, 1 = exact match
  closestToken?: FourMemeToken;
  detectedAt: string;
  status: "pending" | "generating" | "complete" | "failed";
}

export interface LaunchPackage {
  id: string;
  gapId: string;
  tokenName: string;
  ticker: string;
  tagline: string;
  description: string;
  talkingPoints: string[];
  launchStrategy: string;
  imageUrls: string[];
  generatedAt: string;
  textReadyMs: number; // time to generate text package
}

export interface PipelineEvent {
  type: "gap_detected" | "package_generating" | "package_complete" | "scan_cycle";
  data: NarrativeGap | LaunchPackage | { timestamp: string };
}
