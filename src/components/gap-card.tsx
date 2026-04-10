"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  TrendingUp,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Sparkles,
} from "lucide-react";
import { useRelativeTime } from "@/hooks/use-relative-time";
import type { NarrativeGap, LaunchPackage } from "@/types";

interface GapCardProps {
  gap: NarrativeGap;
  pkg?: LaunchPackage | null;
  selected: boolean;
  onSelect: (id: string) => void;
  index: number;
}

const statusConfig = {
  pending: {
    icon: CircleDot,
    label: "Pending",
    color: "var(--text-muted)",
    bg: "var(--bg-elevated)",
    border: "var(--border)",
  },
  generating: {
    icon: Loader2,
    label: "Generating",
    color: "var(--accent)",
    bg: "var(--accent-muted)",
    border: "var(--accent-dim)",
    animate: true,
  },
  complete: {
    icon: CheckCircle2,
    label: "Ready",
    color: "var(--green)",
    bg: "var(--green-glow)",
    border: "var(--green-dim)",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    color: "var(--red)",
    bg: "var(--red-glow)",
    border: "var(--red-dim)",
  },
};

function ScoreBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
        <motion.div
          className="h-full rounded-full score-bar"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums min-w-[2.5rem] text-right"
        style={{
          fontFamily: "var(--font-geist-mono)",
          color:
            score > 0.8
              ? "var(--green)"
              : score > 0.6
              ? "var(--accent)"
              : "var(--orange)",
        }}
      >
        {percentage}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: NarrativeGap["status"] }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon
        className={`w-3 h-3 ${
          "animate" in config && config.animate ? "animate-spin" : ""
        }`}
      />
      {config.label}
    </div>
  );
}

export function GapCard({ gap, pkg, selected, onSelect, index }: GapCardProps) {
  const timeAgo = useRelativeTime(gap.detectedAt);
  const engagement = gap.narrative.avgEngagement;
  const formattedEngagement =
    engagement >= 1000
      ? `${(engagement / 1000).toFixed(1)}k`
      : String(engagement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onSelect(gap.id)}
      className={`
        relative cursor-pointer rounded-xl p-4 border transition-all duration-200
        ${
          selected
            ? "bg-[var(--bg-card-hover)] border-[var(--accent-dim)] shadow-[var(--shadow-glow-accent)]"
            : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)]"
        }
        ${gap.status === "generating" ? "animate-border-pulse" : ""}
      `}
    >
      {/* Top row: theme + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className="text-base font-bold text-[var(--text-primary)] leading-tight"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {gap.narrative.theme}
        </h3>
        <StatusBadge status={gap.status} />
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <ScoreBar score={gap.score} />
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {gap.narrative.keywords.slice(0, 4).map((kw) => (
          <span
            key={kw}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border)]"
          >
            {kw}
          </span>
        ))}
        {gap.narrative.keywords.length > 4 && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[var(--text-muted)]">
            +{gap.narrative.keywords.length - 4}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          <span
            className="tabular-nums"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {gap.narrative.signalCount}
          </span>{" "}
          signals
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span
            className="tabular-nums"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {formattedEngagement}
          </span>{" "}
          avg
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </span>
      </div>

      {/* Package preview (if complete) */}
      {gap.status === "complete" && pkg && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span
            className="text-sm font-bold text-[var(--accent)]"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            {pkg.tokenName}
          </span>
          <span
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {pkg.ticker}
          </span>
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-[var(--accent)]" />
      )}
    </motion.div>
  );
}
