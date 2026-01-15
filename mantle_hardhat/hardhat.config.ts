import * as dotenv from "dotenv";
dotenv.config();
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-noir";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.29",
    settings: { optimizer: { enabled: true, runs: 100000000 } },
  },
  defaultNetwork: "mantleSepolia",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC!,
      accounts: [process.env.PRIVATE_KEY!],
    },
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: [process.env.PRIVATE_KEY!],
    }
  },
  noir: {
    version: "1.0.0-beta.11",
  },
};

export default config;
