require("dotenv").config(); // Load credentials from .env
const { Client } = require("pg");

// Create the client using env vars
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT),
}); 

// Run query to test database
async function runQuery() {
  try {
    await client.connect();

    // Example: Get latest USDC supply rate on Base
    const result = await client.query(`
      SELECT date, rate
      FROM aave_rates
      WHERE chain = 'base'
        AND asset = 'USDC'
        AND rate_type = 'supply'
      ORDER BY date DESC
      LIMIT 1;
    `);

    console.log("Latest Base USDC Supply Rate:", result.rows[0]);

    await client.end();
  } catch (err) {
    console.error("❌ Error querying database:", err.message);
  }
}

runQuery();
