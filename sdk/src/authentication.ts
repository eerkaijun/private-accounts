import { stringifyBigInts } from "./utils";
import { generateGroth16Proof } from "./generate_proof";
import { poseidonHash, fieldToObject } from "./poseidon";

export async function generateAuthenticationProof(secret: number, nonce: number) {
    // construct inputs
    const hashedSecret = poseidonHash([secret]);
    let input = {
        secret: BigInt(secret),
        nonce: BigInt(nonce),
        hashedSecret: fieldToObject(hashedSecret)
    };
    const istring = stringifyBigInts(input);

    // generate proof
    const proof = await generateGroth16Proof(istring, "authentication");
    console.log("Proof: ", proof);
}