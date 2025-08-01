const { ethers } = require("ethers");
require("dotenv").config();
const { Contract, Provider } = require("ethers-multicall");
const fs = require("fs");

// Uniswap V3 uses a concept of concentrated liquidity: LPs provide liquidity only within specific price ranges.
// These ranges are defined by ticks, spaced by tickSpacing.
// However, not all ticks are used — only those that actually have LP liquidity assigned to them are marked as initialized.

// === CONFIG ===
// Target Uniswap V3 Pool: USDC/USDT 0.01% on Ethereum Mainnet
const USDC_USDT_POOL = "0x3416cf6c708da44db2624d63ea0aaef7113527c6";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;

// Standard Ethers provider setup
const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
);

// Multicall provider setup (used for batching multiple contract calls)
const multicallProvider = new Provider(provider, 1); // 1 = mainnet

// === Uniswap V3 Pool ABI (only needed functions)
const IUniswapV3PoolABI = [
  "function tickSpacing() view returns (int24)",
  "function tickBitmap(int16) view returns (uint256)",
  "function ticks(int24) view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)",
];

// === HELPER: Split array into chunks of fixed size ===
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  await multicallProvider.init();

  // Create multicall wrapper for the pool
  const poolMulticall = new Contract(USDC_USDT_POOL, IUniswapV3PoolABI);

  // === Step 1: Get tick spacing (e.g., 1 or 60 or 200, depending on fee tier)
  const [tickSpacing] = await multicallProvider.all([
    poolMulticall.tickSpacing(),
  ]);

  // === Converts a tick index to the corresponding word index for the tickBitmap
  function tickToWord(tick) {
    let compressed = Math.floor(tick / tickSpacing);
    if (tick < 0 && tick % tickSpacing !== 0) {
      compressed -= 1;
    }
    return compressed >> 8;
  }

  // === Define range ===
  const minWord = tickToWord(-887272);
  const maxWord = tickToWord(887272);

  const wordPosIndices = [];
  const calls = [];

  // === Step 2: Prepare bitmap reads for each word in the tickBitmap
  for (let i = minWord; i <= maxWord; i++) {
    wordPosIndices.push(i);
    calls.push(poolMulticall.tickBitmap(i));
  }

  // === Step 3: Use batching to avoid RPC payload too large errors
  const batchedCalls = chunkArray(calls, 100); // 100 per batch
  let allResults = [];

  for (let batch of batchedCalls) {
    const result = await multicallProvider.all(batch);
    allResults = allResults.concat(result);
  }

  // === Step 4: Decode the returned bitmaps to BigInt for bitwise ops
  const bitmaps = allResults.map((r) => BigInt(r.toString()));
  console.log(`✅ Bitmap words loaded: ${bitmaps.length}`);
  console.log("🔍 First bitmap example:", bitmaps[0].toString());

  // Now that we fetched all bitMaps, we check which ticks are initialized and calculate
  // the tick position from the word index and the tickSpacing of the pool.

  // === Step 5: Scan each bitmap word to detect initialized ticks
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
  console.log(tickIndices);

  // === Step 6: Fetch Full Tick Liquidity Data
  const tickCalls = tickIndices.map((tick) => poolMulticall.ticks(tick));

  const batchedTickCalls = chunkArray(tickCalls, 100); // batch in 100s
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

  console.log("Tick data:", tickData);

  // === Step 7: save the data to file
  fs.writeFileSync(
    "tick_liquidity.csv",
    "tick,liquidityGross,liquidityNet\n" +
      tickData
        .map((d) => `${d.tick},${d.liquidityGross},${d.liquidityNet}`)
        .join("\n")
  );
}

//main().catch(console.error);
module.exports = main;
