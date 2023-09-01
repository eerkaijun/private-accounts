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
import { sleep, tend, time, waitUntil } from "../utils";
import artifact from "@zrclib/circuits/generated/Hasher.json";
import * as dotenv from "dotenv";
dotenv.config();

// Entrypoint contract
const entrypointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
// Let's run it on Linea Goerli
const lineaProvider = new ethers.providers.StaticJsonRpcProvider("https://rpc.goerli.linea.build/");

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

    // Deploy private paymaster
    const paymasterFactory = new PrivatePaymaster__factory(deployer);
    const paymaster = await paymasterFactory.deploy(mixer.address, entrypointAddress);

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

    // Withdraw from mixer
    t = time("Creates unshield proof for 10 coins");
    proof = await alice.proveUnshield(TEN, deployer.address, token.address);
    tend(t);

    t = time("Submits transaction");
    await mixer.transact(proof);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});