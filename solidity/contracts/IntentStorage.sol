// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// IntentStorage
// Stores trade execution intents on-chain for execution by off-chain relayers (e.g., Hyperliquid/Drift)
contract IntentStorage {

    // Enum representing supported trading platforms
    enum Platform { Hyperliquid, Drift } 

    // Enum representing trade direction
    enum Side { Long, Short }

    // Enum representing intent lifecycle status
    enum Status { Inactive, Active, Executed, Cancelled }


    // Intent struct to store trade instruction metadata
    struct Intent {
        Platform platform;     // Trading platform (0 = Hyperliquid, 1 = Drift)
        bytes32 coin;          // Asset symbol (e.g., "ETH" encoded as bytes32)
        Side side;             // Direction (0 = Long, 1 = Short)
        uint256 size;          // Order size in base units
        uint256 minPrice;      // Minimum execution price user is willing to accept
        uint256 timestamp;     // Block timestamp when intent was created or updated
        Status status;         // Current status of the intent
    }

    // Mapping of user addresses to their most recent trade intent
    mapping(address => Intent) public intents;

    // Emitted when a new intent is created
    event IntentCreated(
        address indexed user,
        Platform platform,
        bytes32 coin,
        Side side,
        uint256 size,
        uint256 minPrice,
        uint256 timestamp
    );

    // Emitted when an existing intent is updated
    event IntentUpdated(
        address indexed user,
        Platform platform,
        bytes32 coin,
        Side side,
        uint256 size,
        uint256 minPrice,
        uint256 timestamp
    );

    // Emitted when an intent is cancelled (deleted)
    event IntentCancelled(address indexed user, uint8 platform, bytes32 coin);


    // Create a new trading intent
    // Overwrites any existing intent for msg.sender
    // platform Platform enum (0 = Hyperliquid, 1 = Drift)
    // Asset symbol encoded as bytes32 (e.g., "ETH")
    // Side enum (0 = Long, 1 = Short)
    // size Trade size
    // minPrice Minimum acceptable price for execution
    function createIntent(
        Platform platform,
        bytes32 coin,
        Side side,
        uint256 size,
        uint256 minPrice
    ) external {
        intents[msg.sender] = Intent({
            platform: platform,
            coin: coin,
            side: side,
            size: size,
            minPrice: minPrice,
            timestamp: block.timestamp,
            status: Status.Active
        });

        emit IntentCreated(msg.sender, platform, coin, side, size, minPrice, block.timestamp);
    }

    //  Update an existing active intent
    function updateIntent(
        Platform platform,
        bytes32 coin,
        Side side,
        uint256 size,
        uint256 minPrice
    ) external {
        require(intents[msg.sender].status == Status.Active, "No active intent to update");

        intents[msg.sender] = Intent({
            platform: platform,
            coin: coin,
            side: side,
            size: size,
            minPrice: minPrice,
            timestamp: block.timestamp,
            status: Status.Active
        });

        emit IntentUpdated(msg.sender, platform, coin, side, size, minPrice, block.timestamp);
    }

    // Clear the user's current intent
    function clearIntent() external {
        Intent memory intent = intents[msg.sender]; // Copy to memory before deleting

        require(intent.status == Status.Active, "No active intent to clear");

        emit IntentCancelled(msg.sender, uint8(intent.platform), intent.coin);

        delete intents[msg.sender];
    }

    // View a user's intent
    function getIntent(address user) external view returns (Intent memory) {
        return intents[user];
    }

    // Mark a user's intent as executed
    function markExecuted(address user) external {
        intents[user].status = Status.Executed;
    }
}
