"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NarrativeGap, LaunchPackage, PipelineEvent } from "@/types";
import { mockGaps, mockPackages } from "@/lib/mock/data";

interface PipelineState {
  gaps: NarrativeGap[];
  packages: LaunchPackage[];
  connected: boolean;
  reconnecting: boolean;
  lastScanAt: string | null;
  selectedGapId: string | null;
  selectGap: (id: string | null) => void;
  selectedGap: NarrativeGap | null;
  selectedPackage: LaunchPackage | null;
}

const USE_MOCK = true; // Toggle for development

export function usePipeline(): PipelineState {
  const [gaps, setGaps] = useState<NarrativeGap[]>([]);
  const [packages, setPackages] = useState<LaunchPackage[]>([]);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);
  const retryRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Mock mode ──────────────────────────────────────────
  useEffect(() => {
    if (!USE_MOCK) return;

    // Simulate connection
    const connectTimer = setTimeout(() => {
      setConnected(true);
      setGaps(mockGaps);
      setPackages(mockPackages);
      setLastScanAt(new Date().toISOString());
      setSelectedGapId("gap-1");
    }, 800);

    return () => clearTimeout(connectTimer);
  }, []);

  // ── Live SSE mode ──────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) return;

    function connect() {
      const es = new EventSource("/api/sse");
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setReconnecting(false);
        retryRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          // Init event
          if (parsed.type === "init") {
            setGaps(parsed.gaps ?? []);
            setPackages(parsed.packages ?? []);
            setLastScanAt(new Date().toISOString());
            return;
          }

          // Pipeline events
          const pe = parsed as PipelineEvent;
          switch (pe.type) {
            case "gap_detected":
              setGaps((prev) => {
                const gap = pe.data as NarrativeGap;
                const exists = prev.find((g) => g.id === gap.id);
                if (exists) {
                  return prev.map((g) => (g.id === gap.id ? gap : g));
                }
                return [gap, ...prev];
              });
              break;

            case "package_generating":
              setGaps((prev) =>
                prev.map((g) =>
                  g.id === (pe.data as NarrativeGap).id
                    ? { ...g, status: "generating" as const }
                    : g
                )
              );
              break;

            case "package_complete":
              const pkg = pe.data as LaunchPackage;
              setPackages((prev) => {
                const exists = prev.find((p) => p.id === pkg.id);
                if (exists) {
                  return prev.map((p) => (p.id === pkg.id ? pkg : p));
                }
                return [pkg, ...prev];
              });
              setGaps((prev) =>
                prev.map((g) =>
                  g.id === pkg.gapId
                    ? { ...g, status: "complete" as const }
                    : g
                )
              );
              break;

            case "scan_cycle":
              setLastScanAt(
                (pe.data as { timestamp: string }).timestamp
              );
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        setConnected(false);
        setReconnecting(true);
        const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
        retryRef.current++;
        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const selectGap = useCallback((id: string | null) => {
    setSelectedGapId(id);
  }, []);

  const selectedGap = gaps.find((g) => g.id === selectedGapId) ?? null;
  const selectedPackage =
    packages.find((p) => p.gapId === selectedGapId) ?? null;

  return {
    gaps,
    packages,
    connected,
    reconnecting,
    lastScanAt,
    selectedGapId,
    selectGap,
    selectedGap,
    selectedPackage,
  };
}
