const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

const USDC_USDT_POOL = "0x3416cf6c708da44db2624d63ea0aaef7113527c6";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
);

const IUniswapV3PoolABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
];

function calculate24hVolume(swaps) {
  let totalVolumeUSD = 0;
  const volumePerTick = {};

  for (const swap of swaps) {
    const amt0 = Math.abs(Number(swap.amount0)) / 1e6;
    const amt1 = Math.abs(Number(swap.amount1)) / 1e6;
    const volumeUSD = (amt0 + amt1) / 2;
    totalVolumeUSD += volumeUSD;

    const tick = swap.tick.toString();
    if (!volumePerTick[tick]) volumePerTick[tick] = 0;
    volumePerTick[tick] += volumeUSD;
  }

  return {
    totalVolumeUSD: totalVolumeUSD.toFixed(2),
    volumePerTick,
  };
}

// ✅ Main function now assigned to a const
async function fetchSwaps(dateStr) {
  const pool = new ethers.Contract(USDC_USDT_POOL, IUniswapV3PoolABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = latestBlock - 7200;

  console.log(`🔍 Fetching swaps from block ${fromBlock} to ${latestBlock}...`);

  const filter = pool.filters.Swap();
  const events = await pool.queryFilter(filter, fromBlock, latestBlock);

  console.log(`✅ Found ${events.length} swaps`);

  const swapData = events.map((evt) => ({
    blockNumber: evt.blockNumber,
    sender: evt.args.sender,
    recipient: evt.args.recipient,
    amount0: evt.args.amount0.toString(),
    amount1: evt.args.amount1.toString(),
    tick: evt.args.tick,
  }));

  fs.writeFileSync(`data/swap_data.json_${dateStr}`, JSON.stringify(swapData, null, 2));
  console.log("📁 Saved swap data to swap_data.json");

  const { totalVolumeUSD, volumePerTick } = calculate24hVolume(swapData);
  console.log(`💰 Total 24h Volume (USD): $${totalVolumeUSD}`);

  fs.writeFileSync(
    `data/swap_volume_per_tick_${dateStr}.json`,
    JSON.stringify(volumePerTick, null, 2)
  );
  console.log("📊 Saved tick-level volume data to swap_volume_per_tick.json");
};

// ✅ Export the function properly
module.exports = fetchSwaps;
