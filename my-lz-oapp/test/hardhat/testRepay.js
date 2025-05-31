const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const vaultAddress = '0xD7749d762dA7B537E17C14DA5A4b69a71d8bdc49';
  
  // ABI for RootstockVault
  const vaultABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    "function repay(uint256 amount)",
    "function borrowed(address) view returns (uint256)"
  ];
  const vault = await ethers.getContractAt(vaultABI, vaultAddress, deployer);
  const wUSDC = vault;
  const decimals = 6;

  console.log(`Testing repayment workaround for ${deployer.address} (owner)`);
  console.log(`wUSDC decimals: ${decimals}`);

  // Check tRBTC balance
  const tRBTCBalance = await deployer.getBalance();
  console.log(`tRBTC balance: ${ethers.utils.formatEther(tRBTCBalance)} tRBTC`);
  if (tRBTCBalance.lt(ethers.utils.parseEther('0.001'))) {
    throw new Error('Insufficient tRBTC; need ~0.001 tRBTC; fund wallet at https://faucet.rootstock.io/');
  }

  // Check deployer wUSDC balance and debt
  const wUSDCBalance = await wUSDC.balanceOf(deployer.address);
  console.log(`Deployer wUSDC balance: ${ethers.utils.formatUnits(wUSDCBalance, decimals)} wUSDC`);
  const debt = await vault.borrowed(deployer.address);
  console.log(`Debt: ${ethers.utils.formatUnits(debt, decimals)} wUSDC`);
  const vaultBalance = await wUSDC.balanceOf(vaultAddress);
  console.log(`Vault wUSDC balance: ${ethers.utils.formatUnits(vaultBalance, decimals)} wUSDC`);
  if (wUSDCBalance.lt(ethers.utils.parseUnits('50', decimals))) {
    throw new Error('Insufficient wUSDC balance for repayment');
  }
  if (debt.lt(ethers.utils.parseUnits('50', decimals))) {
    throw new Error('Insufficient debt for 50 wUSDC repayment');
  }

  // Transfer 50 wUSDC to vault
  const repayAmount = ethers.utils.parseUnits('50', decimals);
  const gasPrice = await provider.getGasPrice();
  console.log(`Suggested gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} Gwei`);
  try {
    console.log('Transferring 50 wUSDC to vault');
    const transferTx = await wUSDC.transfer(vaultAddress, repayAmount, { gasLimit: 100000, gasPrice });
    await transferTx.wait();
    console.log('Direct transfer of 50 wUSDC succeeded');
    // Check state after transfer
    console.log(`Post-transfer state:`);
    console.log(`Deployer balance: ${ethers.utils.formatUnits(await wUSDC.balanceOf(deployer.address), decimals)} wUSDC`);
    console.log(`Vault wUSDC balance: ${ethers.utils.formatUnits(await wUSDC.balanceOf(vaultAddress), decimals)} wUSDC`);
    console.log(`Debt: ${ethers.utils.formatUnits(await vault.borrowed(deployer.address), decimals)} wUSDC`);
    console.log('Note: Debt unchanged; use reduceDebt function or modified contract to update debt.');
  } catch (transferError) {
    console.error('Direct transfer failed:', transferError);
    if (transferError.data) {
      console.error('Raw revert data:', transferError.data);
      try {
        const decoded = ethers.utils.defaultAbiCoder.decode(['string'], ethers.utils.hexDataSlice(transferError.data, 4));
        console.error('Decoded standard Error(string) revert:', decoded[0]);
      } catch (stringDecodeError) {
        console.error('Could not decode revert reason:', transferError.data);
      }
    }
    throw transferError;
  }
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});