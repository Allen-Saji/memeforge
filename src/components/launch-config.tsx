"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Copy,
} from "lucide-react";
import { ethers } from "ethers";
import {
  useAppKitProvider,
  useAppKitAccount,
} from "@reown/appkit/react";
import { TOKEN_MANAGER_ADDRESS, TOKEN_MANAGER_ABI } from "@/lib/fourmeme/abi";
import type {
  LaunchPackage,
  LaunchConfig,
  LaunchResult,
  TokenLabel,
} from "@/types";

type LaunchState = "idle" | "config" | "signing" | "preparing" | "deploying" | "success" | "error";

const LABELS: TokenLabel[] = [
  "Meme", "AI", "Defi", "Games", "Infra",
  "De-Sci", "Social", "Depin", "Charity", "Others",
];

const DEFAULT_CONFIG: LaunchConfig = {
  label: "Meme",
  preSale: "0",
  feePlan: false,
  taxEnabled: false,
  webUrl: "",
  twitterUrl: "",
  telegramUrl: "",
};

interface LaunchButtonProps {
  pkg: LaunchPackage;
}

export function LaunchButton({ pkg }: LaunchButtonProps) {
  const [state, setState] = useState<LaunchState>("idle");
  const [config, setConfig] = useState<LaunchConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<{ step: string; message: string } | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [copied, setCopied] = useState(false);

  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const handleLaunch = () => {
    setState("config");
    setError(null);
  };

  const handleDeploy = async () => {
    if (!isConnected || !address || !walletProvider) {
      setError({ step: "wallet", message: "Please connect your wallet first" });
      setState("error");
      return;
    }

    try {
      // Step 1: Get nonce from Four.meme
      setState("signing");
      const nonceRes = await fetch(`/api/packages/${pkg.id}/launch`);
      const { nonce, message } = await nonceRes.json();

      if (!nonce) {
        throw { step: "auth", message: "Failed to get nonce from Four.meme" };
      }

      // Step 2: Sign nonce with user's wallet
      const provider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const signedNonce = await signer.signMessage(message);

      // Steps 3-4: Server-side (auth, upload, create token record)
      setState("preparing");
      const prepRes = await fetch(`/api/packages/${pkg.id}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          signedNonce,
          nonce,
          config,
        }),
      });

      const prepData = await prepRes.json();
      if (!prepRes.ok) {
        throw { step: prepData.step || "prepare", message: prepData.error };
      }

      // Step 5: Deploy on-chain — user signs the transaction
      setState("deploying");
      const contract = new ethers.Contract(
        TOKEN_MANAGER_ADDRESS,
        TOKEN_MANAGER_ABI,
        signer
      );

      const tx = await contract.createToken(
        prepData.createArg,
        prepData.signature,
        { value: BigInt(prepData.creationFee) }
      );

      const receipt = await tx.wait();

      // Step 6: Parse token address from logs
      const iface = new ethers.Interface(TOKEN_MANAGER_ABI);
      let tokenAddress = "";

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed?.name === "TokenCreate") {
            tokenAddress = parsed.args[0]; // token address
            break;
          }
        } catch {
          // not our event, skip
        }
      }

      if (!tokenAddress) {
        // Fallback: use tx hash
        tokenAddress = receipt.contractAddress || "";
      }

      setResult({
        tokenAddress,
        txHash: receipt.hash,
        explorerUrl: `https://bscscan.com/tx/${receipt.hash}`,
        fourMemeUrl: tokenAddress
          ? `https://four.meme/token/${tokenAddress}`
          : `https://four.meme`,
      });
      setState("success");
    } catch (err: unknown) {
      const error = err as { step?: string; message?: string; code?: string };

      // User rejected tx
      if (error.code === "ACTION_REJECTED") {
        setError({ step: "deploy", message: "Transaction rejected by user" });
      } else {
        setError({
          step: error.step || "unknown",
          message: error.message || "Launch failed",
        });
      }
      setState("error");
    }
  };

  const copyAddress = () => {
    if (result?.tokenAddress) {
      navigator.clipboard.writeText(result.tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Idle: Show launch button ──
  if (state === "idle") {
    return (
      <button
        onClick={handleLaunch}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer
          bg-[var(--accent)] text-[var(--bg-base)]
          hover:brightness-110 active:scale-[0.97] transition-all"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        <Rocket className="w-3.5 h-3.5" />
        Launch on Four.meme
      </button>
    );
  }

  // ── Success: Show result ──
  if (state === "success" && result) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--green-glow)] border border-[var(--green-dim)]">
          <Check className="w-4 h-4 text-[var(--green)]" />
          <span className="text-xs font-bold text-[var(--green)]">Token Deployed!</span>
        </div>
        {result.tokenAddress && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
            <span className="truncate max-w-[160px]">{result.tokenAddress}</span>
            <button onClick={copyAddress} className="cursor-pointer hover:text-[var(--text-primary)] transition-colors">
              {copied ? <Check className="w-3 h-3 text-[var(--green)]" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ExternalLink className="w-3 h-3" /> BSCScan
          </a>
          <a href={result.fourMemeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] hover:brightness-110 transition-colors">
            <ExternalLink className="w-3 h-3" /> Four.meme
          </a>
        </div>
      </div>
    );
  }

  // ── Error: Show retry ──
  if (state === "error" && error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--red-glow)] border border-[var(--red-dim)]">
          <AlertCircle className="w-4 h-4 text-[var(--red)]" />
          <div>
            <span className="text-xs font-bold text-[var(--red)]">Failed at: {error.step}</span>
            <p className="text-[10px] text-[var(--red)] opacity-80 mt-0.5">{error.message}</p>
          </div>
        </div>
        <button
          onClick={() => { setState("idle"); setError(null); }}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Loading states ──
  if (state === "signing" || state === "preparing" || state === "deploying") {
    const labels: Record<string, string> = {
      signing: "Sign message in wallet...",
      preparing: "Uploading to Four.meme...",
      deploying: "Confirm transaction in wallet...",
    };

    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
        <span className="text-xs text-[var(--text-secondary)]">{labels[state]}</span>
      </div>
    );
  }

  // ── Config: Launch settings form ──
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-3 border-t border-[var(--border)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
            style={{ fontFamily: "var(--font-orbitron)" }}>
            Launch Config
          </h3>

          {/* Wallet connect */}
          {!isConnected && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
              <appkit-button size="sm" />
            </div>
          )}

          {isConnected && (
            <div className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Category</label>
            <div className="relative">
              <select
                value={config.label}
                onChange={(e) => setConfig({ ...config, label: e.target.value as TokenLabel })}
                className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] appearance-none cursor-pointer"
              >
                {LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-dim)] pointer-events-none" />
            </div>
          </div>

          {/* Presale */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Presale BNB (creator buy)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.preSale}
              onChange={(e) => setConfig({ ...config, preSale: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
              placeholder="0"
            />
          </div>

          {/* Anti-snipe */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.feePlan}
              onChange={(e) => setConfig({ ...config, feePlan: e.target.checked })}
              className="rounded accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">Anti-snipe mode</span>
          </label>

          {/* Tax toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.taxEnabled}
              onChange={(e) => setConfig({ ...config, taxEnabled: e.target.checked })}
              className="rounded accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">Enable tax token</span>
          </label>

          {/* Tax config (expanded) */}
          {config.taxEnabled && (
            <div className="pl-4 space-y-2 border-l-2 border-[var(--accent-dim)]">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Fee Rate</label>
                <select
                  value={config.tokenTaxInfo?.feeRate || 1}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      tokenTaxInfo: {
                        feeRate: Number(e.target.value) as 1 | 3 | 5 | 10,
                        burnRate: config.tokenTaxInfo?.burnRate || 100,
                        divideRate: config.tokenTaxInfo?.divideRate || 0,
                        liquidityRate: config.tokenTaxInfo?.liquidityRate || 0,
                        recipientRate: config.tokenTaxInfo?.recipientRate || 0,
                        recipientAddress: config.tokenTaxInfo?.recipientAddress || "",
                        minSharing: config.tokenTaxInfo?.minSharing || 100000,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] appearance-none cursor-pointer"
                >
                  <option value={1}>1%</option>
                  <option value={3}>3%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                </select>
              </div>
              <p className="text-[10px] text-[var(--text-dim)]">
                Burn: {config.tokenTaxInfo?.burnRate || 100}% | Dividend: {config.tokenTaxInfo?.divideRate || 0}% | LP: {config.tokenTaxInfo?.liquidityRate || 0}%
              </p>
            </div>
          )}

          {/* Social links */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Social Links (optional)</label>
            <input
              type="text"
              value={config.twitterUrl}
              onChange={(e) => setConfig({ ...config, twitterUrl: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
              placeholder="Twitter URL"
            />
            <input
              type="text"
              value={config.telegramUrl}
              onChange={(e) => setConfig({ ...config, telegramUrl: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
              placeholder="Telegram URL"
            />
            <input
              type="text"
              value={config.webUrl}
              onChange={(e) => setConfig({ ...config, webUrl: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
              placeholder="Website URL"
            />
          </div>

          {/* Deploy button */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDeploy}
              disabled={!isConnected}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer
                bg-[var(--accent)] text-[var(--bg-base)]
                hover:brightness-110 active:scale-[0.97]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Rocket className="w-4 h-4" />
              Deploy to Four.meme
            </button>
            <button
              onClick={() => setState("idle")}
              className="px-3 py-2.5 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
