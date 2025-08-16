exports.getPoolImmutables = async (poolContract) => {
    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee()
    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee
    }
    return immutables
  }
  
  exports.getPoolState = async (poolContract) => {
    const slot = poolContract.slot0()
  
    const state = {
      sqrtPriceX96: slot[0]
    }
  
    return state
  }

  // Pending nonce helper with optional offset (for batching/concurrency)
exports.getNonce = async (provider, walletAddress, offset = 0) => {
  const base = await provider.getTransactionCount(walletAddress, "pending");
  return base + Number(offset);
};