// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MockNECT is ERC20 {
    constructor() ERC20("Nectar", "NECT") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}