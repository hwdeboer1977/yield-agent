const { Client } = require("pg");
const fetch = require("node-fetch");
const { parse } = require("csv-parse/sync");
const ExcelJS = require("exceljs");
require("dotenv").config();

// PostgreSQL client
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT),
});

// This script automatically reads and stores historical data of the past 90 days
// For more historical data a paid plan is needed

// Map of [filenameKey]: [chain, asset, CSV_URL]
const FILES = {
  "ethereum-usdc": [
    "ethereum",
    "USDC",
    "https://aavescan.com/ethereum-v3/usdc/daily-snapshots-aave-v3-ethereum.csv",
  ],
  "ethereum-wbtc": [
    "ethereum",
    "WBTC",
    "https://aavescan.com/ethereum-v3/wbtc/daily-snapshots-aave-v3-ethereum.csv",
  ],
  "ethereum-weth": [
    "ethereum",
    "WETH",
    "https://aavescan.com/ethereum-v3/weth/daily-snapshots-aave-v3-ethereum.csv",
  ],
  "arbitrum-usdc": [
    "arbitrum",
    "USDC",
    "https://aavescan.com/arbitrum-v3/usdc/daily-snapshots-aave-v3-arbitrum.csv",
  ],
  "arbitrum-wbtc": [
    "arbitrum",
    "WBTC",
    "https://aavescan.com/arbitrum-v3/wbtc/daily-snapshots-aave-v3-arbitrum.csv",
  ],
  "arbitrum-weth": [
    "arbitrum",
    "WETH",
    "https://aavescan.com/arbitrum-v3/weth/daily-snapshots-aave-v3-arbitrum.csv",
  ],
  "base-usdc": [
    "base",
    "USDC",
    "https://aavescan.com/base-v3/usdc/daily-snapshots-aave-v3-base.csv",
  ],
  "base-weth": [
    "base",
    "WETH",
    "https://aavescan.com/base-v3/weth/daily-snapshots-aave-v3-base.csv",
  ],
  "base-cbbtc": [
    "base",
    "cbBTC",
    "https://aavescan.com/base-v3/cbbtc/daily-snapshots-aave-v3-base.csv",
  ],
}; 

// Helper: Convert "3,56" to 3.56
const parseFloatComma = (val) =>
  typeof val === "string" ? parseFloat(val.replace(",", ".")) : parseFloat(val);

// Main function
async function insertRatesFromAaveScan() {
  const workbook = new ExcelJS.Workbook(); // New Excel workbook

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS aave_rates (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      chain TEXT NOT NULL,
      asset TEXT NOT NULL,
      rate_type TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      source TEXT DEFAULT 'aavescan',
      UNIQUE(date, chain, asset, rate_type)
    );
  `);

  for (const [key, [chain, asset, url]] of Object.entries(FILES)) {
    try {
      const res = await fetch(url);
      const text = await res.text();

      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });

      const sheet = workbook.addWorksheet(`${chain}-${asset}`);
      sheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Chain", key: "chain", width: 10 },
        { header: "Asset", key: "asset", width: 10 },
        { header: "Rate Type", key: "rate_type", width: 10 },
        { header: "Rate", key: "rate", width: 10 },
      ];

      for (const row of records) {
        if (
          !row.date ||
          typeof row.date !== "string" ||
          !row.date.includes("T")
        )
          continue;

        const date = row.date.split("T")[0];
        const supply = parseFloatComma(row["supply APR"]);
        const borrow = parseFloatComma(row["borrow APR"]);

        if (isNaN(supply) || isNaN(borrow)) continue;

        for (const [rate_type, rate] of [
          ["supply", supply],
          ["borrow", borrow],
        ]) {
          // Insert into PostgreSQL
          try {
            await client.query(
              `
              INSERT INTO aave_rates (date, chain, asset, rate_type, rate)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (date, chain, asset, rate_type) DO NOTHING;
            `,
              [date, chain, asset, rate_type, rate]
            );
          } catch (err) {
            console.error(
              `❌ DB insert error: ${date} ${chain} ${asset} ${rate_type}:`,
              err.message
            );
          }

          // Add to Excel sheet
          sheet.addRow({
            date,
            chain,
            asset,
            rate_type,
            rate,
          });
        }
      }

      console.log(`✅ Processed CSV for: ${chain.toUpperCase()} ${asset}`);
    } catch (e) {
      console.error(`❌ Failed to process: ${url}`, e.message);
    }
  }

  await client.end();
  const dateStr = new Date().toISOString().slice(0, 10); // e.g., '2025-08-03'
  await workbook.xlsx.writeFile(`data/aave_rates_${dateStr}.xlsx`);
  console.log("📁 Excel file saved: data.aave_rates.xlsx");
  console.log("🚀 All done!");
}

insertRatesFromAaveScan();
