import { ethers } from "hardhat";
import { 
    BurnerAccount__factory,
    MockEntryPoint__factory,
    AuthenticationVerifier__factory,
} from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { generateAuthenticationProof } from "@zrclib/sdk";
import { poseidonHash, fieldToString } from "@zrclib/sdk/src/poseidon";
import { expect } from "chai";

async function setup() {
    // Prepare signers
    const [deployer] = await ethers.getSigners();

    // Deploy mock Entrypoint
    const entrypointFactory = new MockEntryPoint__factory(deployer);
    const entrypoint = await entrypointFactory.deploy();

    // Deploy the Verifier
    const verifierFactory = new AuthenticationVerifier__factory(deployer);
    const verifier = await verifierFactory.deploy();

    // Deploy a burner account by specifying the hashed secret
    /// @dev actual deployment should be done through the Entrypoint contract, but for testing purposes, we deploy it directly
    const secret = BigInt(1234);
    const hashedSecret = ethers.utils.hexlify(poseidonHash([secret]));
    const accountFactory = new BurnerAccount__factory(deployer);
    const contract = await accountFactory.deploy(entrypoint.address, verifier.address, hashedSecret);
  
    return { contract, secret };
}

it("Test burner account", async function() {

    let { contract, secret } = await loadFixture(setup);

    // construct UserOp
    /// @dev we are only testing the signature here, so random value for other fields
    let nonce = await contract.getNonce();
    const proof = await generateAuthenticationProof(secret, nonce);
    const userOp = {
        sender: contract.address,
        nonce: nonce,
        initCode: "0x",
        callData: "0x",
        callGasLimit: 0,
        verificationGasLimit: 0,
        preVerificationGas: 0,
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
        paymasterAndData: "0x",
        signature: proof
    }
    const result = await contract.validateSignature(userOp);
    console.log("Result: ", result);

})