import { getRecentPackages, getRecentGaps } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const packages = getRecentPackages(50);
  const gaps = getRecentGaps(50);
  return NextResponse.json({ packages, gaps });
}
