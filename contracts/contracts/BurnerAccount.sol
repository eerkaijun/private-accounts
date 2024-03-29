// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@account-abstraction/contracts/core/BaseAccount.sol";

import {AccountOwnerVerifier} from "./verifiers/AccountOwnerVerifier.sol";

contract BurnerAccount is BaseAccount, UUPSUpgradeable, Initializable {
    bytes32 public hashedSecret;
    uint256 private nonce;

    IEntryPoint public immutable _entryPoint;
    AccountOwnerVerifier public immutable _verifier;

    event BurnerAccountInitialized(IEntryPoint indexed entryPoint, bytes32 indexed hashedSecret);

    modifier onlyOwner(bytes memory proof) {
        _onlyOwner(proof);
        _;
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(IEntryPoint anEntryPoint, AccountOwnerVerifier aVerifier) {
        _entryPoint = anEntryPoint;
        _verifier = aVerifier;
    }

    function _onlyOwner(bytes memory proof) internal view {
        // TODO: add a zk proof that the user has the secret to the hashedSecret
        uint[2] memory pubSignals = [
            uint(getNonce()),
            uint(hashedSecret)
        ];
        require(_verifier.verifyGroth16Proof(proof, pubSignals), "Sender not account owner");
    }

    /**
     * execute a transaction (called directly from owner, or by entryPoint)
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPoint();
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transactions
     */
    function executeBatch(address[] calldata dest, bytes[] calldata func) external {
        _requireFromEntryPoint();
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of BurnerAccount must be deployed with the new EntryPoint address, then upgrading
      * the implementation by calling `upgradeTo()`
     */
    function initialize(bytes32 aHashedSecret) public virtual initializer {
        hashedSecret = aHashedSecret;
        emit BurnerAccountInitialized(_entryPoint, hashedSecret);
    }

    /// implement template method of BaseAccount
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        // TODO: verify with userOpHash
        // pass in zk proof in userOp signature field (user proves that it has the secret to the hashedSecret)
        uint[2] memory pubSignals = [
            uint(getNonce()),
            uint(hashedSecret)
        ];
        // TODO: there's some issue with calling this function (it's not initialized)
        // TODO: try to find eth infinitism deploy script to see what needs to be initialized
        bool verificationResult = _verifier.verifyGroth16Proof(userOp.signature, pubSignals);
        // verify validity of the zk proof
        if (!verificationResult)
            return SIG_VALIDATION_FAILED;
        return 0;
    }

    /// @dev this is mainly useful for testing, but can be removed in production
    function validateSignature(UserOperation calldata userOp) public {
        uint256 validationData = _validateSignature(userOp, 0);
        require(validationData == 0, "signature validation failed");
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value : value}(data);
        nonce++;
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * get the nonce of the current account 
     */
    function getNonce() public view override returns (uint256) {
        return nonce;
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value : msg.value}(address(this));
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount, bytes memory proof) public onlyOwner(proof) {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        // TODO: define upgrade logic and modifier
    }
}
