import { bsc } from "@reown/appkit/networks";

export const REOWN_PROJECT_ID =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

export const APP_METADATA = {
  name: "MemeForge",
  description: "AI Narrative Arbitrage Agent for Four.meme",
  url: "https://memeforge.app",
  icons: ["/favicon.ico"],
};

export const NETWORKS = [bsc];
