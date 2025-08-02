const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const IntentStorage = await ethers.getContractFactory("IntentStorage");
  const contract = await IntentStorage.deploy();
  await contract.waitForDeployment();

  console.log("IntentStorage deployed at:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
