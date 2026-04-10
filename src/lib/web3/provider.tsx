"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { bsc } from "@reown/appkit/networks";
import { REOWN_PROJECT_ID, APP_METADATA } from "./config";

// Initialize AppKit once
if (REOWN_PROJECT_ID) {
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [bsc],
    projectId: REOWN_PROJECT_ID,
    metadata: APP_METADATA,
    themeMode: "dark",
    features: {
      analytics: false,
    },
  });
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
