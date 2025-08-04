// 6_fees_per_tick.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { parse } = require("json2csv");

async function fetchFees(dateStr) {
  const inputPath = `data/combined_tick_data_${dateStr}.csv`;
  const outputPath = `data/fees_${dateStr}.csv`;

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    return;
  }

  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csv())
        .on("data", (row) => {
        const tick = parseInt(row.tick);
        const swapVolumeUSD = parseFloat((row.volumeUSD || "0").replace(/,/g, ""));

        // 0.01% fee tier
        const feeRate = 0.0001;
        const feeUSD = swapVolumeUSD * feeRate;

        results.push({
            tick,
            swapVolumeUSD: swapVolumeUSD.toFixed(2),
            estimatedFeeUSD: feeUSD.toFixed(6),
        });
        })
      .on("end", () => {
        const csvOutput = parse(results, { fields: ["tick", "swapVolumeUSD", "estimatedFeeUSD"] });
        fs.writeFileSync(outputPath, csvOutput);
        console.log(`✅ Fees written to ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ Error reading CSV:", err);
        reject(err);
      });
  });
}

module.exports = fetchFees;
