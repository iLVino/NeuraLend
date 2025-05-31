// SPDX-License-Identifier: MIT
// contracts/BerachainVault.sol
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILiquidStabilityPool {
    function offset(uint256 _debtToOffset, uint256 _collToAdd) external;
}

contract BerachainVault is Ownable {
    IERC20 public nect; // $NECT stablecoin
    ILiquidStabilityPool public lsp; // Beraborrow LSP
    mapping(address => uint256) public collateral; // BERA collateral
    mapping(address => uint256) public borrowed; // $NECT debt
    uint256 public constant COLLATERAL_RATIO = 150; // 150% minimum collateralization
    address public lspAdapter; // LSPAdapter contract

    constructor(
        address _nect,
        address _lsp,
        address _lspAdapter,
        address _delegate
    ) Ownable(_delegate) {
        nect = IERC20(_nect);
        lsp = ILiquidStabilityPool(_lsp);
        lspAdapter = _lspAdapter;
    }

    // Deposit BERA collateral
    function deposit() external payable {
        require(msg.value > 0, "No BERA sent");
        collateral[msg.sender] += msg.value;
    }

    // Borrow $NECT based on AI credit score
    function borrow(uint256 amount, uint256 creditScore) external {
        require(amount > 0, "Invalid amount");
        uint256 borrowLimit = calculateBorrowLimit(creditScore, collateral[msg.sender]);
        require(amount <= borrowLimit, "Exceeds borrow limit");
        require(nect.balanceOf(address(this)) >= amount, "Insufficient $NECT");
        borrowed[msg.sender] += amount;
        require(nect.transfer(msg.sender, amount), "Transfer failed");
    }

    // Calculate borrow limit based on credit score
    function calculateBorrowLimit(uint256 creditScore, uint256 collateralValue) public pure returns (uint256) {
        if (creditScore >= 90) return collateralValue * 60 / 100;
        if (creditScore >= 70) return collateralValue * 50 / 100;
        if (creditScore >= 50) return collateralValue * 30 / 100;
        return collateralValue * 10 / 100;
    }

    // Liquidate undercollateralized position via LSPAdapter
    function liquidate(address user) external {
        require(collateral[user] > 0, "No collateral");
        uint256 debt = borrowed[user];
        require(debt > 0, "No debt");
        uint256 collateralRatio = (collateral[user] * 100) / debt;
        require(collateralRatio < COLLATERAL_RATIO, "Not undercollateralized");
        uint256 collateralToSeize = collateral[user];
        collateral[user] = 0;
        borrowed[user] = 0;

        // Approve LSPAdapter to handle offset
        require(nect.approve(lspAdapter, debt), "Approval failed");
        (bool success, ) = lspAdapter.call{value: collateralToSeize}(
            abi.encodeWithSignature("offsetDebt(address,uint256,uint256)", user, debt, collateralToSeize)
        );
        require(success, "LSP offset failed");
    }

    // Repay $NECT
    function repay(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        require(borrowed[msg.sender] >= amount, "Invalid repayment");
        require(nect.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        borrowed[msg.sender] -= amount;
    }

    // Allow contract to receive BERA
    receive() external payable {}
}