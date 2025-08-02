const { ethers } = require("hardhat");

// The contract has been tested on local testnet first:
// 1. Run hardhat node: npx hardhat node
// 2. deploy contract: npx hardhat run scripts/deploy.js --network localhost

// Next the contract has been deployed on Arbitrum's mainnet
// 1. Create an .env file
// 2. deploy contract with: npx hardhat run scripts/deploy.js --network arbitrum
// 3. Verify on arbiscan: npx hardhat verify --network arbitrum 0x4988BCB69356B55b3Eb645Cc27F54A2B625dA43B

async function main() {
  const IntentStorage = await ethers.getContractFactory("IntentStorage");
  const contract = await IntentStorage.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed to:", contract.target); // ethers v6
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
