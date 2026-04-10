"use client";

import { Target, Package, Clock, TrendingUp, Radar, Loader2 } from "lucide-react";
import { useRelativeTime } from "@/hooks/use-relative-time";
import type { NarrativeGap, LaunchPackage } from "@/types";

interface StatsBarProps {
  gaps: NarrativeGap[];
  packages: LaunchPackage[];
  lastScanAt: string | null;
  scanNow: () => Promise<void>;
  scanning: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-md"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p
          className="text-lg font-bold tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono)", color }}
        >
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
      </div>
    </div>
  );
}

export function StatsBar({ gaps, packages, lastScanAt, scanNow, scanning }: StatsBarProps) {
  const lastScan = useRelativeTime(lastScanAt);

  const avgScore =
    gaps.length > 0
      ? (gaps.reduce((sum, g) => sum + g.score, 0) / gaps.length).toFixed(2)
      : "0.00";

  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-5 border-b border-[var(--border)]">
      <StatCard
        icon={Target}
        label="Gaps Detected"
        value={gaps.length}
        color="var(--accent)"
      />
      <StatCard
        icon={Package}
        label="Packages Ready"
        value={packages.length}
        color="var(--green)"
      />
      <StatCard
        icon={TrendingUp}
        label="Avg Gap Score"
        value={avgScore}
        color="var(--blue)"
      />
      <StatCard
        icon={Clock}
        label="Last Scan"
        value={lastScan}
        color="var(--text-secondary)"
      />
      <button
        onClick={scanNow}
        disabled={scanning}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--accent-dim)] bg-[var(--accent-muted)] text-[var(--accent)] font-bold text-sm cursor-pointer hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        {scanning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Radar className="w-4 h-4" />
        )}
        {scanning ? "Scanning..." : "Scan Now"}
      </button>
    </div>
  );
}
