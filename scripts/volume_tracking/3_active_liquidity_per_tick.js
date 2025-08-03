const { ethers } = require("ethers");
const JSBI = require("jsbi");
const { TickMath } = require("@uniswap/v3-sdk");
const fs = require("fs");

const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const TICK_FILE = "data/liquidity_2025-08-02.json";
const CURRENT_TICK = 10;

function getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }
  const numerator = JSBI.multiply(
    JSBI.multiply(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)),
    Q96
  );
  const denominator = JSBI.multiply(sqrtRatioBX96, sqrtRatioAX96);
  return JSBI.divide(numerator, denominator);
}

function getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }
  return JSBI.divide(
    JSBI.multiply(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)),
    Q96
  );
}

async function fetchActiveLiquidity() {
  const ticks = JSON.parse(fs.readFileSync(TICK_FILE, "utf8"));
  const sorted = ticks
    .map((t) => ({ ...t, tick: parseInt(t.tick) }))
    .filter((t) => t.tick >= -100 && t.tick <= 100)
    .sort((a, b) => a.tick - b.tick);

  // ============ Tick-band at CURRENT_TICK ============
  let activeLiquidity = JSBI.BigInt(0);
  let bandToken0 = 0;
  let bandToken1 = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const tickFrom = sorted[i].tick;
    const tickTo = sorted[i + 1].tick;
    const liquidityNet = JSBI.BigInt(sorted[i].liquidityNet);

    activeLiquidity = JSBI.add(activeLiquidity, liquidityNet);

    if (tickFrom <= CURRENT_TICK && CURRENT_TICK < tickTo) {
      const sqrtA = TickMath.getSqrtRatioAtTick(tickFrom);
      const sqrtB = TickMath.getSqrtRatioAtTick(tickTo);

      const amt0 = getAmount0ForLiquidity(sqrtA, sqrtB, activeLiquidity);
      const amt1 = getAmount1ForLiquidity(sqrtA, sqrtB, activeLiquidity);

      bandToken0 += Number(amt0.toString()) / 1e6;
      bandToken1 += Number(amt1.toString()) / 1e6;
    }
  }

  // ============ Full-range TVL [-100, 100] ============
  let fullLiquidity = JSBI.BigInt(0);
  let fullToken0 = 0;
  let fullToken1 = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const tickFrom = sorted[i].tick;
    const tickTo = sorted[i + 1].tick;
    const liquidityNet = JSBI.BigInt(sorted[i].liquidityNet);

    fullLiquidity = JSBI.add(fullLiquidity, liquidityNet);

    const sqrtA = TickMath.getSqrtRatioAtTick(tickFrom);
    const sqrtB = TickMath.getSqrtRatioAtTick(tickTo);

    const amt0 = getAmount0ForLiquidity(sqrtA, sqrtB, fullLiquidity);
    const amt1 = getAmount1ForLiquidity(sqrtA, sqrtB, fullLiquidity);

    fullToken0 += Number(amt0.toString()) / 1e6;
    fullToken1 += Number(amt1.toString()) / 1e6;
  }

  // ============ Output ============
  console.log(`📈 Current Tick: ${CURRENT_TICK}`);
  console.log(`🔢 Tick-band token0 (USDC): ${bandToken0.toLocaleString()}`);
  console.log(`🔢 Tick-band token1 (USDT): ${bandToken1.toLocaleString()}`);
  console.log(`💰 Tick-band TVL: ${(bandToken0 + bandToken1).toLocaleString()} USD\n`);

  console.log(`✅ Estimated token0 in [-100, 100]: ${fullToken0.toLocaleString()} USDC`);
  console.log(`✅ Estimated token1 in [-100, 100]: ${fullToken1.toLocaleString()} USDT`);
  console.log(`💰 TVL in range [-100, 100]: ${(fullToken0 + fullToken1).toLocaleString()} USD`);
}

// ✅ Export it for master script
module.exports = fetchActiveLiquidity;
