import { stringifyBigInts } from "./utils";
import { generateGroth16Proof } from "./generate_proof";
import { poseidonHash, fieldToObject } from "./poseidon";
import { BigNumberish } from "ethers";

export async function generateAuthenticationProof(secret: BigNumberish, nonce: BigNumberish) {
    // construct inputs
    const hashedSecret = poseidonHash([secret]);
    let input = {
        secret: secret,
        nonce: nonce,
        hashedSecret: fieldToObject(hashedSecret)
    };
    const istring = stringifyBigInts(input);

    // generate proof
    const proof = await generateGroth16Proof(istring, "authentication");
    return proof;
}