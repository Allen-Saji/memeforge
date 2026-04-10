export type SignalSource =
  | "reddit"
  | "google_trends"
  | "dexscreener"
  | "coingecko"
  | "twitter";

export interface TrendSignal {
  id: string;
  source: SignalSource;
  title: string; // post title, trend query, token name, tweet text
  url?: string;
  engagement: number; // normalized score: upvotes, search volume, market cap, likes
  detectedAt: string;
  metadata: Record<string, unknown>; // source-specific data
}

export interface NarrativeCluster {
  id: string;
  theme: string;
  keywords: string[];
  signals: TrendSignal[];
  signalCount: number;
  sources: SignalSource[]; // which sources contributed
  avgEngagement: number;
  topSignal: TrendSignal;
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

export interface ConceptOption {
  tokenName: string;
  ticker: string;
  tagline: string;
  imageDirection: string;
  vibe: string;
}

// ── Launch on Four.meme types ────────────────────────────

export type TokenLabel =
  | "Meme" | "AI" | "Defi" | "Games" | "Infra"
  | "De-Sci" | "Social" | "Depin" | "Charity" | "Others";

export interface TokenTaxInfo {
  feeRate: 1 | 3 | 5 | 10;
  burnRate: number;      // % of fee burned
  divideRate: number;    // % distributed as dividends
  liquidityRate: number; // % added to LP
  recipientRate: number; // % sent to recipientAddress
  recipientAddress: string;
  minSharing: number;    // min tokens for dividend eligibility
}

export interface LaunchConfig {
  label: TokenLabel;
  preSale: string;           // BNB amount (e.g. "0.1")
  feePlan: boolean;          // anti-snipe mode
  taxEnabled: boolean;
  tokenTaxInfo?: TokenTaxInfo;
  webUrl: string;
  twitterUrl: string;
  telegramUrl: string;
}

export interface LaunchPrepareResult {
  createArg: string;   // hex bytes from Four.meme API
  signature: string;   // hex bytes from Four.meme API
  creationFee: string; // wei amount for msg.value
}

export interface LaunchResult {
  tokenAddress: string;
  txHash: string;
  explorerUrl: string;
  fourMemeUrl: string;
}

export interface PipelineEvent {
  type: "gap_detected" | "package_generating" | "package_complete" | "scan_cycle";
  data: NarrativeGap | LaunchPackage | { timestamp: string; sourcesSummary?: Record<SignalSource, number> };
}
