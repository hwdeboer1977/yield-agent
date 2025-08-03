// Master file that runs modular code blocks in correct order
const fetchAggInfo = require("./1_agg_info_pool");
const fetchLiquidity = require("./2_liquidity_per_tick");
const fetchActiveLiquidity = require("./3_active_liquidity_per_tick"); 
const fetchSwaps = require("./4_swapEvents_per_tick");
const mergeData = require("./5_merge_swaps_and_liquidity"); // optional final merge step

async function runAll() {
  console.log("🚀 Running yield-agent scripts...");

  console.log("\n📊 Step 1: Aggregating pool info...");
  await fetchAggInfo();

  // console.log("\n💧 Step 2: Fetching liquidity per tick...");
  // await fetchLiquidity();

  // console.log("\n🔥 Step 3: Fetching active liquidity (current tick)...");
  // await fetchActiveLiquidity();

  // console.log("\n🔁 Step 4: Fetching swap events (last 24h)...");
  // await fetchSwaps();

  // console.log("\n🧠 Step 5: Merging swap and liquidity data...");
  // await mergeData();

  console.log("\n✅ All steps completed.");
}

runAll().catch((err) => {
  console.error("❌ Error in master script:", err);
});

