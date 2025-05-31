// SPDX-License-Identifier: MIT
// contracts/LSPAdapter.sol
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILiquidStabilityPool {
    function offset(uint256 _debtToOffset, uint256 _collToAdd) external;
}

contract LSPAdapter is Ownable {
    IERC20 public nect; // $NECT stablecoin
    ILiquidStabilityPool public lsp; // Beraborrow LSP
    address public lendingProtocol; // NeuraLend’s BerachainVault
    uint256 public constant FEE_PERCENT = 50; // 0.5% fee
    uint256 public constant MIN_RESERVE_RATIO = 20; // 20% $NECT reserve
    uint256 public totalNectReserved; // Total $NECT in LSP for NeuraLend

    event OffsetExecuted(address indexed protocol, uint256 debt, uint256 collateral, uint256 fee);

    constructor(
        address _nect,
        address _lsp,
        address _lendingProtocol,
        address _delegate
    ) Ownable(_delegate) {
        nect = IERC20(_nect);
        lsp = ILiquidStabilityPool(_lsp);
        lendingProtocol = _lendingProtocol;
    }

    // Called by BerachainVault to liquidate using LSP
    function offsetDebt(uint256 debt, uint256 collateral) external payable {
        require(msg.sender == lendingProtocol, "Only lending protocol");
        require(debt > 0, "Invalid debt");
        require(collateral > 0, "Invalid collateral");
        require(msg.value >= collateral, "Insufficient collateral sent");

        // Calculate fee for LSP holders
        uint256 fee = (debt * FEE_PERCENT) / 10000; // 0.5% of debt
        uint256 debtWithFee = debt + fee;

        // Check LSP liquidity
        require(totalNectReserved >= debtWithFee, "Insufficient $NECT in LSP");
        require(totalNectReserved - debtWithFee >= (totalNectReserved * MIN_RESERVE_RATIO) / 100, "Reserve ratio too low");

        // Transfer $NECT from LSP to burn debt
        require(nect.transferFrom(address(lsp), address(this), debtWithFee), "NECT transfer failed");
        require(nect.transfer(lendingProtocol, debt), "Debt repayment failed");
        // Fee remains in LSPAdapter for distribution to LSP holders

        // Call LSP offset
        lsp.offset(debt, msg.value);

        // Update reserves
        totalNectReserved -= debtWithFee;

        emit OffsetExecuted(lendingProtocol, debt, msg.value, fee);
    }

    // LSP deposits $NECT for NeuraLend liquidations
    function depositNect(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        require(nect.transferFrom(msg.sender, address(this), amount), "NECT transfer failed");
        totalNectReserved += amount;
    }

    // LSP holders withdraw profits (fees)
    function withdrawFees(address holder, uint256 amount) external onlyOwner {
        require(amount <= nect.balanceOf(address(this)) - totalNectReserved, "Exceeds available fees");
        require(nect.transfer(holder, amount), "Fee withdrawal failed");
    }

    // Update lending protocol
    function setLendingProtocol(address _newProtocol) external onlyOwner {
        lendingProtocol = _newProtocol;
    }
}