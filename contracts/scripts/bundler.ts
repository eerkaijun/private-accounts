import { ethers } from "hardhat";
import { 
    BurnerAccount__factory,
    BurnerAccountFactory__factory,
    AccountOwnerVerifier__factory,
} from "../typechain-types";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { generateAuthenticationProof } from "@zrclib/sdk";
import { ensurePoseidon, poseidonHash, fieldToObject } from "@zrclib/sdk/src/poseidon";
import * as dotenv from "dotenv";
dotenv.config();

// Entrypoint contract
const entrypointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
// Let's run it on Linea Goerli
const lineaProvider = new ethers.providers.StaticJsonRpcProvider("https://rpc.goerli.linea.build/");

async function setup() {
    // Prepare signers
    const [deployer] = await ethers.getSigners();

    let factory;
    if (process.env.BURNER_ACCOUNT_FACTORY_ADDRESS == undefined) {
        // Deploy the Verifier
        const verifierFactory = new AccountOwnerVerifier__factory(deployer);
        const verifier = await verifierFactory.deploy();

        // Deploy burner account factory
        const burnerAccountFactory = new BurnerAccountFactory__factory(deployer);
        factory = await burnerAccountFactory.deploy(entrypointAddress, verifier.address);
        console.log("BurnerAccountFactory deployed at: ", factory.address);
    } else {
        // Use existing factory
        factory = new BurnerAccountFactory__factory(deployer).attach(process.env.BURNER_ACCOUNT_FACTORY_ADDRESS);
        console.log("Using existing BurnerAccountFactory at: ", factory.address);
    }

    await ensurePoseidon();

    return { factory };
}

async function main() {

    let { factory } = await setup();

    // Generate the initcode to deploy new burner account
    const burnerAccountFactoryAddress = factory.address;
    
    // Deploy a burner account by specifying the hashed secret
    const secret = BigInt(1234);
    const hashedSecret = ethers.utils.hexlify(fieldToObject(poseidonHash([secret])));
    const initCode = ethers.utils.hexConcat([
        burnerAccountFactoryAddress,
        factory.interface.encodeFunctionData("createAccount", [hashedSecret, 0]) // set salt as 0
    ]);
    console.log("Initcode: ", initCode);
    const accountAddress = await factory.getAddress(hashedSecret, 0);
    console.log("Generated account address: ", accountAddress);

    // Calculate sender address
    const entryPoint = EntryPoint__factory.connect(
        entrypointAddress,
        lineaProvider,
    );
    const senderAddress = await entryPoint.callStatic.getSenderAddress(initCode)
        .then(() => {
            throw new Error("Expected getSenderAddress() to revert");
        })
        .catch((e) => {
            const data = e.message.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1];
            if (!data) {
                return Promise.reject(new Error("Failed to parse revert data"));
            }
            const addr = ethers.utils.getAddress(`0x${data.slice(24, 64)}`);
            return Promise.resolve(addr);
       });
    console.log("Calculated sender address:", senderAddress);

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
    
    // Request Pimlico verifying paymaster to sponsor the user operation
    const chain = "linea-testnet";
    const apiKey = process.env.PIMLICO_API_KEY;
    const pimlicoEndpoint = `https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`;
    const pimlicoProvider = new ethers.providers.StaticJsonRpcProvider(pimlicoEndpoint);
 
    const sponsorUserOperationResult = await pimlicoProvider.send("pm_sponsorUserOperation", [
	    userOp,
	    {
		    entryPoint: entrypointAddress,
	    },
    ]);
    const paymasterAndData = sponsorUserOperationResult.paymasterAndData;
    userOp.paymasterAndData = paymasterAndData;
    console.log("Pimlico paymasterAndData:", paymasterAndData);

    // Submit the userOp to be bundled
    const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [
        userOp,
        entrypointAddress
    ]);
    console.log("UserOperation hash:", userOperationHash);
 
    // Wait for the userOperation to be included, by continually querying for the receipts
    console.log("Querying for receipts...");
    let receipt = null;
    while (receipt === null) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [
		    userOperationHash,
	    ]);
        console.log(receipt === null ? "Still waiting..." : receipt);
    }
 
    const txHash = receipt.receipt.transactionHash;
    console.log(`UserOperation included: https://goerli.lineascan.build/tx/${txHash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});