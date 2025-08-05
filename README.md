# 🤖 Yield Agent – Rule-Based Yield Optimizer

This project implements a **modular, rule-based yield agent** that performs DeFi strategy optimization across lending protocols (Aave), AMM pools (Uniswap V3), and delta-neutral positions. It is designed for **stepwise automation**, with a roadmap to evolve into a fully **autonomous AI agent**.

---

## 🔧 Project Structure

```
yield-agent-main/
├── scripts/
│   ├── lending_borrowing/         # Tracking APRs on lending/borrowwing protocols (live + historical)
│   ├── volume_tracking/           # LP fee estimation via tick-level liquidity and volume
│   ├── liquidity_management/      # Manage LP positions: initialize, monitor, rebalance
│   └── delta_neutral/             # Delta neutral system for hedging LP exposure
├── utils/                         # Additional analysis scripts
├── abis/                          # ABIs for Ethereum contracts
└── README.md                      # ← You are here
```

---

## 🧠 Components Overview

### 1. 🏦 Lending & Borrowing

**Folder:** `scripts/lending_borrowing/`

Tracks lending and borrowing rates across DeFi protocols to identify capital-efficient opportunities for yield farming, collateralized strategies, or leveraged LP positions.

Currently supports:
- **Aave V3** on Ethereum, Arbitrum, and Base
- Tokens: **WETH**, **USDC**, **WBTC**

Planned additions:
- **Morpho**
- **Compound V3**
- Other lending markets

**Scripts:**
- `fetch_live_aave_rates.js` – Fetches live APRs from Aave V3 smart contracts
- `fetch_past_aave_rates.js` – Loads historical APR data from AaveScan and stores it in PostgreSQL and Excel
- `query_aave_rates.js` – Queries the local rate database for analytics and strategy selection
- `monitor_rates.js` – Compares lending/borrowing rates across protocols and chains to detect arbitrage or optimization opportunities (work in progress)

> 💡 This module will evolve into a unified rate oracle that compares real-time lending and borrowing yields across multiple DeFi platforms.


### 2. 💸 LP Fee Estimation (Uniswap V3)

**Folder:** `scripts/volume_tracking/`

Estimates yield from swap fees by analyzing **tick-level liquidity and volume** in Uniswap V3 pools. This module provides granular insight into fee-generating zones and helps evaluate the performance of liquidity positions.

**Scripts:**
- `1_agg_info_pool.js` – Fetches pool metadata (token info, decimals, tick spacing, fee tier)
- `2_liquidity_per_tick.js` – Retrieves gross/net liquidity per tick from the pool
- `3_active_liquidity_per_tick.js` – Determines the active tick range and filters relevant liquidity
- `4_swapEvents_per_tick.js` – Parses recent swaps and assigns them to tick bins
- `5_merge_swaps_and_liquidity.js` – Merges swap volume and liquidity data per tick
- `6_fees_per_tick.js` – Computes estimated fees using `volumeUSD * feeTier`

**Planned extensions:**
- 🧠 Fee-based APR estimation per tick or range
- 📈 LP strategy simulation and backtesting
- 🔁 Multi-day or rolling window fee tracking
- 🌐 Support for other AMMs:
  - **PancakeSwap V3** (BNB Chain, Base)
  - **Orca Whirlpools** (Solana)
  - **Uniswap V4** and **Hooks** 

> 💡 This module will evolve into a cross-DEX fee oracle, enabling optimal LP placement, strategy backtesting, and real-time APR estimation.


### 3. 🔄 LP Position Management

**Folder:** `scripts/liquidity_management/`

Tracks and manages active liquidity positions in Uniswap V3 pools, with **automated rebalancing**. The goal is to maintain optimal liquidity placement based on price movement, volume trends, and fee yield projections.

**Scripts:**
- `initialize_LP_position.js` – Adds new LP positions to selected tick ranges (currently being integrated)
- `monitor_LP_position.js` – Monitors if a position is in range and triggers alerts or rebalance logic (currently being integrated)
- `overview_LP_positon.js` – Displays LP metrics such as current tick, liquidity, unclaimed fees, and position health (currently being integrated)

**Planned extensions:**
- 🧠 Auto-rebalancing logic triggered by price deviation or fee drop-off
- 📊 Historical performance tracking per LP position
- 🔄 Strategy switching (e.g. range shift, withdrawal, reinvestment)
- 🌐 Support for additional AMMs:
  - **PancakeSwap V3**
  - **Uniswap V4 (Hooks)**
  - **Orca Whirlpools** (via SDK on Solana)

> 💡 This module will evolve into a fully autonomous LP management engine that monitors, rebalances, and rotates LP positions based on real-time market conditions.


### 4. 🧪 Delta Neutral Strategy (RelayNet)

**Folder:** `scripts/delta_neutral/`

Implements a modular **intent-based execution system** to hedge LP exposure or take directional positions based on predefined trading logic. Combines **on-chain intent storage** with an **off-chain execution relayer**.

**Currently live on:**
- **Hyperliquid (Arbitrum)** – supports directional intents such as long/short USDC/ETH

**Core components:**
- 🧾 **Smart contract:** `IntentStorage.sol` – Stores trading intents on-chain using enums and minimal storage
- 🤖 **Off-chain relayer:** `relayer.py` – Listens for emitted events and executes/cancels trades based on on-chain state
- 🛠 **CLI tool:** `createIntent.py` – Command-line utility to create, update, delete, or check intents

📦 **How it works:**
1. Create trading intent → Store on-chain (`createIntent.py`)
2. Event emitted → Off-chain relayer listens and executes trade (`relayer.py`)

📂 Key files:
- `createIntent.py`
- `relayer.py`
- `IntentStorage.sol`


**Planned extensions:**
- 🌐 Cross-chain deployment (e.g. Base, Optimism, Solana via Wormhole)
- 🔁 Support for more platforms:
  - **Drift** (Solana)
  - **Vertex** (Arbitrum)
  - **Aevo** (Ethereum)
- 🔒 Multi-intent and failover execution logic
- 🧠 Agent-based dynamic intent creation based on market conditions

> 💡 This system forms the foundation for an **autonomous hedging layer**, enabling delta-neutral strategies in response to LP risk, price volatility, or yield shifts across chains.


---

## 🚀 Roadmap Toward Autonomy

This project is the foundation for a **self-optimizing yield agent**, with future improvements:

- ✅ Rule-based execution (current)
- 🔄 Dynamic triggers from live price feeds
- 🧠 Agent decision engine (planned)
- 📈 Real-time dashboards (future frontend)

---

## 📚 Setup

To get started, review the individual `README.md` files inside each folder for module-specific instructions, dependencies, and environment setup.

```bash
# Navigate into each subfolder and follow the README instructions:
cd scripts/lending_borrowing/
cat README.md

cd scripts/volume_tracking/
cat README.md

cd scripts/liquidity_management/
cat README.md

cd scripts/delta_neutral/
cat readme.MD  # note: lowercase extension

# Most modules require .env variables, RPC endpoints, and/or PostgreSQL setup
```

## 🧑‍💻 Author

Built by [hwdeboer1977](https://github.com/hwdeboer1977)  
Part of a broader mission to create **modular, intelligent agents for DeFi**.

---
