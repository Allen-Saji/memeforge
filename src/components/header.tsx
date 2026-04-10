"use client";

import { Zap, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  connected: boolean;
  reconnecting: boolean;
}

export function Header({ connected, reconnecting }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent-dim)]">
          <Zap className="w-5 h-5 text-[var(--accent)]" />
          {connected && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--green)] animate-pulse-glow" />
          )}
        </div>
        <div>
          <h1
            className="text-lg font-bold tracking-wider uppercase text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Meme<span className="text-[var(--accent)]">Forge</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">
            Narrative Arbitrage Engine
          </p>
        </div>
      </div>

      {/* Wallet + Connection Status */}
      <div className="flex items-center gap-3">
        {/* Reown AppKit wallet button (web component) */}
        <div dangerouslySetInnerHTML={{ __html: '<appkit-button size="sm"></appkit-button>' }} />
      </div>
      <div className="flex items-center gap-2">
        {connected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--green-glow)] border border-[var(--green-dim)]">
            <Wifi className="w-3.5 h-3.5 text-[var(--green)]" />
            <span className="text-xs font-medium text-[var(--green)]">
              Live
            </span>
          </div>
        ) : reconnecting ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-dim)]">
            <WifiOff className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse-glow" />
            <span className="text-xs font-medium text-[var(--accent)]">
              Reconnecting...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--red-glow)] border border-[var(--red-dim)]">
            <WifiOff className="w-3.5 h-3.5 text-[var(--red)]" />
            <span className="text-xs font-medium text-[var(--red)]">
              Disconnected
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
