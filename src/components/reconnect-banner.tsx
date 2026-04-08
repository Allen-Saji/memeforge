"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

interface ReconnectBannerProps {
  show: boolean;
}

export function ReconnectBanner({ show }: ReconnectBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-muted)] border-b border-[var(--accent-dim)]">
            <WifiOff className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse-glow" />
            <span className="text-xs font-medium text-[var(--accent)]">
              Connection lost. Reconnecting...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
