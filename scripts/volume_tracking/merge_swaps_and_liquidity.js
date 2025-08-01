const fs = require("fs");
const path = require("path");

// === Load swap volume per tick (JSON) ===
const volumeData = JSON.parse(
  fs.readFileSync("swap_volume_per_tick.json", "utf-8")
);

// === Load liquidity per tick (CSV) ===
const liquidityCSV = fs.readFileSync("tick_liquidity.csv", "utf-8");
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

fs.writeFileSync("combined_tick_data.csv", output);
console.log("✅ Combined tick data saved to combined_tick_data.csv");
