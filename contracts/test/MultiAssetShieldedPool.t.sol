// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import { MultiAssetShieldedPool } from "../contracts/MultiAssetShieldedPool.sol";
import { SwapExecutor } from "../contracts/abstracts/SwapExecutor.sol";
import { TransactionVerifier } from "../contracts/verifiers/TransactionVerifier.sol";

contract MultiAssetShieldedPoolTest is Test {

    MultiAssetShieldedPool public shieldedPool;

    function deployFromBytecode(bytes memory bytecode) public returns (address) {
        address child;
        assembly{
            mstore(0x0, bytecode)
            child := create(0,0xa0, calldatasize())
        }
        return child;
    }

    function setUp() public {
        // deploy hasher contract using cheatcode
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/test/utils/Hasher.json");
        assertTrue(vm.exists(path));
        string memory data = vm.readFile(path);
        bytes memory bytecode = vm.parseJsonBytes(data, ".bytecode");
        address hasher = deployFromBytecode(bytecode);
        
        // deploy other contracts
        TransactionVerifier verifier = new TransactionVerifier();
        SwapExecutor swapExecutor = new SwapExecutor();

        // initialize shielded pool
        shieldedPool = new MultiAssetShieldedPool(hasher, address(verifier), address(swapExecutor));
    }

    function invariant_testDeposit() public {
        assertEq(shieldedPool.MAX_EXT_AMOUNT(), 2 ** 248);
    }
    
}