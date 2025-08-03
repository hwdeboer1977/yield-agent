const { ethers } = require("ethers");
require("dotenv").config();

const POOL_ADDRESS = "0x3416cf6c708da44db2624d63ea0aaef7113527c6"; // USDC/USDT 0.01%
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const POOL_ABI = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);

// ✅ Exported function for use in master script
module.exports = async function fetchAggInfo() {
  const token0 = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const token1 = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

  const [symbol0, symbol1] = await Promise.all([
    token0.symbol(),
    token1.symbol(),
  ]);

  const [decimals0, decimals1] = await Promise.all([
    token0.decimals(),
    token1.decimals(),
  ]);

  const [balance0, balance1] = await Promise.all([
    token0.balanceOf(POOL_ADDRESS),
    token1.balanceOf(POOL_ADDRESS),
  ]);

  const { tick } = await pool.slot0();

  const token0Amount = Number(ethers.utils.formatUnits(balance0, decimals0));
  const token1Amount = Number(ethers.utils.formatUnits(balance1, decimals1));

  console.log(`💰 ${symbol0}: ${token0Amount.toLocaleString()}`);
  console.log(`💰 ${symbol1}: ${token1Amount.toLocaleString()}`);
  console.log(`📈 Current Tick: ${tick}`);
};
