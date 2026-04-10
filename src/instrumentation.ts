export async function register() {
  // Only run on the server (not edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPipeline } = await import("@/lib/pipeline");
    const { seedDatabase } = await import("@/lib/fourmeme");

    // Seed static Four.meme tokens into DB
    seedDatabase();

    // Start auto-pipeline only in production with keys set
    const hasKeys =
      process.env.TWITTER_API_KEY && process.env.OPENAI_API_KEY;
    const manualScan = process.env.MANUAL_SCAN === "true";

    if (hasKeys && !manualScan) {
      const interval = parseInt(
        process.env.PIPELINE_INTERVAL || "300000",
        10
      );
      console.log(
        `[MemeForge] Starting pipeline (interval: ${interval / 1000}s)`
      );
      startPipeline(interval);
    } else {
      console.log(
        `[MemeForge] Manual scan mode — use the Scan button or POST /api/scan`
      );
    }
  }
}
