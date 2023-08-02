import { ethers } from "hardhat";
import { 
    BurnerAccount__factory,
    BurnerAccountFactory__factory,
    AccountOwnerVerifier__factory,
} from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { generateAuthenticationProof } from "@zrclib/sdk";
import { poseidonHash, fieldToObject } from "@zrclib/sdk/src/poseidon";

async function setup() {
    // Prepare signers
    const [deployer] = await ethers.getSigners();

    // Entrypoint contract
    const entrypointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

    // Deploy the Verifier
    const verifierFactory = new AccountOwnerVerifier__factory(deployer);
    const verifier = await verifierFactory.deploy();

    // Deploy burner account factory
    const burnerAccountFactory = new BurnerAccountFactory__factory(deployer);
    const factory = await burnerAccountFactory.deploy(entrypointAddress, verifier.address);

    return { factory };
}

async function main() {

    let { factory } = await loadFixture(setup);

    // Generate the initcode to deploy new burner account
    const burnerAccountFactoryAddress = factory.address;
    // Let's run it on Linea Goerli
    const lineaProvider = new ethers.providers.StaticJsonRpcProvider("https://rpc.goerli.linea.build/");
    // Deploy a burner account by specifying the hashed secret
    const secret = BigInt(1234);
    const hashedSecret = ethers.utils.hexlify(fieldToObject(poseidonHash([secret])));
    const initCode = ethers.utils.hexConcat([
        burnerAccountFactoryAddress,
        factory.interface.encodeFunctionData("createAccount", [hashedSecret, 0]) // set salt as 0
    ]);
    console.log("Initcoe: ", initCode);
    const accountAddress = await factory.getAddress(hashedSecret, 0);
    console.log("Generated account address: ", accountAddress);

    // Now, generate the calldata to execute a transaction
    const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik
    const value = 0
    const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes
    const burnerAccount = BurnerAccount__factory.connect(
	    accountAddress,
	    lineaProvider,
    );
    const callData = burnerAccount.interface.encodeFunctionData("execute", [to, value, data]);
    console.log("Generated callData:", callData)

    // Construct UserOp
    let nonce = 0;
    const proof = await generateAuthenticationProof(secret, nonce);
    const gasPrice = await lineaProvider.getGasPrice()
    const userOp = {
        sender: accountAddress,
        nonce: nonce,
        initCode: initCode,
        callData: callData,
        callGasLimit: ethers.utils.hexlify(100_000), // hardcode it for now at a high value,
        verificationGasLimit: ethers.utils.hexlify(400_000), // hardcode it for now at a high value,
        preVerificationGas: ethers.utils.hexlify(50_000), // hardcode it for now at a high value,
        maxFeePerGas: ethers.utils.hexlify(gasPrice),
        maxPriorityFeePerGas: ethers.utils.hexlify(gasPrice),
        paymasterAndData: "0x",
        signature: proof
    }
    console.log("Generated UserOp:", userOp)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});