// Import required modules
const { Client } = require("pg"); // PostgreSQL client
const xlsx = require("xlsx"); // For reading Excel files
const path = require("path"); // For file path operations
const fs = require("fs"); // File system module (not used here, but commonly included)
require("dotenv").config();

// PostgreSQL connection config
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT),
});

// Folder containing historical Excel files
const FILE_DIR = "C:/Users/hwdeb/Documents/Nethermind/Yield_agent/Aave_90days";

// Mapping of each filename to its respective chain and asset
const FILE_MAP = {
  "aavescan-aave-v3-ethereum-usdc-history.xlsx": ["ethereum", "USDC"],
  "aavescan-aave-v3-ethereum-wbtc-history.xlsx": ["ethereum", "WBTC"],
  "aavescan-aave-v3-ethereum-weth-history.xlsx": ["ethereum", "WETH"],
  "aavescan-aave-v3-arbitrum-usdc-history.xlsx": ["arbitrum", "USDC"],
  "aavescan-aave-v3-arbitrum-wbtc-history.xlsx": ["arbitrum", "WBTC"],
  "aavescan-aave-v3-arbitrum-weth-history.xlsx": ["arbitrum", "WETH"],
  "aavescan-aave-v3-base-cbbtc-history.xlsx": ["base", "cbBTC"],
  "aavescan-aave-v3-base-usdc-history.xlsx": ["base", "USDC"],
  "aavescan-aave-v3-base-weth-history.xlsx": ["base", "WETH"],
};

// Helper function to handle comma as decimal (e.g. "3,56" → 3.56)
const parseFloatComma = (val) =>
  typeof val === "string" ? parseFloat(val.replace(",", ".")) : parseFloat(val);

// Main function to load and insert rates into PostgreSQL
async function insertRates() {
  // Connect to the PostgreSQL database
  await client.connect();

  // Create the aave_rates table if it doesn't exist yet
  await client.query(`
    CREATE TABLE IF NOT EXISTS aave_rates (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      chain TEXT NOT NULL,
      asset TEXT NOT NULL,
      rate_type TEXT NOT NULL,         -- 'supply' or 'borrow'
      rate NUMERIC NOT NULL,           -- the actual rate
      source TEXT DEFAULT 'aavescan',  -- data source (optional)
      UNIQUE(date, chain, asset, rate_type) -- prevent duplicates
    );
  `);

  // Loop through all files and extract/insert data
  for (const [filename, [chain, asset]] of Object.entries(FILE_MAP)) {
    const filePath = path.join(FILE_DIR, filename); // full file path
    const workbook = xlsx.readFile(filePath); // read the Excel file
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // get first sheet
    const data = xlsx.utils.sheet_to_json(sheet); // convert to JSON

    for (const row of data) {
      // Skip invalid header or non-date rows
      if (!row.date || typeof row.date !== "string" || !row.date.includes("T"))
        continue;

      const date = row.date.split("T")[0]; // extract date only
      const supply = parseFloatComma(row["supply APR"]); // parse supply APR
      const borrow = parseFloatComma(row["borrow APR"]); // parse borrow APR

      if (isNaN(supply) || isNaN(borrow)) continue; // skip malformed numbers

      // Insert both supply and borrow rates
      for (const [rate_type, rate] of [
        ["supply", supply],
        ["borrow", borrow],
      ]) {
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
            `❌ Error inserting ${date} ${chain} ${asset} ${rate_type}:`,
            err.message
          );
        }
      }
    }

    // Log successful file processing
    console.log(`✅ Inserted data from: ${filename}`);
  }

  // Close the database connection
  await client.end();
  console.log("🚀 All done!");
}

// Start the script
insertRates();
