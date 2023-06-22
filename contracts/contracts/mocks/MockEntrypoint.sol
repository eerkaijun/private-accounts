// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract MockEntryPoint {

    mapping(address => uint256) public nonces;

    function getNonce(address account, uint256 key) public view returns (uint256) {
        (key);
        return nonces[account];
    }

    function incrementNonce() public {
        nonces[msg.sender]++;
    }
}