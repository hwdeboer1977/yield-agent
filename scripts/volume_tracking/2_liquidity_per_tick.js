const { ethers } = require("ethers");
require("dotenv").config();
const { Contract, Provider } = require("ethers-multicall");
const fs = require("fs");
const path = require("path");

// Uniswap V3 uses a concept of concentrated liquidity: LPs provide liquidity only within specific price ranges.
// These ranges are defined by ticks, spaced by tickSpacing.
// However, not all ticks are used — only those that actually have LP liquidity assigned to them are marked as initialized.

const USDC_USDT_POOL = "0x3416cf6c708da44db2624d63ea0aaef7113527c6";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;

const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
);
const multicallProvider = new Provider(provider, 1); // 1 = Ethereum mainnet

const IUniswapV3PoolABI = [
  "function tickSpacing() view returns (int24)",
  "function tickBitmap(int16) view returns (uint256)",
  "function ticks(int24) view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)",
];

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function runLiquidityDump(dateStr) {
  await multicallProvider.init();
  const poolMulticall = new Contract(USDC_USDT_POOL, IUniswapV3PoolABI);

  const [tickSpacing] = await multicallProvider.all([
    poolMulticall.tickSpacing(),
  ]);

  const tickToWord = (tick) => {
    let compressed = Math.floor(tick / tickSpacing);
    if (tick < 0 && tick % tickSpacing !== 0) compressed -= 1;
    return compressed >> 8;
  };

  const minWord = tickToWord(-887272);
  const maxWord = tickToWord(887272);

  const wordPosIndices = [];
  const calls = [];
  for (let i = minWord; i <= maxWord; i++) {
    wordPosIndices.push(i);
    calls.push(poolMulticall.tickBitmap(i));
  }

  const batchedCalls = chunkArray(calls, 100);
  let allResults = [];
  for (let batch of batchedCalls) {
    const result = await multicallProvider.all(batch);
    allResults = allResults.concat(result);
  }

  const bitmaps = allResults.map((r) => BigInt(r.toString()));
  const tickIndices = [];

  for (let j = 0; j < wordPosIndices.length; j++) {
    const ind = wordPosIndices[j];
    const bitmap = bitmaps[j];
    if (bitmap !== 0n) {
      for (let i = 0; i < 256; i++) {
        const bit = 1n;
        const initialized = (bitmap & (bit << BigInt(i))) !== 0n;
        if (initialized) {
          const tickIndex = (ind * 256 + i) * tickSpacing;
          tickIndices.push(tickIndex);
        }
      }
    }
  }

  const tickCalls = tickIndices.map((tick) => poolMulticall.ticks(tick));
  const batchedTickCalls = chunkArray(tickCalls, 100);
  let tickResults = [];
  for (let batch of batchedTickCalls) {
    const res = await multicallProvider.all(batch);
    tickResults = tickResults.concat(res);
  }

  const tickData = tickIndices.map((tick, i) => ({
    tick,
    liquidityGross: tickResults[i].liquidityGross.toString(),
    liquidityNet: tickResults[i].liquidityNet.toString(),
  }));

  // === Save to CSV
  const csvOutput =
    "tick,liquidityGross,liquidityNet\n" +
    tickData
      .map((d) => `${d.tick},${d.liquidityGross},${d.liquidityNet}`)
      .join("\n");
  fs.writeFileSync(
    path.join("data", `tick_liquidity_${dateStr}.csv`),
    csvOutput
  );

  // === Save to JSON
  const outputPath = path.join("data", `liquidity_${dateStr}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(tickData, null, 2));

  console.log(`✅ Liquidity data saved as: ${outputPath}`);
  return tickData;
}

//runLiquidityDump();
module.exports = { runLiquidityDump };
