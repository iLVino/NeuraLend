// scripts/deploy.js
const { addressToBytes32 } = require('@layerzerolabs/lz-v2-utilities');

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Endpoint IDs
  const ROOTSTOCK_EID = 40165; // Rootstock testnet
//   const FLOW_EID = 40245; // Flow EVM testnet

  let rootstockVaultAddress, flowVaultAddress;

  if (network.name === "rootstock") {
    const layerZeroEndpoint = "0x2c7aF0AbA8d37f81C2e446d3ad7f4d12E5dE7b84";
    const rootstockVault = await deploy("RootstockVault", {
      from: deployer,
      args: [layerZeroEndpoint, deployer],
      log: true,
    });
    rootstockVaultAddress = rootstockVault.address;
  }

//   if (network.name === "flow") {
//     const flowUsdc = "0xYOUR_USDC_ADDRESS";
//     const flowEndpoint = "0xYOUR_FLOW_ENDPOINT";
//     const flowVault = await deploy("FlowVault", {
//       from: deployer,
//       args: [flowUsdc, flowEndpoint, deployer],
//       log: true,
//     });
//     flowVaultAddress = flowVault.address;
//   }

  if (network.name === "berachain") {
    const honey = "0xYOUR_HONEY_ADDRESS";
    const lsp = "0xYOUR_LSP_ADDRESS";
    await deploy("BerachainVault", {
      from: deployer,
      args: [honey, lsp, deployer],
      log: true,
    });
  }

  // Post-deployment: Configure peers (run separately after both deployments)
  if (rootstockVaultAddress && flowVaultAddress) {
    const rootstockVaultContract = await ethers.getContractAt("RootstockVault", rootstockVaultAddress);
    const flowVaultContract = await ethers.getContractAt("FlowVault", flowVaultAddress);
    await rootstockVaultContract.setPeer(FLOW_EID, addressToBytes32(flowVaultAddress), { from: deployer });
    await flowVaultContract.setPeer(ROOTSTOCK_EID, addressToBytes32(rootstockVaultAddress), { from: deployer });
  }
};
module.exports.tags = ["Vaults"];