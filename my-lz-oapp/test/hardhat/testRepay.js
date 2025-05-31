const { ethers } = require('hardhat');
const axios = require('axios');

async function main() {
  const [deployer] = await ethers.getSigners();
  const vaultAddress = '0xf748869c88013d14e67558Dd05D139E87b2D9086';
  const vault = await ethers.getContractAt('RootstockVault', vaultAddress);

  console.log(`Testing repay for ${deployer.address}`);

  // Step 1: Deposit 0.1 tRBTC
  const depositTx = await vault.deposit({ value: ethers.utils.parseEther('0.000001') });
  await depositTx.wait();
  console.log('Deposited 0.1 tRBTC');
  const collateral = await vault.collateral(deployer.address);
  console.log(`Collateral: ${ethers.utils.formatEther(collateral)} tRBTC`);

  // Step 2: Get credit score
  const response = await axios.post('http://localhost:5001/credit-score', { wallet: deployer.address });
  const creditScore = response.data.creditScore;
  console.log(`Credit score: ${creditScore}`);

  // Step 3: Borrow 1 wUSDC
  const borrowAmount = ethers.utils.parseUnits('1', 6);
  const borrowTx = await vault.borrow(borrowAmount, creditScore);
  await borrowTx.wait();
  console.log('Borrowed 1 wUSDC');
  const debt = await vault.borrowed(deployer.address);
  console.log(`Debt: ${ethers.utils.formatUnits(debt, 6)} wUSDC`);

  // Step 4: Approve 5 wUSDC
  const repayAmount = ethers.utils.parseUnits('5', 6);
  const approveTx = await vault.approve(vaultAddress, repayAmount);
  await approveTx.wait();
  console.log('Approved 50 wUSDC');
  const allowance = await vault.allowance(deployer.address, vaultAddress);
  console.log(`Allowance: ${ethers.utils.formatUnits(allowance, 6)} wUSDC`);

  // Step 5: Repay 5 wUSDC
  try {
    const repayTx = await vault.repay(repayAmount, { gasLimit: 600000 });
    await repayTx.wait();
    console.log('Repaid 50 wUSDC');
    const newDebt = await vault.borrowed(deployer.address);
    console.log(`New debt: ${ethers.utils.formatUnits(newDebt, 6)} wUSDC`);
  } catch (error) {
    console.error('Repay failed:', error);
    throw error;
  }
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});