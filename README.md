# MemeForge

AI Narrative Arbitrage Agent for [Four.meme](https://four.meme) on BNB Chain.

Detects trending meme narratives on Twitter, cross-references against Four.meme's token registry to find **narrative gaps** (trending topics with no existing token), then generates complete launch-ready packages in under 60 seconds.

## How It Works

```
Twitter → Narrative Scanner → Gap Scorer → Creative Engine → Dashboard
                                  ↑
                          Four.meme Token Data
                          (CoinGecko + BNB Chain)
```

1. **Scan** — Polls Twitter for trending crypto/meme narratives via TwitterAPI.io
2. **Cross-reference** — Checks if trending narratives already have tokens on Four.meme
3. **Score** — Ranks narrative gaps by trend strength x recency x token absence
4. **Generate** — Creates full launch packages: token name, ticker, tagline, description, meme images
5. **Display** — Real-time dashboard with SSE updates, quick actions, and export

## Stack

- **Runtime:** TypeScript, Next.js 14+ (App Router)
- **AI:** GPT-4o (creative packages), GPT-4o-mini (scoring), SDXL (images)
- **Data:** SQLite (better-sqlite3), TwitterAPI.io, CoinGecko GeckoTerminal
- **Chain:** BNB Chain (read-only: token registry + bonding curve data)
- **Deploy:** Railway with persistent volume

## Setup

```bash
npm install
cp .env.example .env
# Fill in API keys
npm run dev
```

## Four.meme AI Sprint Hackathon

Built for the [Four.Meme AI Sprint](https://dorahacks.io/hackathon/fourmemeaisprint/detail) ($50k prize pool, April 2026).

## License

MIT
