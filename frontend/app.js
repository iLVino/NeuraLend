const vaultAddress = '0xf748869c88013d14e67558Dd05D139E87b2D9086';
const vaultABI = [
  'function deposit() external payable',
  'function borrow(uint256 amount, uint256 creditScore) external',
  'function repay(uint256 amount) external',
  'function liquidate(address user) external',
  'function collateral(address) view returns (uint256)',
  'function borrowed(address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

let provider, signer, vault, walletAddress;

async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      walletAddress = await signer.getAddress();
      vault = new ethers.Contract(vaultAddress, vaultABI, signer);

      document.getElementById('walletInfo').innerText = `Connected: ${walletAddress}`;
      document.getElementById('connectWallet').style.display = 'none';
      document.getElementById('stats').classList.remove('hidden');
      document.getElementById('actions').classList.remove('hidden');
      await refreshStats();
    } catch (error) {
      alert(`Error connecting wallet: ${error.message}`);
    }
  } else {
    alert('Please install MetaMask!');
  }
}

async function refreshStats() {
  try {
    console.log('Fetching tRBTC balance...');
    const tRBTCBalance = await provider.getBalance(walletAddress);
    document.getElementById('trbtcBalance').innerText = ethers.utils.formatEther(tRBTCBalance);

    console.log('Fetching wUSDC balance...');
    const wusdcBalance = await vault.balanceOf(walletAddress);
    document.getElementById('wusdcBalance').innerText = ethers.utils.formatUnits(wusdcBalance, 6);

    console.log('Fetching collateral...');
    const collateral = await vault.collateral(walletAddress);
    document.getElementById('collateral').innerText = ethers.utils.formatEther(collateral);

    console.log('Fetching debt...');
    const debt = await vault.borrowed(walletAddress);
    document.getElementById('debt').innerText = ethers.utils.formatUnits(debt, 6);

    document.getElementById('walletAddress').innerText = walletAddress;

    console.log('Fetching credit score from Flask...');
    const response = await axios.post('http://localhost:5001/credit-score', { wallet: walletAddress });
    document.getElementById('creditScore').innerText = response.data.creditScore || '-';
  } catch (error) {
    console.error('Stats error:', error);
    alert(`Error refreshing stats: ${error.message}`);
  }
}

async function deposit() {
  const amount = document.getElementById('depositAmount').value;
  if (!amount || amount <= 0) return alert('Enter a valid amount');
  try {
    const tx = await vault.deposit({ value: ethers.utils.parseEther(amount) });
    await tx.wait();
    alert('Deposit successful!');
    await refreshStats();
  } catch (error) {
    alert(`Deposit failed: ${error.message}`);
  }
}

async function borrow() {
  const amount = document.getElementById('borrowAmount').value;
  if (!amount || amount <= 0) return alert('Enter a valid amount');
  try {
    const response = await axios.post('http://localhost:5001/credit-score', { wallet: walletAddress });
    const creditScore = response.data.creditScore;
    const tx = await vault.borrow(ethers.utils.parseUnits(amount, 6), creditScore);
    await tx.wait();
    alert('Borrow successful!');
    await refreshStats();
  } catch (error) {
    alert(`Borrow failed: ${error.message}`);
  }
}

async function repay() {
  const amount = document.getElementById('repayAmount').value;
  if (!amount || amount <= 0) return alert('Enter a valid amount');
  try {
    const approveTx = await vault.approve(vaultAddress, ethers.utils.parseUnits(amount, 6));
    await approveTx.wait();
    const tx = await vault.repay(ethers.utils.parseUnits(amount, 6));
    await tx.wait();
    alert('Repay successful!');
    await refreshStats();
  } catch (error) {
    alert(`Repay failed: ${error.message}`);
  }
}

async function liquidate() {
  try {
    const tx = await vault.liquidate(walletAddress);
    await tx.wait();
    alert('Liquidation successful!');
    await refreshStats();
  } catch (error) {
    alert(`Liquidation failed: ${error.message}`);
  }
}