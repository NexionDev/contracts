import type { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "shanghai", // 最保守的版本，确保兼容性
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // X Layer Networks
    xlayerTestnet: {
      type: "http",
      url: "https://xlayertestrpc.okx.com/terigon",
      chainId: 1952,
      accounts: [configVariable("XLAYER_TESTNET_PRIVATE_KEY")],
      gasPrice: 30000000, // 0.03 gwei - ultra-low gas price
    },
    xlayerMainnet: {
      type: "http",
      url: "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: [configVariable("XLAYER_PRIVATE_KEY")],
      gasPrice: 30000000, // 0.03 gwei - ultra-low gas price
    },
  },
};

export default config;
