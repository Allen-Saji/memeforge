"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Header } from "@/components/header";
import { StatsBar } from "@/components/stats-bar";
import { GapFeed } from "@/components/gap-feed";
import { PackageDetail } from "@/components/package-detail";
import { ReconnectBanner } from "@/components/reconnect-banner";
import { usePipeline } from "@/hooks/use-pipeline";

export default function DashboardPage() {
  const {
    gaps,
    packages,
    connected,
    reconnecting,
    lastScanAt,
    selectedGapId,
    selectGap,
    selectedGap,
    selectedPackage,
  } = usePipeline();

  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const handleSelectGap = (id: string) => {
    selectGap(id);
    // On mobile, open the detail sheet
    setMobileDetailOpen(true);
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Grid background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--text-dim) 1px, transparent 1px),
            linear-gradient(90deg, var(--text-dim) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Reconnection banner */}
      <ReconnectBanner show={reconnecting} />

      {/* Header */}
      <Header connected={connected} reconnecting={reconnecting} />

      {/* Stats bar */}
      <StatsBar gaps={gaps} packages={packages} lastScanAt={lastScanAt} />

      {/* Main content: gap feed + detail panel */}
      <div className="flex flex-1 min-h-0 relative z-[1]">
        {/* Gap Feed (left ~60%) */}
        <div className="w-full md:w-[55%] lg:w-[58%] md:border-r border-[var(--border)] flex flex-col min-h-0">
          <GapFeed
            gaps={gaps}
            packages={packages}
            selectedGapId={selectedGapId}
            onSelectGap={handleSelectGap}
          />
        </div>

        {/* Package Detail — Desktop (right ~40%) */}
        <div className="hidden md:flex md:w-[45%] lg:w-[42%] flex-col min-h-0 overflow-hidden">
          <div className="flex items-center px-5 py-3 border-b border-[var(--border)]">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              Launch Package
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PackageDetail gap={selectedGap} pkg={selectedPackage} />
          </div>
        </div>
      </div>

      {/* Package Detail — Mobile slide-up sheet */}
      <AnimatePresence>
        {mobileDetailOpen && selectedGap && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileDetailOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-16 z-50 md:hidden bg-[var(--bg-base)] rounded-t-2xl border-t border-[var(--border)] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <h2
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Launch Package
                </h2>
                <button
                  onClick={() => setMobileDetailOpen(false)}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                  aria-label="Close detail panel"
                >
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PackageDetail gap={selectedGap} pkg={selectedPackage} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ambient scan line effect */}
      <div className="fixed inset-0 pointer-events-none scan-overlay opacity-[0.15]" />
    </div>
  );
}
