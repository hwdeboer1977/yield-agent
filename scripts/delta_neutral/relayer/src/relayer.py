import os
import json
import time
import logging
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
from hyperliquid.utils import constants
import example_utils

# ------------------------------
# Basic Setup and Logging
# ------------------------------

# Set up logging with timestamp and log level
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Load environment variables from .env file
load_dotenv()

# Check if all required env vars are present
REQUIRED_ENV_VARS = ["RPC_URL", "PRIVATE_KEY", "CONTRACT_ADDRESS"]
for var in REQUIRED_ENV_VARS:
    if not os.getenv(var):
        raise EnvironmentError(f"Missing required environment variable: {var}")

# Load config from .env
RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Initialize Web3 provider
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = Account.from_key(PRIVATE_KEY)

# Load the contract ABI
with open("src/abis/abi.json", "r") as file:
    abi = json.load(file)

# Initialize contract instance
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)

# Track last processed block to avoid duplicates
last_block = w3.eth.block_number

# Maintain set of processed tx hashes to avoid replaying the same event
processed_tx_hashes = set()

# ------------------------------
# Helper Functions
# ------------------------------

# Decode bytes32 strings (padded with null characters) to clean text
def decode_bytes32(value):
    return value.rstrip(b"\x00").decode("utf-8")

# Setup Hyperliquid clients (wallet, account info, and exchange API)
def get_hyperliquid_clients():
    return example_utils.setup(base_url=constants.MAINNET_API_URL, skip_ws=True)

# ------------------------------
# Hyperliquid Actions
# ------------------------------

# Submit a new market order to Hyperliquid
def submit_hyperliquid_order(coin, side, size, min_price):
    logging.info(f"Submitting market order for {coin}...")
    try:
        _, _, exchange = get_hyperliquid_clients()
        is_buy = (side == 0)
        sz = float(Web3.from_wei(size, "ether"))
        px = float(Web3.from_wei(min_price, "ether"))

        result = exchange.market_open(coin, is_buy, sz, None, 0.01)

        if result["status"] == "ok":
            for status in result["response"]["data"]["statuses"]:
                if "filled" in status:
                    filled = status["filled"]
                    logging.info(f"Filled: {filled['totalSz']} {coin} at avg {filled['avgPx']}")
                elif "error" in status:
                    logging.warning(f"Order error: {status['error']}")
        else:
            logging.error(f"Order failed: {result}")
    except Exception as e:
        logging.exception(f"Error submitting order for {coin}: {e}")

# Cancel open market position or resting order for the coin
def submit_hyperliquid_cancel(coin):
    logging.info(f"Submitting cancel for {coin}...")
    try:
        _, info, exchange = get_hyperliquid_clients()
        result = exchange.market_close(coin)

        if result["status"] == "ok":
            status = result["response"]["data"]["statuses"][0]
            if "resting" in status:
                oid = status["resting"]["oid"]
                cancel_result = exchange.cancel(coin, oid)
                logging.info(f"Cancelled resting order: {cancel_result}")
            elif "filled" in status:
                filled = status["filled"]
                logging.info(f"Market close filled {filled['totalSz']} @ {filled['avgPx']}")
            else:
                logging.warning("No resting or filled order found in status.")
        else:
            logging.error(f"Market close failed: {result}")
    except Exception as e:
        logging.exception(f"Error cancelling {coin}: {e}")

# Cancel any open position and submit updated one
def submit_hyperliquid_update(coin, side, size, min_price):
    logging.info(f"Updating Hyperliquid order for {coin}...")
    try:
        _, info, exchange = get_hyperliquid_clients()
        open_positions = info.get("openPositions", [])
        position = next((p for p in open_positions if p["coin"] == coin), None)

        if position:
            logging.info(f"Closing existing position for {coin}...")
            close_result = exchange.market_close(coin)
            logging.info(f"Market close result: {close_result}")

        submit_hyperliquid_order(coin, side, size, min_price)
    except Exception as e:
        logging.exception(f"Error updating intent for {coin}: {e}")

# ------------------------------
# Event Handlers
# ------------------------------

# Handle new intent created
def handle_intent_created(event):
    if event["transactionHash"].hex() in processed_tx_hashes:
        return
    processed_tx_hashes.add(event["transactionHash"].hex())

    args = event["args"]
    coin = decode_bytes32(args["coin"])
    logging.info(f"New Intent Created by {args['user']} → {coin}")
    if args["platform"] == 0:
        submit_hyperliquid_order(coin, args["side"], args["size"], args["minPrice"])

# Handle intent update
def handle_intent_updated(event):
    if event["transactionHash"].hex() in processed_tx_hashes:
        return
    processed_tx_hashes.add(event["transactionHash"].hex())

    args = event["args"]
    coin = decode_bytes32(args["coin"])
    logging.info(f"Intent Updated by {args['user']} → {coin}")
    if args["platform"] == 0:
        submit_hyperliquid_update(coin, args["side"], args["newSize"], args["newMinPrice"])

# Handle intent cancellation
def handle_intent_cleared(event):
    if event["transactionHash"].hex() in processed_tx_hashes:
        return
    processed_tx_hashes.add(event["transactionHash"].hex())

    args = event["args"]
    coin = decode_bytes32(args["coin"])
    logging.info(f"Intent Cancelled by {args['user']} → {coin}")
    if args["platform"] == 0:
        submit_hyperliquid_cancel(coin)

# ------------------------------
# Main Loop
# ------------------------------

def main():
    global last_block
    logging.info("Relayer is listening for intents...")

    try:
        while True:
            latest_block = w3.eth.block_number
            if latest_block > last_block:
                # Process all new blocks since last seen
                for log in contract.events.IntentCreated().get_logs(from_block=last_block + 1, to_block=latest_block):
                    handle_intent_created(log)

                for log in contract.events.IntentUpdated().get_logs(from_block=last_block + 1, to_block=latest_block):
                    handle_intent_updated(log)

                for log in contract.events.IntentCancelled().get_logs(from_block=last_block + 1, to_block=latest_block):
                    handle_intent_cleared(log)

                last_block = latest_block

            time.sleep(3)

    except KeyboardInterrupt:
        logging.info("Relayer stopped by user.")

# Entry point
if __name__ == "__main__":
    main()
