"use client";

import { useState } from "react";
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
  Heart,
  Repeat2,
  Eye,
  Crosshair,
  Loader2,
  ListChecks,
  Rocket,
  Image as ImageIcon,
} from "lucide-react";
import { useRelativeTime, useElapsedTimer } from "@/hooks/use-relative-time";
import type { NarrativeGap, LaunchPackage } from "@/types";

interface PackageDetailProps {
  gap: NarrativeGap | null;
  pkg: LaunchPackage | null;
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

function GeneratingState({ gap }: { gap: NarrativeGap }) {
  const elapsed = useElapsedTimer(gap.status === "generating");

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
        Generating Launch Package
      </h3>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        {gap.narrative.theme}
      </p>

      {/* Live timer */}
      <div
        className="text-3xl font-bold text-[var(--accent)] tabular-nums"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {(elapsed / 1000).toFixed(1)}s
      </div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">
        Elapsed Time
      </p>
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
        Click a narrative gap card to view its launch package details
      </p>
    </div>
  );
}

function TweetCard({
  tweet,
}: {
  tweet: {
    text: string;
    author: { userName: string; name: string; isVerified: boolean };
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    viewCount: number;
  };
}) {
  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          {tweet.author.name}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          @{tweet.author.userName}
        </span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
        {tweet.text}
      </p>
      <div
        className="flex items-center gap-4 text-[10px] text-[var(--text-dim)]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" /> {formatNum(tweet.likeCount)}
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 className="w-3 h-3" /> {formatNum(tweet.retweetCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> {formatNum(tweet.replyCount)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> {formatNum(tweet.viewCount)}
        </span>
      </div>
    </div>
  );
}

export function PackageDetail({ gap, pkg }: PackageDetailProps) {
  const [tweetsExpanded, setTweetsExpanded] = useState(false);

  if (!gap) return <EmptyDetail />;
  if (gap.status === "generating") return <GeneratingState gap={gap} />;
  if (gap.status === "pending")
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center mb-4">
          <Crosshair className="w-7 h-7 text-[var(--accent)]" />
        </div>
        <h3
          className="text-sm font-bold text-[var(--text-secondary)] mb-1"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Queued for Generation
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
          This gap is waiting in the pipeline. Package generation will begin
          shortly.
        </p>
      </div>
    );

  if (gap.status === "failed")
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--red-glow)] border border-[var(--red-dim)] flex items-center justify-center mb-4">
          <Crosshair className="w-7 h-7 text-[var(--red)]" />
        </div>
        <h3
          className="text-sm font-bold text-[var(--red)] mb-1"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Generation Failed
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-[240px]">
          Package generation failed for &ldquo;{gap.narrative.theme}&rdquo;. The
          pipeline will retry automatically.
        </p>
      </div>
    );

  if (!pkg) return <EmptyDetail />;

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
          {/* Token Name + Ticker */}
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
              {pkg.ticker}
            </p>
          </div>

          {/* Tagline */}
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
          <a
            href="https://four.meme"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer
              bg-[var(--accent-muted)] border border-[var(--accent-dim)] text-[var(--accent)]
              hover:bg-[var(--accent)] hover:text-[var(--bg-base)]
              transition-all duration-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Four.meme
          </a>
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
          {/* Generated Images */}
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
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={url.startsWith("/") ? "hidden text-center p-3" : "text-center p-3"}>
                      <ImageIcon className="w-8 h-8 text-[var(--text-dim)] mx-auto mb-2" />
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {i === 0 ? "Logo" : "Meme"} Asset
                      </p>
                    </div>
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

          {/* Source Tweets (collapsible) */}
          <section>
            <button
              onClick={() => setTweetsExpanded(!tweetsExpanded)}
              className="flex items-center gap-2 w-full cursor-pointer group"
            >
              <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                Source Tweets ({gap.narrative.tweets.length})
              </span>
              {tweetsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-dim)] ml-auto" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-dim)] ml-auto" />
              )}
            </button>
            <AnimatePresence>
              {tweetsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {gap.narrative.tweets.map((tweet) => (
                      <TweetCard key={tweet.id} tweet={tweet} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
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
