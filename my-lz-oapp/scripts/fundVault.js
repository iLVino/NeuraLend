// scripts/fundVault.js
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const vaultAddress = '0xf748869c88013d14e67558Dd05D139E87b2D9086';
  const vault = await ethers.getContractAt('RootstockVault', vaultAddress);

  // Transfer 500 wUSDC to vault
  const amount = ethers.utils.parseUnits('500', 6);
  const transferTx = await vault.transfer(vaultAddress, amount);
  await transferTx.wait();
  console.log('Transferred 500 wUSDC to vault');

  const vaultBalance = await vault.balanceOf(vaultAddress);
  console.log(`Vault wUSDC balance: ${ethers.utils.formatUnits(vaultBalance, 6)} wUSDC`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});