
# 🏦 Aave Rates Tracker

This project collects and stores **Aave V3 lending/borrowing rates** across Ethereum, Arbitrum, and Base chains for selected assets (WETH, USDC, WBTC). It consists of three scripts:

---

## 📁 Scripts Overview

### 1. `fetch_live_aave_rates.js`
Fetches **live supply and borrow APRs** from the Aave V3 protocol using smart contract calls (no API needed beyond Alchemy RPC).

- ✅ Chains: Ethereum, Arbitrum, Base  
- ✅ Tokens: WETH, USDC, WBTC  
- 📤 Output: `rates_output.txt` (plaintext log of rates)

### 2. `fetch_past_aave_rates.js`
Downloads **historical APRs (past 90 days)** from AaveScan CSVs and stores them in a **PostgreSQL database** and an Excel file (`aave_rates.xlsx`).

- ✅ Sources: [aavescan.com](https://aavescan.com)
- ✅ DB Table: `aave_rates`
- 📦 Also exports to Excel for manual inspection

### 3. `query_aave_rates.js`
Runs a sample **PostgreSQL query**: shows the **latest Base USDC supply rate** from the local database.

---

## ⚙️ Setup

### ✅ Install dependencies

Run this at the project root:

```bash
npm install @aave/contract-helpers @bgd-labs/aave-address-book ethers dotenv pg node-fetch csv-parse exceljs
```

---

### ✅ Create `.env` file

Make a `.env` file in the project root:

```env
# Required for fetch_live_rates.js
ALCHEMY_API_KEY=your_alchemy_key_here

# Required for PostgreSQL
PGUSER=postgres
PGHOST=localhost
PGDATABASE=yield_agent
PGPASSWORD=your_postgres_password
PGPORT=5432
```

---

### ✅ Install PostgreSQL (if not yet installed)

Download and install from:  
👉 https://www.postgresql.org/download/

During setup:
- Use default port `5432`
- Set a password for the `postgres` user

Then create the required database:

```sql
-- From pgAdmin or `psql`
CREATE DATABASE yield_agent;
```

---

## 🧪 Run the scripts

### 🔹 Live APRs from Aave smart contracts:
```bash
node scripts/lending_borrowing/fetch_live_rates.js
```

### 🔹 Load past 90 days of AaveScan CSV data:
```bash
node scripts/lending_borrowing/load_aave_rates_past.js
```

### 🔹 Query the database (e.g. latest Base USDC rate):
```bash
node scripts/lending_borrowing/query_aave_rates.js
```

---

## 📌 Output

- `rates_output.txt` – Live APR snapshot (from `fetch_live_rates.js`)
- `aave_rates.xlsx` – Downloaded CSV data for all tokens and chains
- PostgreSQL DB table `aave_rates` – With columns:
  - `date`, `chain`, `asset`, `rate_type`, `rate`

---

## 📚 Example DB Query

```sql
SELECT * FROM aave_rates
WHERE asset = 'WETH' AND chain = 'arbitrum'
ORDER BY date DESC
LIMIT 10;
```

---

## 🛠 Future Extensions

- Scheduled runs with cron/Task Scheduler
- Add protocols such as **Morpho** and **Compound** 
- Script to monitor differences in rates across chains and/or protocols
- Integration with other DeFi protocols

---

## 🧑‍💻 Author

Built by [hwdeboer1977](https://github.com/hwdeboer1977)

---
