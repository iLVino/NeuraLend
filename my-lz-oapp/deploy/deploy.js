module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name === "rootstock") {
    try {
      const rootstockVault = await deploy("RootstockVault", {
        from: deployer,
        args: [deployer],
        log: true,
        gasLimit: 5000000,
        gasPrice: ethers.utils.parseUnits("0.1", "gwei"), // 0.1 gwei
      });
      console.log(`RootstockVault deployed at ${rootstockVault.address}`);
    } catch (error) {
      console.error("Deployment failed:", error);
      if (error.reason) console.error("Revert reason:", error.reason);
      if (error.data) console.error("Error data:", error.data);
      throw error;
    }
  }
};
module.exports.tags = ["Vaults"];