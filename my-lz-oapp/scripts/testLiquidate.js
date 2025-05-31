// scripts/testLiquidate.js
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const vaultAddress = '0xf748869c88013d14e67558Dd05D139E87b2D9086';
  const vault = await ethers.getContractAt('RootstockVault', vaultAddress);

  const liquidateTx = await vault.liquidate(deployer.address);
  await liquidateTx.wait();
  console.log('Liquidated position');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});