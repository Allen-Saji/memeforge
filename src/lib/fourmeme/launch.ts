import type { LaunchConfig, LaunchPackage, LaunchPrepareResult } from "@/types";
import { getImagesDir } from "@/lib/db";
import fs from "fs";
import path from "path";

const FOUR_MEME_API = "https://four.meme/meme-api/v1";

// ── Step 1: Get nonce ─────────────────────────────────────
export async function getNonce(): Promise<string> {
  const res = await fetch(`${FOUR_MEME_API}/public/user/login/nonce`);
  if (!res.ok) {
    throw new FourMemeError("auth", `Failed to get nonce: ${res.status}`);
  }
  const data = await res.json();
  return data.data?.nonce || data.nonce || data;
}

// ── Step 2: Authenticate with signed nonce ────────────────
export async function authenticate(
  walletAddress: string,
  signedMessage: string,
  nonce: string
): Promise<string> {
  const res = await fetch(`${FOUR_MEME_API}/public/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: walletAddress,
      signature: signedMessage,
      nonce,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new FourMemeError("auth", `Login failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const token = data.data?.accessToken || data.accessToken || data.data?.token;
  if (!token) {
    throw new FourMemeError("auth", "No access token in response");
  }
  return token;
}

// ── Step 3: Upload image ──────────────────────────────────
export async function uploadImage(
  accessToken: string,
  imageRelativePath: string
): Promise<string> {
  const imagesDir = getImagesDir();
  const filename = path.basename(imageRelativePath);
  const filePath = path.join(imagesDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new FourMemeError("upload", `Image not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "image/png" });

  const formData = new FormData();
  formData.append("file", blob, filename);

  const res = await fetch(`${FOUR_MEME_API}/private/tool/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new FourMemeError("upload", `Image upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const imgUrl = data.data?.url || data.url || data.data;
  if (!imgUrl) {
    throw new FourMemeError("upload", "No image URL in response");
  }
  return imgUrl;
}

// ── Step 4: Create token record ───────────────────────────
export async function createTokenRecord(
  accessToken: string,
  pkg: LaunchPackage,
  config: LaunchConfig,
  hostedImageUrl: string
): Promise<LaunchPrepareResult> {
  const body: Record<string, unknown> = {
    name: pkg.tokenName,
    shortName: pkg.ticker,
    desc: pkg.description,
    imgUrl: hostedImageUrl,
    launchTime: Date.now(),
    label: config.label,
    lpTradingFee: 0.0025,
    preSale: config.preSale || "0",
    feePlan: config.feePlan,
    onlyMPC: false,
    webUrl: config.webUrl || "",
    twitterUrl: config.twitterUrl || "",
    telegramUrl: config.telegramUrl || "",
  };

  if (config.taxEnabled && config.tokenTaxInfo) {
    body.tokenTaxInfo = {
      feeRate: config.tokenTaxInfo.feeRate,
      burnRate: config.tokenTaxInfo.burnRate,
      divideRate: config.tokenTaxInfo.divideRate,
      liquidityRate: config.tokenTaxInfo.liquidityRate,
      recipientRate: config.tokenTaxInfo.recipientRate,
      recipientAddress: config.tokenTaxInfo.recipientAddress,
      minSharing: config.tokenTaxInfo.minSharing,
    };
  }

  const res = await fetch(`${FOUR_MEME_API}/private/token/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new FourMemeError("create", `Token creation failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const result = data.data || data;

  if (!result.createArg || !result.signature) {
    throw new FourMemeError(
      "create",
      `Missing createArg/signature in response: ${JSON.stringify(result).slice(0, 200)}`
    );
  }

  return {
    createArg: result.createArg,
    signature: result.signature,
    creationFee: result.creationFeeWei || "10000000000000000", // default 0.01 BNB
  };
}

// ── Build nonce message ───────────────────────────────────
export function buildNonceMessage(nonce: string): string {
  return `You are sign in Meme ${nonce}`;
}

// ── Error class ───────────────────────────────────────────
export type LaunchStep = "auth" | "upload" | "create" | "deploy";

export class FourMemeError extends Error {
  step: LaunchStep;

  constructor(step: LaunchStep, message: string) {
    super(message);
    this.name = "FourMemeError";
    this.step = step;
  }
}
