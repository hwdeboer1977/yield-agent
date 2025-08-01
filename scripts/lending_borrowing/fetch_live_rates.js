// ES5 imports
const { ChainId, UiPoolDataProvider } = require("@aave/contract-helpers");
const markets = require("@bgd-labs/aave-address-book");
const ethers = require("ethers");
require("dotenv").config();
const fs = require("fs");
const OUTPUT_FILE = "rates_output.txt";

// This script reads and stores the current supply and borrowing rate from AAVE
// For 3 chains (Ethereum, Base, Arbitrum) and 3 tokens (WETH, USDC, WBTC)
// It reads the rates from AAVE's smart contract so an API key is needed

// Tokens we care about
const TARGET_SYMBOLS = ["WETH", "USDC", "WBTC"];

// Alchemy API key
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;

// RPC providers per chain
const RPC = {
  [ChainId.mainnet]: new ethers.providers.JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  ),
  [ChainId.arbitrum_one]: new ethers.providers.JsonRpcProvider(
    "https://arb1.arbitrum.io/rpc"
  ),
  [ChainId.base]: new ethers.providers.JsonRpcProvider(
    `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  ),
}; 

// Aave markets we want to query
const CHAINS = [
  {
    name: "Ethereum",
    chainId: ChainId.mainnet,
    addresses: markets.AaveV3Ethereum,
  },
  {
    name: "Arbitrum",
    chainId: ChainId.arbitrum_one,
    addresses: markets.AaveV3Arbitrum,
  },
  {
    name: "Base",
    chainId: ChainId.base,
    addresses: markets.AaveV3Base,
  },
];

// Logging helper: prints to console and writes to file
function log(line = "") {
  console.log(line);
  fs.appendFileSync(OUTPUT_FILE, line + "\n");
}

async function fetchRates() {
  // Clear output file before writing
  fs.writeFileSync(OUTPUT_FILE, "");

  for (const chain of CHAINS) {
    const provider = RPC[chain.chainId];

    const poolDataProviderContract = new UiPoolDataProvider({
      uiPoolDataProviderAddress: chain.addresses.UI_POOL_DATA_PROVIDER,
      provider,
      chainId: chain.chainId,
    });

    const { reservesData } =
      await poolDataProviderContract.getReservesHumanized({
        lendingPoolAddressProvider: chain.addresses.POOL_ADDRESSES_PROVIDER,
      });

    log(`\n🌐 ${chain.name} — Aave V3`);

    for (const reserve of reservesData) {
      if (!TARGET_SYMBOLS.includes(reserve.symbol)) continue;

      const supplyAPR = (parseFloat(reserve.liquidityRate) / 1e27) * 100;
      const borrowAPR = (parseFloat(reserve.variableBorrowRate) / 1e27) * 100;

      log(`📊 ${reserve.symbol}`);
      log(`   ✅ Supply APR: ${supplyAPR.toFixed(2)}%`);
      log(`   ✅ Borrow APR: ${borrowAPR.toFixed(2)}%`);
    }
  }
}

fetchRates().catch(console.error);
