"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { GapCard } from "./gap-card";
import type { NarrativeGap, LaunchPackage } from "@/types";

interface GapFeedProps {
  gaps: NarrativeGap[];
  packages: LaunchPackage[];
  selectedGapId: string | null;
  onSelectGap: (id: string) => void;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent-dim)] flex items-center justify-center mb-4 animate-pulse-glow">
        <Search className="w-7 h-7 text-[var(--accent)]" />
      </div>
      <h3
        className="text-sm font-bold text-[var(--text-secondary)] mb-1"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        Scanning for Narrative Gaps
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-[240px]">
        Monitoring Twitter for trending narratives with no matching token on
        Four.meme...
      </p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-glow"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function GapFeed({
  gaps,
  packages,
  selectedGapId,
  onSelectGap,
}: GapFeedProps) {
  // Sort: generating first, then by score descending
  const sorted = [...gaps].sort((a, b) => {
    if (a.status === "generating" && b.status !== "generating") return -1;
    if (b.status === "generating" && a.status !== "generating") return 1;
    return b.score - a.score;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Feed header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h2
            className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Gap Feed
          </h2>
          {gaps.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-dim)]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {gaps.length}
            </span>
          )}
        </div>
        <button
          className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          aria-label="Filter gaps"
        >
          <SlidersHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Feed content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          sorted.map((gap, i) => (
            <GapCard
              key={gap.id}
              gap={gap}
              pkg={packages.find((p) => p.gapId === gap.id) ?? null}
              selected={gap.id === selectedGapId}
              onSelect={onSelectGap}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
