require("dotenv").config({ path: "../.env" });
require("@nomicfoundation/hardhat-toolbox");

const { ARBITRUM_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

if (!ARBITRUM_RPC_URL || !PRIVATE_KEY) {
  console.warn("⚠️  Missing ARBITRUM_RPC_URL or PRIVATE_KEY in .env");
}

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    arbitrum: {
      url: ARBITRUM_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: ETHERSCAN_API_KEY || "",
    },
  },
};
