import { NextResponse } from "next/server";
import { runCycle } from "@/lib/pipeline";

export async function POST() {
  try {
    const result = await runCycle();
    return NextResponse.json({
      ok: true,
      gaps: result.gaps,
      sources: result.sources,
    });
  } catch (err) {
    console.error("[API] Scan failed:", err);
    return NextResponse.json(
      { ok: false, error: "Scan cycle failed" },
      { status: 500 }
    );
  }
}
