//license SPDX-License-Identifier: MIT
// contracts/RootstockVault.sol
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RootstockVault is ERC20, Ownable {
    mapping(address => uint256) public collateral; // tRBTC collateral
    mapping(address => uint256) public borrowed; // wUSDC debt
    uint256 public constant COLLATERAL_RATIO = 150; // 150% minimum collateralization

    constructor(address _owner)
        ERC20("Wrapped USDC", "wUSDC")
        Ownable(_owner)
    {
        _mint(_owner, 1000 * 10**6); // Pre-mint 1000 wUSDC (6 decimals)
    }

    // Deposit tRBTC collateral
    function deposit() external payable {
        require(msg.value > 0, "No RBTC sent");
        collateral[msg.sender] += msg.value;
    }

    // Borrow wUSDC based on AI credit score
    function borrow(uint256 amount, uint256 creditScore) external {
        require(amount > 0, "Invalid amount");
        uint256 borrowLimit = calculateBorrowLimit(creditScore, collateral[msg.sender]);
        require(amount <= borrowLimit, "Exceeds borrow limit");
        require(balanceOf(address(this)) >= amount, "Insufficient wUSDC");
        borrowed[msg.sender] += amount;
        _transfer(address(this), msg.sender, amount);
    }

    // Calculate borrow limit based on credit score
    function calculateBorrowLimit(uint256 creditScore, uint256 collateralValue) public pure returns (uint256) {
        if (creditScore >= 90) return collateralValue * 60 / 100;
        if (creditScore >= 70) return collateralValue * 50 / 100;
        if (creditScore >= 50) return collateralValue * 30 / 100;
        return collateralValue * 10 / 100;
    }

    // Liquidate undercollateralized position
    function liquidate(address user) external {
        require(collateral[user] > 0, "No collateral");
        uint256 debt = borrowed[user];
        require(debt > 0, "No debt");
        uint256 collateralRatio = (collateral[user] * 100) / debt;
        require(collateralRatio < COLLATERAL_RATIO, "Not undercollateralized");
        uint256 collateralToSeize = collateral[user];
        collateral[user] = 0;
        borrowed[user] = 0;
        payable(msg.sender).transfer(collateralToSeize);
    }

    // Repay wUSDC
    function repay(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        require(borrowed[msg.sender] >= amount, "Invalid repayment");
        require(transferFrom(msg.sender, address(this), amount), "Transfer failed");
        borrowed[msg.sender] -= amount;
    }

    // Allow contract to receive RBTC
    receive() external payable {}
}