import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import OpenAI from "openai";

export interface ConceptOption {
  tokenName: string;
  ticker: string;
  tagline: string;
  imageDirection: string; // describes what the image would look like
  vibe: string; // e.g. "Degen", "Aspirational", "Meme Lord", "CZ Orbit"
}

// POST /api/packages/concepts
// Body: { gapId: string }
// Returns 3 concept options for the user to choose from (cheap GPT-4o-mini call)
export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { gapId } = body as { gapId: string };

  if (!gapId) {
    return NextResponse.json({ error: "gapId required" }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT g.*, n.theme, n.keywords, n.top_tweet
       FROM gaps g
       JOIN narratives n ON g.narrative_id = n.id
       WHERE g.id = ?`
    )
    .get(gapId) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: "Gap not found" }, { status: 404 });
  }

  const theme = row.theme as string;
  const keywords = JSON.parse(row.keywords as string) as string[];
  const topTweet = JSON.parse(row.top_tweet as string);

  const openai = new OpenAI({ apiKey: openaiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a meme coin creative director for Four.meme (BNB Chain).

Four.meme culture:
- CZ's tweets/actions are top launch signals
- Chinese-language tokens are popular (Chinese chars as tickers)
- BNB inside jokes (TST tutorial, jager unit, "4" motto)
- Tone is aspirational/earnest, not ironic like Solana
- Lucky numbers (888, 666) matter
- AI utility angle is welcomed

Generate exactly 3 DISTINCT concept options for a meme coin. Each concept should have a different vibe/angle. Output JSON:
{
  "concepts": [
    {
      "tokenName": "string",
      "ticker": "string (3-6 chars)",
      "tagline": "string (one punchy line)",
      "imageDirection": "string (describe the visual: what the logo/meme would look like, colors, style, composition)",
      "vibe": "string (e.g. Degen, Aspirational, Meme Lord, CZ Orbit, Chinese Culture, AI Hybrid)"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Trending narrative: "${theme}"
Keywords: ${keywords.join(", ")}
Top tweet: "${topTweet.text || topTweet}"

No token exists on Four.meme for this narrative. Generate 3 distinct concepts.`,
        },
      ],
      temperature: 1.0,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[Concepts] Generation failed:", err);
    return NextResponse.json(
      { error: "Concept generation failed" },
      { status: 500 }
    );
  }
}
