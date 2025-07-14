require("dotenv").config();
const { Client } = require("pg");
const { OpenAI } = require("openai");

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchRates() {
  await client.connect();

  const res = await client.query(`
    SELECT date, chain, asset, rate_type, rate
    FROM aave_rates
    WHERE asset = 'USDC' AND rate_type = 'supply'
    ORDER BY date DESC
    LIMIT 30;
  `);

  await client.end();
  return res.rows;
}

async function askLLM(data) {
  const summaryPrompt = `
Here is a 30-day history of USDC supply rates from Aave:

${JSON.stringify(data, null, 2)}

Please analyze this data and provide:
- any trends or anomalies,
- possible reasons,
- DeFi strategy suggestions based on these rates.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a DeFi strategist and data analyst.",
      },
      { role: "user", content: summaryPrompt },
    ],
    temperature: 0.7,
  });

  console.log("\n💡 GPT-4 Analysis:\n");
  console.log(response.choices[0].message.content);
}

(async () => {
  const rateData = await fetchRates();
  await askLLM(rateData);
})();
