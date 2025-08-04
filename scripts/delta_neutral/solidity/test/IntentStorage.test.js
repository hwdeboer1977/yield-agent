const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IntentStorage", function () {
  let contract;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const IntentStorage = await ethers.getContractFactory("IntentStorage");
    contract = await IntentStorage.deploy();
    await contract.waitForDeployment();
  });

  it("should create an intent", async function () {
    const platform = 0; // Hyperliquid
    const coin = ethers.encodeBytes32String("ETH");
    const side = 0; // Long
    const size = 100;
    const minPrice = 3000;

    await contract
      .connect(user1)
      .createIntent(platform, coin, side, size, minPrice);

    const intent = await contract.getIntent(user1.address);
    expect(ethers.decodeBytes32String(intent.coin)).to.equal("ETH");
    expect(intent.side).to.equal(side);
    expect(intent.size).to.equal(size);
    expect(intent.minPrice).to.equal(minPrice);
    expect(intent.timestamp).to.be.gt(0);
  });

  it("should update an existing intent", async function () {
    const coin = ethers.encodeBytes32String("ETH");

    await contract.connect(user1).createIntent(0, coin, 0, 100, 3000);
    await contract.connect(user1).updateIntent(0, coin, 1, 200, 2500);

    const intent = await contract.getIntent(user1.address);
    expect(intent.side).to.equal(1); // Short
    expect(intent.size).to.equal(200);
    expect(intent.minPrice).to.equal(2500);
  });

  it("should clear an intent", async function () {
    const coin = ethers.encodeBytes32String("ETH");

    await contract.connect(user1).createIntent(0, coin, 0, 100, 3000);
    await contract.connect(user1).clearIntent();

    const intent = await contract.getIntent(user1.address);
    expect(intent.status).to.equal(0); // Inactive if enum Status { Inactive = 0, ... }
    expect(intent.timestamp).to.equal(0);
    expect(intent.size).to.equal(0);
  });
});
