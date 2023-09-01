// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { BasePaymaster } from "@account-abstraction/contracts/core/BasePaymaster.sol";
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { UserOperation } from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import { AbstractShieldedPool } from "./abstracts/AbstractShieldedPool.sol";

contract PrivatePaymaster is BasePaymaster {

    // TODO: this should not be a hardcoded value
    uint256 public constant PAYMASTER_FEE = 0.01 ether;

    // TODO: calculate cost of the postOp
    uint256 constant public COST_OF_POST = 15000;

    AbstractShieldedPool public mixer;

    constructor(address _mixerAddress, IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {
        mixer = AbstractShieldedPool(_mixerAddress);
    }

    /**
      * validate the request:
      * if this is a constructor call, make sure it is a known account.
      * verify the sender has enough tokens.
      * (since the paymaster is also the token, there is no notion of "approval")
      */
    function _validatePaymasterUserOp(UserOperation calldata userOp, bytes32 /*userOpHash*/, uint256 requiredPreFund)
    internal override returns (bytes memory context, uint256 validationData) {
        // decode proof sent to the mixer for withdrawal
        AbstractShieldedPool.Proof memory proofData;
        proofData = abi.decode(userOp.paymasterAndData[20:], (AbstractShieldedPool.Proof));
        
        // set context for postOp
        address account = userOp.sender;
        bytes memory _context = abi.encode(account, proofData.extData.extAmount);

        /// @dev should we use try catch statement here, or just let the transaction reverts if invalid proof is provided
        try mixer.transact(proofData) {
            return (_context, 0);
        } catch {
            return ("", 0);
        }
    }

    /**
     * actual charge of user.
     * this method will be called just after the user's TX with mode==OpSucceeded|OpReverted (account pays in both cases)
     * BUT: if the user changed its balance in a way that will cause  postOp to revert, then it gets called again, after reverting
     * the user's TX , back to the state it was before the transaction started (before the validatePaymasterUserOp),
     * and the transaction should succeed there.
     */
    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) internal override {
        // redeem gas fee
        if (mode != PostOpMode.postOpReverted) {
            (address account, int256 withdrawAmount) = abi.decode(context, (address, int256));
            
            // TODO: use oracle to get conversion rate
            uint256 conversionRate = 1;
            uint256 paymasterFee = PAYMASTER_FEE * conversionRate;

            // paymaster should get back gas fee in the form of erc20 tokens
            uint256 amount = uint256(withdrawAmount) - paymasterFee;
            (bool success, ) = payable(account).call{ value: amount }("");
            require(success, "error");
        }
    }
    
}