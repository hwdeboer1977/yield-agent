# 🧠 Yield Agent – Uniswap V3 Tick-Level Fee Analyzer

This project is a modular, script-based pipeline to analyze liquidity and swap volume per tick in a Uniswap V3 pool, and estimate swap fee earnings over a given range.

---

## 📦 Project Structure

Each step is implemented as a standalone script and called in sequence from `runAll()` in the master file.

```
.
├── 1_agg_info_pool.js              # Fetch general pool metadata (token info, decimals, tick spacing, fee tier)
├── 2_liquidity_per_tick.js        # Fetch tick-level gross/net liquidity from the pool
├── 3_active_liquidity_per_tick.js # Identify current active tick and liquidity
├── 4_swapEvents_per_tick.js       # Fetch 24h swap volume and map to tick bins
├── 5_merge_swaps_and_liquidity.js # Merge liquidity and swap data per tick
├── 6_fees_per_tick.js             # Calculate estimated fees per tick using volume * fee%
└── master_file.js                      # Master script to run the full pipeline
```

---

## 🧪 Prerequisites

- Node.js (v18+ recommended)
- An `.env` file with access credentials (e.g., RPC provider)
- Install dependencies:

```bash
npm install
```

---

## ▶️ How to Run

Run the full pipeline with:

```bash
node master_file.js
```

Output files (e.g. `data/fees_2025-08-04.csv`) will be generated per date.

---

## 🧠 What Each Step Does

| Step | File | Description |
|------|------|-------------|
| 1 | `1_agg_info_pool.js` | Fetch pool config (tick spacing, token decimals, fee tier) |
| 2 | `2_liquidity_per_tick.js` | Load full tick bitmap, compute liquidityGross/liquidityNet per tick |
| 3 | `3_active_liquidity_per_tick.js` | Fetch slot0 tick and calculate current active range |
| 4 | `4_swapEvents_per_tick.js` | Get recent swap volume and map swaps to their executed ticks |
| 5 | `5_merge_swaps_and_liquidity.js` | Merge swap + liquidity data into a single CSV for analysis |
| 6 | `6_fees_per_tick.js` | Estimate swap fees per tick using `volumeUSD * feeRate` |

---

## 📁 Output Example

You will find:

- `data/liquidity_2025-08-04.json`
- `data/swaps_2025-08-04.json`
- `data/combined_tick_data_2025-08-04.csv`
- `data/fees_2025-08-04.csv`

Each output file is time-stamped and can be used for time-series analysis or fee forecasting.

---

## ⚠️ Notes

- The fee rate is currently hardcoded in `6_fees_per_tick.js` (e.g., `0.001` for 0.1%). Adjust it based on pool tier (500, 3000, 10000).
- This agent assumes swaps are dense enough to compute meaningful volume estimates per tick. Thinly traded pools may have many ticks with zero volume.
- If using The Graph or RPC rate-limited services, consider batching or throttling requests.

---

## 🛠 Future Extensions

- TVL-weighted APR per tick
- Interactive visualization of fee curves
- Historical swap + fee aggregation
- Integration with AI yield agent

---

## 🧑‍💻 Author

Built by [hwdeboer1977](https://github.com/hwdeboer1977)

---

