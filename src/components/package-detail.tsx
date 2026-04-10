"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ExternalLink,
  Download,
  Timer,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Crosshair,
  Loader2,
  ListChecks,
  Rocket,
  Image as ImageIcon,
  Wand2,
  Palette,
} from "lucide-react";
import { useRelativeTime, useElapsedTimer } from "@/hooks/use-relative-time";
import type { NarrativeGap, LaunchPackage, ConceptOption } from "@/types";
import { LaunchButton } from "@/components/launch-config";

interface PackageDetailProps {
  gap: NarrativeGap | null;
  pkg: LaunchPackage | null;
  onPackageGenerated?: (pkg: LaunchPackage) => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer
        bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]
        hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]
        transition-all duration-200"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[var(--green)]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Concept Picker ──────────────────────────────────────
function ConceptPicker({
  gap,
  onGenerate,
}: {
  gap: NarrativeGap;
  onGenerate: (pkg: LaunchPackage) => void;
}) {
  const [concepts, setConcepts] = useState<ConceptOption[] | null>(null);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elapsed = useElapsedTimer(generating);

  const fetchConcepts = useCallback(async () => {
    setLoadingConcepts(true);
    setError(null);
    try {
      const res = await fetch("/api/packages/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapId: gap.id }),
      });
      if (!res.ok) throw new Error("Failed to fetch concepts");
      const data = await res.json();
      setConcepts(data.concepts || []);
    } catch (err) {
      setError("Failed to generate concepts. Check API keys.");
      console.error(err);
    } finally {
      setLoadingConcepts(false);
    }
  }, [gap.id]);

  const generatePackage = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/packages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapId: gap.id, conceptIndex: selectedConcept }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const pkg = await res.json();
      onGenerate(pkg);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setGenerating(false);
    }
  }, [gap.id, selectedConcept, onGenerate]);

  // Generating state with live timer
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent-dim)] flex items-center justify-center animate-border-pulse">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          </div>
        </div>

        <h3
          className="text-sm font-bold text-[var(--text-primary)] mb-1"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Forging Launch Package
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          {concepts && selectedConcept !== null
            ? concepts[selectedConcept]?.tokenName
            : gap.narrative.theme}
        </p>

        {/* Live timer */}
        <div
          className="text-4xl font-bold text-[var(--accent)] tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {(elapsed / 1000).toFixed(1)}s
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">
          Generating...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Gap brief */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]" style={{ fontFamily: "var(--font-orbitron)" }}>
            Narrative Brief
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
            style={{
              fontFamily: "var(--font-geist-mono)",
              backgroundColor: `hsl(${gap.score * 120}, 70%, 15%)`,
              color: `hsl(${gap.score * 120}, 70%, 60%)`,
              border: `1px solid hsl(${gap.score * 120}, 70%, 25%)`,
            }}
          >
            {gap.score.toFixed(2)}
          </span>
        </div>

        <h2
          className="text-xl font-black text-[var(--text-primary)] tracking-wide capitalize mb-2"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {gap.narrative.theme}
        </h2>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {gap.narrative.keywords.slice(0, 6).map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
          <span>{gap.narrative.signalCount} signals ({gap.narrative.sources.join(", ")})</span>
          <span>{Math.round(gap.narrative.avgEngagement)} avg engagement</span>
          {gap.closestToken && (
            <span className="text-[var(--red)]">
              Closest: ${gap.closestToken.ticker}
            </span>
          )}
        </div>

        {/* Top signal preview */}
        {gap.narrative.topSignal && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
              &ldquo;{gap.narrative.topSignal.title}&rdquo;
            </p>
            <p className="text-[10px] text-[var(--text-dim)] mt-1">
              {gap.narrative.topSignal.source} · {gap.narrative.topSignal.engagement.toLocaleString()} engagement
            </p>
          </div>
        )}
      </div>

      {/* Concept options or generate button */}
      <div className="flex-1 px-5 py-4 space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-[var(--red-glow)] border border-[var(--red-dim)] text-xs text-[var(--red)]">
            {error}
          </div>
        )}

        {!concepts ? (
          // No concepts yet — show explore button
          <div className="flex flex-col items-center py-8">
            <button
              onClick={fetchConcepts}
              disabled={loadingConcepts}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold cursor-pointer
                bg-[var(--accent)] text-[var(--bg-base)]
                hover:brightness-110 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {loadingConcepts ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {loadingConcepts ? "Generating Concepts..." : "Explore Concepts"}
            </button>
            <p className="text-[10px] text-[var(--text-dim)] mt-2">
              AI generates 3 token concepts for you to choose from
            </p>
          </div>
        ) : (
          // Show concept cards
          <>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Pick a Concept
              </h3>
            </div>

            <div className="space-y-2">
              {concepts.map((concept, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedConcept(i)}
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedConcept === i
                      ? "bg-[var(--accent-muted)] border-[var(--accent)] ring-1 ring-[var(--accent-dim)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm font-bold text-[var(--text-primary)]"
                          style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                          {concept.tokenName}
                        </span>
                        <span
                          className="text-xs font-bold text-[var(--text-muted)]"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          ${concept.ticker}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] italic mb-2">
                        &ldquo;{concept.tagline}&rdquo;
                      </p>
                      <div className="flex items-start gap-1.5">
                        <ImageIcon className="w-3 h-3 text-[var(--text-dim)] mt-0.5 shrink-0" />
                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                          {concept.imageDirection}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        selectedConcept === i
                          ? "bg-[var(--accent)] text-[var(--bg-base)]"
                          : "bg-[var(--bg-elevated)] text-[var(--text-dim)] border border-[var(--border)]"
                      }`}
                    >
                      {concept.vibe}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <div className="pt-2">
              <button
                onClick={generatePackage}
                disabled={selectedConcept === null}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold cursor-pointer
                  bg-[var(--accent)] text-[var(--bg-base)]
                  hover:brightness-110 active:scale-[0.98]
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Rocket className="w-4 h-4" />
                Forge Launch Package
              </button>
              <p className="text-[10px] text-[var(--text-dim)] mt-2 text-center">
                Generates token description, talking points, launch strategy + meme images
              </p>
            </div>

            {/* Regenerate concepts */}
            <button
              onClick={() => {
                setConcepts(null);
                setSelectedConcept(null);
                fetchConcepts();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium text-[var(--text-dim)] hover:text-[var(--text-muted)] cursor-pointer transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              Regenerate concepts
            </button>
          </>
        )}

        {/* Source signals (collapsible) */}
        {gap.narrative.signals.length > 0 && (
          <SourceSignals signals={gap.narrative.signals} />
        )}
      </div>
    </div>
  );
}

// ── Source Signals (collapsible) ──────────────────────────
function SourceSignals({
  signals,
}: {
  signals: Array<{
    id: string;
    source: string;
    title: string;
    url?: string;
    engagement: number;
  }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const sourceLabel: Record<string, string> = {
    reddit: "Reddit",
    google_trends: "Google Trends",
    dexscreener: "Dexscreener",
    coingecko: "CoinGecko",
    twitter: "Twitter/X",
  };

  return (
    <section className="pt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full cursor-pointer group"
      >
        <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
          Source Signals ({signals.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--text-dim)] ml-auto" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-dim)] ml-auto" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {signals.map((signal) => (
                <div key={signal.id} className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)]">
                      {sourceLabel[signal.source] || signal.source}
                    </span>
                    <span
                      className="text-[10px] text-[var(--text-dim)] ml-auto"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatNum(signal.engagement)} engagement
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {signal.title}
                  </p>
                  {signal.url && (
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--accent)] hover:underline mt-1 inline-block"
                    >
                      View source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Completed Package View ──────────────────────────────
function CompletedPackage({ gap, pkg }: { gap: NarrativeGap; pkg: LaunchPackage }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pkg.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col h-full overflow-y-auto"
      >
        {/* Package header */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="mb-2">
            <h2
              className="text-2xl font-black text-[var(--accent)] tracking-wide"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {pkg.tokenName}
            </h2>
            <p
              className="text-sm font-bold text-[var(--text-muted)] mt-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              ${pkg.ticker}
            </p>
          </div>

          <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
            &ldquo;{pkg.tagline}&rdquo;
          </p>

          {/* Generation timer */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent-dim)]">
            <Timer className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              Generated in
            </span>
            <span
              className="text-sm font-bold text-[var(--accent)] tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {(pkg.textReadyMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] flex-wrap">
          <CopyButton text={pkg.ticker} label="Ticker" />
          <CopyButton text={pkg.description} label="Description" />
          <CopyButton
            text={pkg.talkingPoints.map((tp, i) => `${i + 1}. ${tp}`).join("\n")}
            label="Talking Points"
          />
          <LaunchButton pkg={pkg} />
          <a
            href={`/api/packages/${pkg.id}/export`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer
              bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]
              hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]
              transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export ZIP
          </a>
        </div>

        {/* Content sections */}
        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Images */}
          <section>
            <SectionHeader icon={ImageIcon} title="Generated Assets" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pkg.imageUrls.length > 0 ? (
                pkg.imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden flex items-center justify-center"
                  >
                    {url.startsWith("/") ? (
                      <img
                        src={`/api${url}`}
                        alt={i === 0 ? "Token Logo" : "Meme Asset"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <ImageIcon className="w-8 h-8 text-[var(--text-dim)] mx-auto mb-2" />
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {i === 0 ? "Logo" : "Meme"}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[var(--text-dim)] mb-2" />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    No images generated
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          <section>
            <SectionHeader icon={Sparkles} title="Description" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
              {pkg.description}
            </p>
          </section>

          {/* Talking Points */}
          <section>
            <SectionHeader icon={ListChecks} title="Talking Points" />
            <ul className="mt-2 space-y-2">
              {pkg.talkingPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                  <span
                    className="shrink-0 w-5 h-5 rounded-md bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center text-[10px] font-bold"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Launch Strategy */}
          <section>
            <SectionHeader icon={Rocket} title="Launch Strategy" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
              {pkg.launchStrategy}
            </p>
          </section>

          {/* Source Signals */}
          {gap.narrative.signals.length > 0 && (
            <SourceSignals signals={gap.narrative.signals} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[var(--text-muted)]" />
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </h3>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center mb-4">
        <Crosshair className="w-7 h-7 text-[var(--text-dim)]" />
      </div>
      <h3
        className="text-sm font-bold text-[var(--text-secondary)] mb-1"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        Select a Gap
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
        Click a narrative gap to explore concepts and forge a launch package
      </p>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────
export function PackageDetail({ gap, pkg, onPackageGenerated }: PackageDetailProps) {
  const [localPkg, setLocalPkg] = useState<LaunchPackage | null>(null);
  const displayPkg = localPkg || pkg;

  const handleGenerated = useCallback(
    (newPkg: LaunchPackage) => {
      setLocalPkg(newPkg);
      onPackageGenerated?.(newPkg);
    },
    [onPackageGenerated]
  );

  // Reset local package when gap changes
  if (gap && localPkg && localPkg.gapId !== gap.id) {
    setLocalPkg(null);
  }

  if (!gap) return <EmptyDetail />;

  // If package exists (from DB or just generated), show it
  if (displayPkg && gap.status === "complete") {
    return <CompletedPackage gap={gap} pkg={displayPkg} />;
  }

  // Otherwise show the concept picker / generation flow
  return <ConceptPicker gap={gap} onGenerate={handleGenerated} />;
}
