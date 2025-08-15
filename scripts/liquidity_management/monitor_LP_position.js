/********* IMPORTS *********/
// Core dependencies
const { ethers } = require("ethers");
require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("node:fs");
const JSBI = require("jsbi");
const { BigNumber } = require("ethers");

// Local files and ABIs
const ERC20ABI = require("./abis/abi.json");
const { getNonce } = require("./helpers"); // Optional helper for manual nonce handling

// ID LP position
const idLP = 4758139

/********* CONFIG *********/
// Environment & wallet settings
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const WALLET_ADDRESS = process.env.MY_WALLET2;

// Uniswap V3 Nonfungible Position Manager
const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

// RPC provider
const provider = new ethers.providers.JsonRpcProvider(
  process.env.ARBITRUM_ALCHEMY_MAINNET
);

// Load Uniswap ABIs
const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: INonfungiblePositionManagerABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json");
const { tickToPrice } = require("@uniswap/v3-sdk");

// Contract instance for position manager
const NonfungiblePositionContract = new ethers.Contract(
  positionManagerAddress,
  INonfungiblePositionManagerABI,
  provider
);

/********* UTILS *********/
// Fetch ETH/USD from Coingecko
async function getETHPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const data = await res.json();
  return data.ethereum.usd;
}

/********* MAIN FUNCTION *********/
// Analyze a given Uniswap V3 LP position and return earnings data
async function analyzePosition({
  positionId,
  poolAddress,
  positionManagerAddress,
  baseTokenSymbol,
  quoteTokenSymbol,
  baseTokenDecimals,
  quoteTokenDecimals,
  ethPrice,
}) {
  // Initialize contracts
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );
  const positionManager = new ethers.Contract(
    positionManagerAddress,
    INonfungiblePositionManagerABI,
    provider
  );

  // Get LP position data
  const position = await positionManager.positions(positionId);

  // Load token info
  const token0 = new ethers.Contract(position.token0, ERC20ABI, provider);
  const token1 = new ethers.Contract(position.token1, ERC20ABI, provider);
  const symbol0 = await token0.symbol();
  const symbol1 = await token1.symbol();
  const decimals0 = await token0.decimals();
  const decimals1 = await token1.decimals();

  // Pool state
  const slot0 = await poolContract.slot0();
  const tickCurrent = slot0.tick;

  // Liquidity & fee growth
  const liquidity = BigNumber.from(position.liquidity);
  const Q128 = BigNumber.from(2).pow(128);
  const tickLow = await poolContract.ticks(position.tickLower);
  const tickHigh = await poolContract.ticks(position.tickUpper);
  const feeGrowthGlobal0 = await poolContract.feeGrowthGlobal0X128();
  const feeGrowthGlobal1 = await poolContract.feeGrowthGlobal1X128();

  // Calculate fee growth inside position range
  const feeGrowthInside0 = feeGrowthGlobal0
    .sub(
      tickCurrent >= position.tickLower
        ? tickLow.feeGrowthOutside0X128
        : feeGrowthGlobal0.sub(tickLow.feeGrowthOutside0X128)
    )
    .sub(
      tickCurrent < position.tickUpper
        ? tickHigh.feeGrowthOutside0X128
        : feeGrowthGlobal0.sub(tickHigh.feeGrowthOutside0X128)
    );

  const feeGrowthInside1 = feeGrowthGlobal1
    .sub(
      tickCurrent >= position.tickLower
        ? tickLow.feeGrowthOutside1X128
        : feeGrowthGlobal1.sub(tickLow.feeGrowthOutside1X128)
    )
    .sub(
      tickCurrent < position.tickUpper
        ? tickHigh.feeGrowthOutside1X128
        : feeGrowthGlobal1.sub(tickHigh.feeGrowthOutside1X128)
    );

  // Compute uncollected fees
  const earned0 = liquidity
    .mul(feeGrowthInside0.sub(position.feeGrowthInside0LastX128))
    .div(Q128);
  const earned1 = liquidity
    .mul(feeGrowthInside1.sub(position.feeGrowthInside1LastX128))
    .div(Q128);

  // Convert to human-readable amounts
  const earned0Human = parseFloat(ethers.utils.formatUnits(earned0, decimals0));
  const earned1Human = parseFloat(ethers.utils.formatUnits(earned1, decimals1));

  // Assign base/quote earnings based on token symbol
  const isToken0Base = symbol0 === baseTokenSymbol;
  const baseEarned = isToken0Base ? earned0Human : earned1Human;
  const quoteEarned = isToken0Base ? earned1Human : earned0Human;

  // Price conversions
  const decimalsWETHBig = 10 ** 18; 
  const decimalsUSDCBig = 10 ** 6; 
  let tickPrice, baseUSD, quoteUSD;

  if (baseTokenSymbol === "USDC") {
    tickPrice =
      (Math.pow(1.0001, tickCurrent) * decimalsUSDCBig / decimalsWETHBig);
    baseUSD = 1;
    quoteUSD = tickPrice;
  } else if (baseTokenSymbol === "WETH") {
    tickPrice =
      (Math.pow(1.0001, tickCurrent) * decimalsWETHBig / decimalsUSDCBig);
    baseUSD = ethPrice;
    quoteUSD = baseUSD / tickPrice;
  }

  console.log("Tickprice: ", tickPrice);

  // Return report object
  return {
    pair: `${symbol0}/${symbol1}`,
    tickCurrent,
    currentPrice: tickPrice,
    earnedBase: baseEarned,
    earnedQuote: quoteEarned,
    earnedBaseUSD: baseEarned * baseUSD,
    earnedQuoteUSD: quoteEarned * quoteUSD,
  };
}

/********* RUN REPORTS *********/
// Loop through defined pools and print reports
async function runReports() {
  const ethPrice = await getETHPrice();
  console.log("ETH/USD:", ethPrice);

  const pools = [
    {
      label: "USDC/WETH",
      positionId: idLP,
      poolAddress: "0xc6962004f452be9203591991d15f6b388e09e8d0",
      baseTokenSymbol: "WETH",
      quoteTokenSymbol: "USDC",
      baseTokenDecimals: 18,
      quoteTokenDecimals: 6,
    },
    // Additional pools can be added here
  ];

  for (const pool of pools) {
    const report = await analyzePosition({
      ...pool,
      positionManagerAddress,
      ethPrice,
    });
    console.log(`\n🧾 ${pool.label} Report:`, report);
  }
}

// Execute script
runReports();
