// SPDX-License-Identifier: MIT
// contracts/MockLayerZeroEndpoint.sol
pragma solidity ^0.8.22;

contract MockLayerZeroEndpoint {
    function send(
        uint32,
        bytes calldata,
        bytes calldata,
        address,
        address,
        bytes calldata
    ) external payable {}
}