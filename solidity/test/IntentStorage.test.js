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
    await contract.connect(user1).createIntent("ETH", "LONG", 100, 3000);

    const intent = await contract.getIntent(user1.address);
    expect(intent.coin).to.equal("ETH");
    expect(intent.side).to.equal("LONG");
    expect(intent.size).to.equal(100);
    expect(intent.minPrice).to.equal(3000);
    expect(intent.timestamp).to.be.gt(0);
  });

  it("should update an existing intent", async function () {
    await contract.connect(user1).createIntent("ETH", "LONG", 100, 3000);
    await contract.connect(user1).createIntent("ETH", "SHORT", 200, 2500);

    const intent = await contract.getIntent(user1.address);
    expect(intent.side).to.equal("SHORT");
    expect(intent.size).to.equal(200);
    expect(intent.minPrice).to.equal(2500);
  });

  it("should clear an intent", async function () {
    await contract.connect(user1).createIntent("ETH", "LONG", 100, 3000);
    await contract.connect(user1).clearIntent();

    const intent = await contract.getIntent(user1.address);
    expect(intent.coin).to.equal("");
    expect(intent.side).to.equal("");
    expect(intent.size).to.equal(0);
    expect(intent.minPrice).to.equal(0);
  });
});
