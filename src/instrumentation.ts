export async function register() {
  // Only run on the server (not edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPipeline } = await import("@/lib/pipeline");
    const { seedDatabase } = await import("@/lib/fourmeme");

    // Seed static Four.meme tokens into DB
    seedDatabase();

    // Start pipeline if API keys are configured
    const hasKeys =
      process.env.TWITTER_API_KEY && process.env.OPENAI_API_KEY;

    if (hasKeys) {
      const interval = parseInt(
        process.env.PIPELINE_INTERVAL || "60000",
        10
      );
      console.log(
        `[MemeForge] Starting pipeline (interval: ${interval / 1000}s)`
      );
      startPipeline(interval);
    } else {
      console.log(
        "[MemeForge] Skipping pipeline — TWITTER_API_KEY and/or OPENAI_API_KEY not set"
      );
    }
  }
}
