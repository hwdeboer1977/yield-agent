# 🛠 Yield Agent – Solidity Contracts

This folder contains the Solidity smart contracts for the **Yield Agent** system. It uses the [Hardhat](https://hardhat.org) development environment for compiling, testing, and deploying smart contracts.

---

## 📦 Folder Structure

```
solidity/
├── contracts/         # Solidity smart contracts (e.g., IntentStorage.sol)
├── scripts/           # Deployment scripts (e.g., deploy.js, deploy_testnet.js)
├── test/              # JavaScript test files using Hardhat + Mocha/Chai
├── hardhat.config.js  # Hardhat setup and network config
├── .env               # Environment variables (RPC endpoints, private key)
├── package.json       # Node project configuration
```

---

## 🚀 Getting Started

### 1. Install dependencies

First, navigate to the `solidity/` folder and install required packages:

```bash
cd solidity
npm install
```

This will install Hardhat and essential plugins like:

- `hardhat`
- `@nomicfoundation/hardhat-toolbox`
- `dotenv`
- `chai`
- `ethers`

---

### 2. Environment setup

Create a `.env` file in the root of the project (i.e. `yield-agent/.env`) with the following content:

```ini
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

> 🔐 **Never commit your `.env` file to version control.** It contains sensitive data like private keys and API keys.

---

### 3. Compile contracts

Run the following command to compile your smart contracts:

```bash
npx hardhat compile
```

---

### 4. Run tests

To run the test suite:

```bash
npx hardhat test
```

Optionally include gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

---

### 5. Deploy to network

You can deploy your contracts using a Hardhat script, e.g.:

```bash
npx hardhat run scripts/deploy.js --network arbitrum
```

Ensure your `.env` file is correctly configured with RPC URL and private key before deploying.

---

## ✅ Contracts

Located in the `contracts/` folder.

### `IntentStorage.sol`

Stores user trading intents on-chain to be executed by off-chain relayers. Key features include:

- Platform enum (Hyperliquid, Drift)
- Side enum (Long, Short)
- Status enum (Inactive, Active, Executed, Cancelled)
- Struct-based storage of intent metadata
- Functions: `createIntent`, `getIntent`, `updateIntent`, `clearIntent`

---

## 🧪 Tests

Located in `test/`.

### `IntentStorage.test.js`

Unit test suite validating:

- Creation of new intents
- Structure and correctness of intent data
- Integration of enums and bytes32 asset identifiers

Frameworks used:

- Mocha (test runner)
- Chai (assertions)
- Ethers.js (contract interaction)

---

## 📜 Scripts

Located in `scripts/`.

- `deploy.js` – deploys contracts locally
- `deploy_testnet.js` – deploys contracts to a configured testnet (e.g., Arbitrum)

Update these scripts to suit your deployment needs (e.g., add constructor arguments).

---

## 📚 References

- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js Docs](https://docs.ethers.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Alchemy RPC Setup](https://dashboard.alchemy.com/)

---

## 👤 Author

**Henk Wim de Boer**  
GitHub: [@hwdeboer1977](https://github.com/hwdeboer1977)

---

## 📄 License

MIT License  
© 2025 Henk Wim de Boer
