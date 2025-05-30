require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    rootstock: {
      url: "https://public-node.testnet.rsk.co",
      accounts: [process.env.PRIVATE_KEY || "0xYourPrivateKey"],
      chainId: 31,
    },
    flow: {
      url: "https://testnet.evm.nodes.onflow.org",
      accounts: [process.env.PRIVATE_KEY || "0xYourPrivateKey"],
      chainId: 545,
    },
    berachain: {
      url: "https://bepolia.rpc.liveplex.io",
      accounts: [process.env.PRIVATE_KEY || "0xYourPrivateKey"],
      chainId: 80085,
    },
  },
  namedAccounts: {
    deployer: { default: 0 },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};