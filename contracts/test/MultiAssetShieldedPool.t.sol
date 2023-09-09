// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import { MultiAssetShieldedPool } from "../contracts/MultiAssetShieldedPool.sol";
import { SwapExecutor } from "../contracts/abstracts/SwapExecutor.sol";
import { TransactionVerifier } from "../contracts/verifiers/TransactionVerifier.sol";

contract MultiAssetShieldedPoolTest is Test {

    MultiAssetShieldedPool public shieldedPool;

    function setUp() public {
        // TODO: deploy hasher contract using cheatcode
        TransactionVerifier verifier = new TransactionVerifier();
        SwapExecutor swapExecutor = new SwapExecutor();
        shieldedPool = new MultiAssetShieldedPool(address(0), address(verifier), address(swapExecutor));
    }

    function invariant_testDeposit() public {
        
    }
    
}