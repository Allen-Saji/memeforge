import OpenAI from "openai";
import type { NarrativeGap, LaunchPackage } from "@/types";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getImagesDir } from "@/lib/db";

const FEWSHOT_EXAMPLES = `Successful Four.meme tokens for style reference:
- BROCCOLI ($BROCCOLI) — CZ mentioned his dog's name. Hit $400M mcap. Direct CZ reference.
- 4 ($4) — CZ posts "4" to dismiss FUD. Single character ticker. Pure inside joke.
- BUILDon ($B) — CZ's "Build and Build" ethos. Single-letter ticker.
- Mubarak ($MUBARAK) — Arabic blessing word. Charitable angle. Cross-cultural.
- TST ($TST) — BNB tutorial video accidentally went viral. Hit $500M mcap.
- 修仙 ($XIUXIAN) — "Cultivation/Immortality practice." Chinese xianxia culture.
- 发发发 ($888) — Triple prosperity. Chinese lucky number.
- 人生K线 ($人生K线) — "Life Candlestick Chart." Trading + life philosophy.
- SIREN ($SIREN) — AI-powered DeFi. Mythological branding. AI + utility angle.
- Perry ($PERRY) — Animal character. Fun and simple.

Four.meme culture notes:
- CZ Zhao's tweets are the #1 launch signal
- Chinese-language tokens are popular (Chinese characters as tickers)
- BNB-specific inside jokes (TST tutorial, jager unit, "4" motto)
- Tone is aspirational/earnest, not ironic like Solana
- Lucky numbers (888, 666) and Chinese numerology matter
- AI utility angle is welcomed`;

interface TextPackage {
  tokenName: string;
  ticker: string;
  tagline: string;
  description: string;
  talkingPoints: string[];
  launchStrategy: string;
}

export async function generatePackage(
  gap: NarrativeGap,
  openaiKey: string
): Promise<LaunchPackage> {
  const startTime = Date.now();

  // Fire text and image generation in parallel
  const [textResult, imageUrls] = await Promise.all([
    generateTextPackage(gap, openaiKey),
    generateImages(gap, openaiKey),
  ]);

  const textReadyMs = Date.now() - startTime;

  return {
    id: crypto.randomUUID(),
    gapId: gap.id,
    tokenName: textResult.tokenName,
    ticker: textResult.ticker,
    tagline: textResult.tagline,
    description: textResult.description,
    talkingPoints: textResult.talkingPoints,
    launchStrategy: textResult.launchStrategy,
    imageUrls,
    generatedAt: new Date().toISOString(),
    textReadyMs,
  };
}

async function generateTextPackage(
  gap: NarrativeGap,
  apiKey: string
): Promise<TextPackage> {
  const openai = new OpenAI({ apiKey });

  const sampleTweets = gap.narrative.tweets
    .slice(0, 5)
    .map((t) => `- "${t.text}" (${t.likeCount} likes, @${t.author.userName})`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a meme coin creative director specializing in Four.meme (BNB Chain).

${FEWSHOT_EXAMPLES}

Generate creative, culturally-accurate Four.meme token packages. Output valid JSON with these fields:
- tokenName: string (match Four.meme naming style)
- ticker: string (3-6 chars, can be Chinese characters, numbers, or English)
- tagline: string (one punchy line)
- description: string (2-3 sentences for Four.meme listing)
- talkingPoints: string[] (3 bullets for shilling on Twitter/Telegram)
- launchStrategy: string (which audience first, which channels)`,
      },
      {
        role: "user",
        content: `Trending narrative: "${gap.narrative.theme}"
Keywords: ${gap.narrative.keywords.join(", ")}
Sample tweets:
${sampleTweets}

No token exists on Four.meme for this narrative yet. Generate a launch package.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("GPT-4o returned empty response");

  try {
    return JSON.parse(content) as TextPackage;
  } catch {
    throw new Error(`GPT-4o returned invalid JSON: ${content.slice(0, 200)}`);
  }
}

async function generateImages(
  gap: NarrativeGap,
  apiKey: string
): Promise<string[]> {
  const imagesDir = getImagesDir();
  const imageId = crypto.randomUUID().slice(0, 8);

  try {
    // Use SDXL via Stability API (or fallback to OpenAI)
    const stabilityKey = process.env.STABILITY_API_KEY;

    if (stabilityKey) {
      return await generateWithStability(
        gap,
        stabilityKey,
        imagesDir,
        imageId
      );
    }

    // Fallback: OpenAI DALL-E 3
    return await generateWithOpenAI(gap, apiKey, imagesDir, imageId);
  } catch (err) {
    console.error("Image generation failed:", err);
    return []; // text package still usable without images
  }
}

async function generateWithStability(
  gap: NarrativeGap,
  apiKey: string,
  imagesDir: string,
  imageId: string
): Promise<string[]> {
  const prompt = buildImagePrompt(gap);
  const urls: string[] = [];

  // Generate token logo
  const logoRes = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: (() => {
        const form = new FormData();
        form.append("prompt", `Token logo: ${prompt}. Circular icon, bold, simple, meme style.`);
        form.append("output_format", "png");
        form.append("aspect_ratio", "1:1");
        return form;
      })(),
    }
  );

  if (logoRes.ok) {
    const buffer = Buffer.from(await logoRes.arrayBuffer());
    const logoPath = path.join(imagesDir, `${imageId}-logo.png`);
    fs.writeFileSync(logoPath, buffer);
    urls.push(`/images/${imageId}-logo.png`);
  }

  // Generate meme image
  const memeRes = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: (() => {
        const form = new FormData();
        form.append("prompt", `Meme image: ${prompt}. Funny, viral, bold text overlay, crypto meme style.`);
        form.append("output_format", "png");
        form.append("aspect_ratio", "16:9");
        return form;
      })(),
    }
  );

  if (memeRes.ok) {
    const buffer = Buffer.from(await memeRes.arrayBuffer());
    const memePath = path.join(imagesDir, `${imageId}-meme.png`);
    fs.writeFileSync(memePath, buffer);
    urls.push(`/images/${imageId}-meme.png`);
  }

  return urls;
}

async function generateWithOpenAI(
  gap: NarrativeGap,
  apiKey: string,
  imagesDir: string,
  imageId: string
): Promise<string[]> {
  const openai = new OpenAI({ apiKey });
  const prompt = buildImagePrompt(gap);
  const urls: string[] = [];

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Meme coin logo and artwork for "${gap.narrative.theme}". ${prompt}. Bold, colorful, meme style, crypto aesthetic.`,
      n: 1,
      size: "1024x1024",
    });

    if (response.data[0]?.url) {
      const imgRes = await fetch(response.data[0].url);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const imgPath = path.join(imagesDir, `${imageId}-logo.png`);
      fs.writeFileSync(imgPath, buffer);
      urls.push(`/images/${imageId}-logo.png`);
    }
  } catch (err) {
    console.error("OpenAI image gen failed:", err);
  }

  return urls;
}

function buildImagePrompt(gap: NarrativeGap): string {
  const theme = gap.narrative.theme;
  const keywords = gap.narrative.keywords.slice(0, 5).join(", ");
  return `Theme: ${theme}. Keywords: ${keywords}. BNB Chain meme coin aesthetic.`;
}
