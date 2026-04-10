import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  getNonce,
  authenticate,
  uploadImage,
  createTokenRecord,
  buildNonceMessage,
  FourMemeError,
} from "@/lib/fourmeme/launch";
import type { LaunchConfig, LaunchPackage } from "@/types";

// POST /api/packages/[id]/launch
// Body: { walletAddress, signedNonce, nonce, config }
// Returns: { createArg, signature, creationFee } for client-side contract call
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();
  const { walletAddress, signedNonce, nonce, config } = body as {
    walletAddress: string;
    signedNonce: string;
    nonce: string;
    config: LaunchConfig;
  };

  if (!walletAddress || !signedNonce || !nonce) {
    return NextResponse.json(
      { error: "walletAddress, signedNonce, and nonce are required" },
      { status: 400 }
    );
  }

  // Load package from DB
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM packages WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const pkg: LaunchPackage = {
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

  try {
    // Step 2: Authenticate with Four.meme using user's signed nonce
    console.log("[Launch] Authenticating with Four.meme...");
    const accessToken = await authenticate(walletAddress, signedNonce, nonce);

    // Step 3: Upload the logo image
    console.log("[Launch] Uploading image...");
    const logoPath = pkg.imageUrls[0]; // first image is the logo
    let hostedImageUrl = "";

    if (logoPath) {
      hostedImageUrl = await uploadImage(accessToken, logoPath);
    }

    // Step 4: Create token record on Four.meme
    console.log("[Launch] Creating token record...");
    const result = await createTokenRecord(
      accessToken,
      pkg,
      config,
      hostedImageUrl
    );

    console.log("[Launch] Prepared — ready for on-chain deployment");

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    if (err instanceof FourMemeError) {
      console.error(`[Launch] Failed at step "${err.step}":`, err.message);
      return NextResponse.json(
        { error: err.message, step: err.step },
        { status: 500 }
      );
    }
    console.error("[Launch] Unexpected error:", err);
    return NextResponse.json(
      { error: "Launch failed", step: "unknown" },
      { status: 500 }
    );
  }
}

// GET /api/packages/[id]/launch/nonce
// Returns a fresh nonce from Four.meme for the client to sign
export async function GET() {
  try {
    const nonce = await getNonce();
    const message = buildNonceMessage(nonce);
    return NextResponse.json({ nonce, message });
  } catch (err) {
    console.error("[Launch] Nonce fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to get nonce from Four.meme" },
      { status: 500 }
    );
  }
}
