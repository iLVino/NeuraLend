//license SPDX-License-Identifier: MIT

// contracts/FlowVault.sol
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FlowVault is OFT {
    IERC20 public usdc; // USDC token on Flow EVM
    mapping(address => uint256) public collateral; // USDC collateral
    uint256 public constant COLLATERAL_RATIO = 150; // 150% minimum collateralization

    constructor(
        address _usdc,
        address _lzEndpoint,
        address _delegate
    ) OFT("Wrapped RBTC", "wRBTC", _lzEndpoint, _delegate) Ownable(_delegate) {
        usdc = IERC20(_usdc);
        _mint(msg.sender, 0.1 * 10**18); // Pre-mint 0.1 wRBTC (18 decimals)
    }

    // Deposit USDC collateral
    function deposit(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        collateral[msg.sender] += amount;
    }

    // Borrow wRBTC based on AI credit score
    function borrow(uint256 amount, uint256 creditScore) external {
        require(amount > 0, "Invalid amount");
        uint256 borrowLimit = calculateBorrowLimit(creditScore, collateral[msg.sender]);
        require(amount <= borrowLimit, "Exceeds borrow limit");
        require(balanceOf(address(this)) >= amount, "Insufficient wRBTC");
        _mint(msg.sender, amount);
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
        uint256 debt = balanceOf(user);
        require(debt > 0, "No debt");
        uint256 collateralRatio = (collateral[user] * 100) / debt;
        require(collateralRatio < COLLATERAL_RATIO, "Not undercollateralized");
        uint256 collateralToSeize = collateral[user];
        collateral[user] = 0;
        _burn(user, debt);
        require(usdc.transfer(msg.sender, collateralToSeize), "Transfer failed");
    }

    // Repay wRBTC
    function repay(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient wRBTC");
        _burn(msg.sender, amount);
    }
}