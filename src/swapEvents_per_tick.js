const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

// This script connects to the USDC/USDT 0.01% Uniswap V3 pool on Ethereum mainnet.
// It fetches all Swap events from the last ~24 hours (~7200 blocks),
// then calculates total volume and volume per tick.
// Outputs: swap_data.json (raw data), swap_volume_per_tick.json (aggregated by tick).

// === CONFIG ===
const USDC_USDT_POOL = "0x3416cf6c708da44db2624d63ea0aaef7113527c6";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
);

// === Minimal ABI to listen to Swap events ===
const IUniswapV3PoolABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
];

// === Swap volume + tick-volume calculator ===
function calculate24hVolume(swaps) {
  let totalVolumeUSD = 0;
  const volumePerTick = {};

  for (const swap of swaps) {
    // Convert raw amounts (token0 and token1) to USD assuming both are 6-decimals
    const amt0 = Math.abs(Number(swap.amount0)) / 1e6; // USDC
    const amt1 = Math.abs(Number(swap.amount1)) / 1e6; // USDT
    const volumeUSD = (amt0 + amt1) / 2; // Use average of both sides
    totalVolumeUSD += volumeUSD;

    // Aggregate volume per tick
    const tick = swap.tick.toString(); // key as string
    if (!volumePerTick[tick]) volumePerTick[tick] = 0;
    volumePerTick[tick] += volumeUSD;
  }

  return {
    totalVolumeUSD: totalVolumeUSD.toFixed(2),
    volumePerTick,
  };
}

// === Fetch and process swaps from the last 24 hours ===
async function fetchSwaps() {
  // Create contract instance for Uniswap V3 pool
  const pool = new ethers.Contract(USDC_USDT_POOL, IUniswapV3PoolABI, provider);

  // Get current and past block number (~7200 blocks = ~24 hours at 12s/block)
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = latestBlock - 7200; // ~24h assuming 12s blocks

  console.log(`🔍 Fetching swaps from block ${fromBlock} to ${latestBlock}...`);

  const filter = pool.filters.Swap();
  const events = await pool.queryFilter(filter, fromBlock, latestBlock);

  console.log(`✅ Found ${events.length} swaps`);

  // Extract and format relevant fields from each event
  const swapData = events.map((evt) => ({
    blockNumber: evt.blockNumber,
    sender: evt.args.sender,
    recipient: evt.args.recipient,
    amount0: evt.args.amount0.toString(),
    amount1: evt.args.amount1.toString(),
    tick: evt.args.tick,
  }));

  // Save full raw swap data
  fs.writeFileSync("swap_data.json", JSON.stringify(swapData, null, 2));
  console.log("📁 Saved swap data to swap_data.json");

  // Calculate and log total + tick-level volume
  const { totalVolumeUSD, volumePerTick } = calculate24hVolume(swapData);
  console.log(`💰 Total 24h Volume (USD): $${totalVolumeUSD}`);

  // Save data to file
  fs.writeFileSync(
    "swap_volume_per_tick.json",
    JSON.stringify(volumePerTick, null, 2)
  );
  console.log("📊 Saved tick-level volume data to swap_volume_per_tick.json");
}

//fetchSwaps();
module.exports = fetchSwaps;
