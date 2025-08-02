// Master file that runs modular code blocks in correct order
const fetchSwaps = require("./swapEvents_per_tick");
const fetchLiquidity = require("./liquidity_per_tick");

async function runAll() {
  console.log("🌀 Running yield-agent scripts...");

  console.log("\n📥 Step 1: Fetching swap events (last 24h)...");
  await fetchSwaps();

  console.log("\n💧 Step 2: Fetching liquidity per tick...");
  await fetchLiquidity();

  console.log("\n✅ Done.");
}

runAll().catch((err) => {
  console.error("❌ Error in master script:", err);
});
