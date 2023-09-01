import { ethers } from "hardhat";
import { 
    MockErc20__factory,
    BurnerAccount__factory,
    BurnerAccountFactory__factory,
    AccountOwnerVerifier__factory,
    PrivatePaymaster__factory,
    MultiAssetShieldedPool__factory,
    TransactionVerifier__factory,
    SwapExecutor__factory
} from "../typechain-types";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { generateAuthenticationProof, Account } from "@zrclib/sdk";
import { ensurePoseidon, poseidonHash, fieldToObject } from "@zrclib/sdk/src/poseidon";
import { sleep, tend, time } from "../utils";
import artifact from "@zrclib/circuits/generated/Hasher.json";
import * as dotenv from "dotenv";
dotenv.config();

// Entrypoint contract
const entrypointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
// Let's run it on Linea Goerli
const lineaProvider = new ethers.providers.StaticJsonRpcProvider("https://rpc.goerli.linea.build/");
const chain = "linea-testnet";
const apiKey = process.env.PIMLICO_API_KEY;
const pimlicoEndpoint = `https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`;
const pimlicoProvider = new ethers.providers.StaticJsonRpcProvider(pimlicoEndpoint);

async function deployERC20Token(name: string, symbol: string) {
    // Prepare signers
    const [deployer] = await ethers.getSigners();
  
    const erc20Factory = new MockErc20__factory(deployer);
    const token = await erc20Factory.deploy(name, symbol);
  
    return token;
}

async function setup() {
    // Prepare signers
    const [deployer] = await ethers.getSigners();

    // Deploy the poseidon hasher
    const { abi, bytecode } = artifact;
    const Hasher = await ethers.getContractFactory(abi, bytecode);
    const hasher = await Hasher.deploy();

    // Deploy the TransactionVerifier
    const verifierFactory = new TransactionVerifier__factory(deployer);
    const verifier = await verifierFactory.deploy();

    // Deploy the Swap Executor
    const swapExecutorFactory = new SwapExecutor__factory(deployer);
    const swapExecutor = await swapExecutorFactory.deploy();

    // Deploy the multi asset shielded pool
    const maspFactory = new MultiAssetShieldedPool__factory(deployer);
    const mixer = await maspFactory.deploy(
        hasher.address,
        verifier.address,
        swapExecutor.address
    );

    let factory;
    if (process.env.BURNER_ACCOUNT_FACTORY_ADDRESS == undefined) {
        // Deploy the AccountOwnerVerifier
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

    // Add stake to paymaster
    // Deploy private paymaster
    const paymasterFactory = new PrivatePaymaster__factory(deployer);
    const paymaster = await paymasterFactory.deploy(mixer.address, entrypointAddress);
    // await paymaster.addStake(3000, { value: ethers.utils.parseEther("0.1")});
    // await paymaster.deposit({ value: ethers.utils.parseEther("0.1")});

    await ensurePoseidon();

    return { mixer, factory, paymaster };
}

async function main() {

    // Prepare signers
    const [deployer] = await ethers.getSigners();
    const TEN = 10_000_000;

    let { mixer, factory, paymaster } = await setup();
    let token = await deployERC20Token("LUSD", "LUSD");

    // CREATE ACCOUNTS
    const alice = await Account.create(mixer, deployer, "password123");
    await alice.login();
    // Mint tokens
    await (await token.mint(deployer.address, TEN)).wait();

    // Deposit into mixer
    let t = time("Creates shield proof for 10 coins");
    let proof = await alice.proveShield(TEN, token.address);
    tend(t);

    t = time("Approves ERC20 payment");
    await token.approve(mixer.address, TEN);
    tend(t);

    t = time("Submits transaction");
    await mixer.transact(proof);
    tend(t);

    // Allow DBStore to sync
    await sleep(10_000);

    // Deploy a burner account by specifying the hashed secret
    const secret = BigInt(5678);
    const hashedSecret = ethers.utils.hexlify(fieldToObject(poseidonHash([secret])));
    const initCode = ethers.utils.hexConcat([
        factory.address,
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

    // Withdraw from mixer (proof is included in paymaster data)
    t = time("Creates unshield proof for 10 coins");
    proof = await alice.proveUnshield(TEN, deployer.address, token.address);
    tend(t);
    const proofData = ethers.utils.defaultAbiCoder.encode(
        [
            "tuple(bytes proof,bytes32 root,bytes32[2] inputNullifiers,bytes32[2] outputCommitments,uint256 publicAmount,address publicAsset,bytes32 extDataHash)",
            "tuple(address recipient,int256 extAmount,bytes encryptedOutput1,bytes encryptedOutput2,address tokenOut,uint256 amountOutMin,address swapRecipient,address swapRouter,bytes swapData,bytes transactData)"
        ],
        [proof.proofArguments, proof.extData]
    );
    const paymasterAndData = ethers.utils.hexConcat([paymaster.address, proofData]);

    // Construct UserOp
    let nonce = 0;
    const authenticationProof = await generateAuthenticationProof(secret, nonce);
    const gasPrice = await lineaProvider.getGasPrice()
    const userOp = {
        sender: accountAddress,
        nonce: nonce,
        initCode: initCode,
        callData: callData,
        callGasLimit: ethers.utils.hexlify(1_000_000), // hardcode it for now at a high value,
        verificationGasLimit: ethers.utils.hexlify(4_000_000), // hardcode it for now at a high value,
        preVerificationGas: ethers.utils.hexlify(500_000), // hardcode it for now at a high value,
        maxFeePerGas: ethers.utils.hexlify(gasPrice),
        maxPriorityFeePerGas: ethers.utils.hexlify(gasPrice),
        paymasterAndData: paymasterAndData,
        signature: authenticationProof
    }

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