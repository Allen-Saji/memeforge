import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { NarrativeGap, LaunchPackage, FourMemeToken } from "@/types";

const DB_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "memeforge.db");
const IMAGES_DIR = path.join(DB_DIR, "images");

// Ensure directories exist
fs.mkdirSync(DB_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS narratives (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL,
      keywords TEXT NOT NULL, -- JSON array
      sources TEXT NOT NULL, -- JSON array of SignalSource
      signal_count INTEGER NOT NULL,
      avg_engagement REAL NOT NULL,
      top_signal TEXT NOT NULL, -- JSON
      detected_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS four_meme_tokens (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      launched_at TEXT,
      market_cap REAL,
      holder_count INTEGER,
      bonding_curve_progress REAL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gaps (
      id TEXT PRIMARY KEY,
      narrative_id TEXT NOT NULL,
      score REAL NOT NULL,
      match_score REAL NOT NULL,
      closest_token_address TEXT,
      detected_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (narrative_id) REFERENCES narratives(id),
      FOREIGN KEY (closest_token_address) REFERENCES four_meme_tokens(address)
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      gap_id TEXT NOT NULL,
      token_name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      talking_points TEXT NOT NULL, -- JSON array
      launch_strategy TEXT NOT NULL,
      image_urls TEXT NOT NULL, -- JSON array
      generated_at TEXT NOT NULL,
      text_ready_ms INTEGER NOT NULL,
      FOREIGN KEY (gap_id) REFERENCES gaps(id)
    );

    CREATE INDEX IF NOT EXISTS idx_gaps_score ON gaps(score DESC);
    CREATE INDEX IF NOT EXISTS idx_gaps_status ON gaps(status);
    CREATE INDEX IF NOT EXISTS idx_packages_generated ON packages(generated_at DESC);
  `);
}

export function getImagesDir(): string {
  return IMAGES_DIR;
}

// Check disk usage — prune if >90% (safety for Railway volume)
export function checkDiskSpace(): boolean {
  try {
    const stats = fs.statfsSync(DB_DIR);
    const usedPercent = 1 - stats.bavail / stats.blocks;
    if (usedPercent > 0.9) {
      pruneOldPackages(50);
      return false;
    }
    return true;
  } catch {
    return true; // can't check, assume OK
  }
}

function pruneOldPackages(keepCount: number) {
  const d = getDb();
  const oldPackages = d
    .prepare(
      `SELECT id, image_urls FROM packages ORDER BY generated_at DESC LIMIT -1 OFFSET ?`
    )
    .all(keepCount) as Array<{ id: string; image_urls: string }>;

  for (const pkg of oldPackages) {
    // Delete image files
    const urls: string[] = JSON.parse(pkg.image_urls);
    for (const url of urls) {
      const filePath = path.join(IMAGES_DIR, path.basename(url));
      try {
        fs.unlinkSync(filePath);
      } catch {
        // file may not exist
      }
    }
    d.prepare("DELETE FROM packages WHERE id = ?").run(pkg.id);
  }
}

// Insert helpers
export function insertGap(gap: NarrativeGap) {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO narratives (id, theme, keywords, sources, signal_count, avg_engagement, top_signal, detected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    gap.narrative.id,
    gap.narrative.theme,
    JSON.stringify(gap.narrative.keywords),
    JSON.stringify(gap.narrative.sources),
    gap.narrative.signalCount,
    gap.narrative.avgEngagement,
    JSON.stringify(gap.narrative.topSignal),
    gap.narrative.detectedAt
  );

  d.prepare(
    `INSERT OR REPLACE INTO gaps (id, narrative_id, score, match_score, closest_token_address, detected_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    gap.id,
    gap.narrative.id,
    gap.score,
    gap.matchScore,
    gap.closestToken?.address || null,
    gap.detectedAt,
    gap.status
  );
}

export function insertPackage(pkg: LaunchPackage) {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO packages (id, gap_id, token_name, ticker, tagline, description, talking_points, launch_strategy, image_urls, generated_at, text_ready_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    pkg.id,
    pkg.gapId,
    pkg.tokenName,
    pkg.ticker,
    pkg.tagline,
    pkg.description,
    JSON.stringify(pkg.talkingPoints),
    pkg.launchStrategy,
    JSON.stringify(pkg.imageUrls),
    pkg.generatedAt,
    pkg.textReadyMs
  );

  // Update gap status
  d.prepare("UPDATE gaps SET status = 'complete' WHERE id = ?").run(pkg.gapId);
}

export function updateGapStatus(gapId: string, status: NarrativeGap["status"]) {
  const d = getDb();
  d.prepare("UPDATE gaps SET status = ? WHERE id = ?").run(status, gapId);
}

// Query helpers
export function getRecentGaps(limit = 20): NarrativeGap[] {
  const d = getDb();
  const rows = d
    .prepare(
      `SELECT g.*, n.theme, n.keywords, n.sources, n.signal_count, n.avg_engagement, n.top_signal, n.detected_at as narrative_detected_at,
              t.address as token_address, t.name as token_name, t.ticker as token_ticker, t.market_cap, t.holder_count, t.bonding_curve_progress
       FROM gaps g
       JOIN narratives n ON g.narrative_id = n.id
       LEFT JOIN four_meme_tokens t ON g.closest_token_address = t.address
       ORDER BY g.score DESC
       LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map(mapRowToGap);
}

export function getPackageByGapId(gapId: string): LaunchPackage | null {
  const d = getDb();
  const row = d
    .prepare("SELECT * FROM packages WHERE gap_id = ?")
    .get(gapId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapRowToPackage(row);
}

export function getRecentPackages(limit = 20): LaunchPackage[] {
  const d = getDb();
  const rows = d
    .prepare("SELECT * FROM packages ORDER BY generated_at DESC LIMIT ?")
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map(mapRowToPackage);
}

export function insertFourMemeToken(token: FourMemeToken) {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO four_meme_tokens (address, name, ticker, launched_at, market_cap, holder_count, bonding_curve_progress, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    token.address,
    token.name,
    token.ticker,
    token.launchedAt,
    token.marketCap || null,
    token.holderCount || null,
    token.bondingCurveProgress || null,
    new Date().toISOString()
  );
}

function mapRowToGap(row: Record<string, unknown>): NarrativeGap {
  return {
    id: row.id as string,
    score: row.score as number,
    matchScore: row.match_score as number,
    detectedAt: row.detected_at as string,
    status: row.status as NarrativeGap["status"],
    narrative: {
      id: row.narrative_id as string,
      theme: row.theme as string,
      keywords: JSON.parse(row.keywords as string),
      signals: [],
      signalCount: row.signal_count as number,
      sources: JSON.parse((row.sources as string) || "[]"),
      avgEngagement: row.avg_engagement as number,
      topSignal: JSON.parse(row.top_signal as string),
      detectedAt: row.narrative_detected_at as string,
    },
    closestToken: row.token_address
      ? {
          address: row.token_address as string,
          name: row.token_name as string,
          ticker: row.token_ticker as string,
          launchedAt: "",
          marketCap: row.market_cap as number | undefined,
          holderCount: row.holder_count as number | undefined,
          bondingCurveProgress: row.bonding_curve_progress as number | undefined,
        }
      : undefined,
  };
}

function mapRowToPackage(row: Record<string, unknown>): LaunchPackage {
  return {
    id: row.id as string,
    gapId: row.gap_id as string,
    tokenName: row.token_name as string,
    ticker: row.ticker as string,
    tagline: row.tagline as string,
    description: row.description as string,
    talkingPoints: JSON.parse(row.talking_points as string),
    launchStrategy: row.launch_strategy as string,
    imageUrls: JSON.parse(row.image_urls as string),
    generatedAt: row.generated_at as string,
    textReadyMs: row.text_ready_ms as number,
  };
}
