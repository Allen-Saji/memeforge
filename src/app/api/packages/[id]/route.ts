import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const pkg = db
    .prepare(
      `SELECT p.*, g.score, g.match_score, g.detected_at as gap_detected_at,
              n.theme, n.keywords, n.tweet_count, n.avg_engagement
       FROM packages p
       JOIN gaps g ON p.gap_id = g.id
       JOIN narratives n ON g.narrative_id = n.id
       WHERE p.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...pkg,
    talking_points: JSON.parse(pkg.talking_points as string),
    image_urls: JSON.parse(pkg.image_urls as string),
    keywords: JSON.parse(pkg.keywords as string),
  });
}
