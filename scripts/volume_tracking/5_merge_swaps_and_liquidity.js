const fs = require("fs");
const path = require("path");

async function mergeLiquidityAndVolume(dateStr, {
  liquidityFile = `data/tick_liquidity_${dateStr}.csv`,
  volumeFile = `data/swap_volume_per_tick_${dateStr}.json`,
  outputFile = `data/combined_tick_data_${dateStr}.csv`,
} = {}) {
  // === Load swap volume per tick (JSON) ===
  const volumeData = JSON.parse(fs.readFileSync(volumeFile, "utf-8"));

  // === Load liquidity per tick (CSV) ===
  const liquidityCSV = fs.readFileSync(liquidityFile, "utf-8");
  const liquidityLines = liquidityCSV.trim().split("\n").slice(1); // skip header

  // === Parse CSV and merge ===
  const combinedData = [];

  for (const line of liquidityLines) {
    const [tick, liquidityGross, liquidityNet] = line.split(",");

    const volume = volumeData[tick] || 0;
    combinedData.push({
      tick,
      volumeUSD: volume.toFixed(2),
      liquidityGross,
      liquidityNet,
    });
  }

  // === Write to combined file ===
  const output = [
    "tick,volumeUSD,liquidityGross,liquidityNet",
    ...combinedData.map(
      (d) => `${d.tick},${d.volumeUSD},${d.liquidityGross},${d.liquidityNet}`
    ),
  ].join("\n");

  fs.writeFileSync(outputFile, output);
  console.log(`✅ Combined tick data saved to ${outputFile}`);
}

// ✅ Export the function for use in master_file.js
module.exports = mergeLiquidityAndVolume;
