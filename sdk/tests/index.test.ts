import { Utxo } from "../src/utxo";
import { Keypair } from "../src/keypair";
import { ensurePoseidon } from "../src/poseidon";

test("Keypair", async () => {
  // const hashFn = buildPoseidon();
  await ensurePoseidon();
  const alice = new Keypair();
  // Ensure this doesnt blow up
  new Utxo({ amount: 100, keypair: alice });
});
