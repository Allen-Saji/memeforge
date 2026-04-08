import type { FourMemeToken } from "@/types";
import { insertFourMemeToken, getDb } from "@/lib/db";

const GECKO_TERMINAL_BASE = "https://api.geckoterminal.com/api/v2";

// Static seed list of well-known Four.meme tokens (fallback)
const SEED_TOKENS: FourMemeToken[] = [
  { address: "0xbroccoli", name: "CZ's Dog", ticker: "BROCCOLI", launchedAt: "2025-02-01" },
  { address: "0xmubarak", name: "Mubarak", ticker: "MUBARAK", launchedAt: "2025-03-01" },
  { address: "0xtst", name: "Test", ticker: "TST", launchedAt: "2025-02-15" },
  { address: "0xtut", name: "Tutorial", ticker: "TUT", launchedAt: "2025-02-20" },
  { address: "0xsiren", name: "SIREN", ticker: "SIREN", launchedAt: "2025-04-01" },
  { address: "0xbuildon", name: "BUILDon", ticker: "B", launchedAt: "2025-03-15" },
  { address: "0xpalu", name: "Palu", ticker: "PALU", launchedAt: "2025-10-01" },
  { address: "0xgigl", name: "Giggle", ticker: "GIGL", launchedAt: "2025-10-15" },
  { address: "0xliberty", name: "Torch of Liberty", ticker: "LIBERTY", launchedAt: "2025-01-20" },
  { address: "0x4token", name: "4", ticker: "4", launchedAt: "2025-01-01" },
  { address: "0xskyai", name: "SKYAI", ticker: "SKYAI", launchedAt: "2025-10-05" },
  { address: "0xegl1", name: "EGL1", ticker: "EGL1", launchedAt: "2025-09-15" },
  { address: "0x888", name: "发发发", ticker: "888", launchedAt: "2025-03-10" },
  { address: "0xbnbholder", name: "BNBHolder", ticker: "BNBHOLDER", launchedAt: "2025-10-20" },
  { address: "0xperry", name: "Perry", ticker: "PERRY", launchedAt: "2025-10-25" },
  { address: "0xsharks", name: "Money Sharks", ticker: "SHARKS", launchedAt: "2025-11-01" },
  { address: "0xbanana", name: "Banana For Scale", ticker: "$BANANA", launchedAt: "2025-09-01" },
  { address: "0xfom", name: "Freedom of Money", ticker: "FOM", launchedAt: "2025-08-15" },
  { address: "0xjager", name: "Jager Hunter", ticker: "JAGER", launchedAt: "2025-10-10" },
  { address: "0xghiblicz", name: "GhibliCZ", ticker: "Ghibli", launchedAt: "2025-03-20" },
];

export async function fetchFourMemeTokens(): Promise<FourMemeToken[]> {
  try {
    const tokens = await fetchFromGeckoTerminal();
    if (tokens.length > 0) {
      // Cache to DB
      for (const token of tokens) {
        insertFourMemeToken(token);
      }
      return tokens;
    }
  } catch (err) {
    console.error("GeckoTerminal fetch failed, using fallback:", err);
  }

  // Fallback: return seed list + any cached tokens from DB
  return getFallbackTokens();
}

async function fetchFromGeckoTerminal(): Promise<FourMemeToken[]> {
  // Fetch trending/new pools on BNB Chain
  const res = await fetch(
    `${GECKO_TERMINAL_BASE}/networks/bsc/new_pools?page=1`,
    {
      headers: { Accept: "application/json" },
    }
  );

  if (!res.ok) {
    throw new Error(`GeckoTerminal API error: ${res.status}`);
  }

  const data = await res.json();
  const pools = data?.data || [];

  return pools
    .map((pool: Record<string, unknown>): FourMemeToken | null => {
      const attrs = pool.attributes as Record<string, unknown> | undefined;
      if (!attrs) return null;

      const name = (attrs.name as string) || "";
      const baseToken = attrs.base_token_id as string | undefined;

      return {
        address: baseToken || (pool.id as string),
        name: name.split(" / ")[0] || name,
        ticker: (attrs.base_token_symbol as string) || "",
        launchedAt: (attrs.pool_created_at as string) || new Date().toISOString(),
        marketCap: attrs.market_cap_usd
          ? Number(attrs.market_cap_usd)
          : undefined,
      };
    })
    .filter(Boolean) as FourMemeToken[];
}

function getFallbackTokens(): FourMemeToken[] {
  // Try to get cached tokens from DB first
  const d = getDb();
  const cached = d
    .prepare("SELECT * FROM four_meme_tokens ORDER BY updated_at DESC LIMIT 100")
    .all() as Array<Record<string, unknown>>;

  if (cached.length > 0) {
    return cached.map(
      (row): FourMemeToken => ({
        address: row.address as string,
        name: row.name as string,
        ticker: row.ticker as string,
        launchedAt: (row.launched_at as string) || "",
        marketCap: row.market_cap as number | undefined,
        holderCount: row.holder_count as number | undefined,
        bondingCurveProgress: row.bonding_curve_progress as number | undefined,
      })
    );
  }

  // Last resort: seed list
  return SEED_TOKENS;
}

export function seedDatabase() {
  for (const token of SEED_TOKENS) {
    insertFourMemeToken(token);
  }
  console.log(`Seeded ${SEED_TOKENS.length} Four.meme tokens`);
}
