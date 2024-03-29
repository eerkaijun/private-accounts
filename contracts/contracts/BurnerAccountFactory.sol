// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./BurnerAccount.sol";

import {AccountOwnerVerifier} from "./verifiers/AccountOwnerVerifier.sol";


/**
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract BurnerAccountFactory {
    BurnerAccount public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;
    AccountOwnerVerifier public immutable verifier;

    constructor(IEntryPoint _entryPoint, AccountOwnerVerifier _verifier) {
        entryPoint = _entryPoint;
        verifier = _verifier;
        accountImplementation = new BurnerAccount(_entryPoint, _verifier);
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(bytes32 hashedSecret,uint256 salt) public returns (BurnerAccount ret) {
        address addr = getAddress(hashedSecret, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return BurnerAccount(payable(addr));
        }
        ret = BurnerAccount(payable(new ERC1967Proxy{salt : bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(BurnerAccount.initialize, (hashedSecret))
            )));
    }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(bytes32 hashedSecret, uint256 salt) public view returns (address) {
        return Create2.computeAddress(bytes32(salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeCall(BurnerAccount.initialize, (hashedSecret))
                )
            )));
    }
}