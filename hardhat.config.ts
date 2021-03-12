require('dotenv').config()

import "@nomiclabs/hardhat-waffle";

const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const DEFAULT_GAS_PRICE = 8000000000

import { HardhatUserConfig } from "hardhat/config";

const ALCHEMY_KEY = process.env.ALCHEMY_KEY || ""
const BLOCK_NUMBER = 12012081

if (!ALCHEMY_KEY) {
  throw new Error("ALCHEMY_KEY not set")
}

const config: HardhatUserConfig = {
  solidity: "0.6.12",
  networks: {
    hardhat: {
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      gasPrice: DEFAULT_GAS_PRICE,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
        blockNumber: BLOCK_NUMBER
      }
    }
  }
};

export default config;