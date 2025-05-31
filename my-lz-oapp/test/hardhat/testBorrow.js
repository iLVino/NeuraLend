// scripts/testBorrow.js
const { ethers } = require('hardhat');
const axios = require('axios');

async function main() {
  const [deployer] = await ethers.getSigners();
  const vaultAddress = '0xf748869c88013d14e67558Dd05D139E87b2D9086';
  const vault = await ethers.getContractAt('RootstockVault', vaultAddress);

  // Deposit tRBTC collateral (0.1 RBTC)
  const depositTx = await vault.deposit({ value: ethers.utils.parseEther('0.00001') });
  await depositTx.wait();
  console.log('Deposited 0.00001 tRBTC');

  // Get credit score from Flask
  const wallet = deployer.address;
  const response = await axios.post('http://localhost:5001/credit-score', { wallet });
  const creditScore = response.data.creditScore;
  console.log(`Credit score for ${wallet}: ${creditScore}`);

  // Approve wUSDC for repayment (required for repay)
  const wUSDC = await ethers.getContractAt('IERC20', vaultAddress);
  await wUSDC.approve(vaultAddress, ethers.utils.parseUnits('1000', 6));

  // Borrow wUSDC (e.g., 1 wUSDC)
  const amount = ethers.utils.parseUnits('0.0001', 6); // 6 decimals
  const borrowTx = await vault.borrow(amount, creditScore);
  await borrowTx.wait();
  console.log('Borrowed 100 wUSDC');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});