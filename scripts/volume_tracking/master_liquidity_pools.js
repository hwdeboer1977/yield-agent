// Script to get liquidity, swap and fees per tick in a liquidity pool
const { runLiquidityDump } = require("./2_liquidity_per_tick.js");
//const { runSwapDump } = require("./swapEvents_per_tick.js");
//const { runMerge } = require("./merge_swaps_and_liquidity.js");

function getTodayStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // e.g., 2025-07-20
}

async function main() {
  const dateStr = getTodayStr();
  console.log(`📆 Running full pipeline for ${dateStr}...\n`);

  //   Step 1: Liquidity
  console.log("🔄 Step 1: Getting tick liquidity...");
  const liquidityData = await runLiquidityDump(dateStr);

  // Step 2: Get active liquidity

  // Step 2: Swaps
  //console.log("🔄 Step 2: Getting swap events...");
  //const swapData = await runSwapDump(dateStr);

  //   // Step 3: Merge and compute metrics
  //   console.log("🔄 Step 3: Merging and computing fees...");
  //   const mergedData = await runMerge(liquidityData, swapData, dateStr);

  //   console.log(
  //     `✅ All steps complete. Data saved in /output with date ${dateStr}`
  //  );

  //const totalVolu
}

main().catch((err) => {
  console.error("❌ Error in master script:", err);
});
