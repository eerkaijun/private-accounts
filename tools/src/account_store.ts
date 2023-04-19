import { BigNumber, BigNumberish } from "ethers";
import { EncryptedStore } from "./encrypted_store";
import { InMemoryStore } from "./in_memory_store";
import { PasswordEncryptor } from "./password_encryptor";
import { Store } from "./types";
import { Utxo, UtxoSerializer } from "./utxo";
import { Keypair, KeypairSerializer } from "./keypair";

export class AccountStore {
  constructor(
    storeKey: PasswordEncryptor,
    private utxoStore: Store<Utxo> = new EncryptedStore(
      storeKey,
      new UtxoSerializer()
    ),
    private keypairStore: Store<Keypair> = new EncryptedStore(
      storeKey,
      new KeypairSerializer()
    ),
    private nullifierStore: Store<Utxo | string | number> = new InMemoryStore(),
    private latestBlock: Store<Utxo | string | number> = new InMemoryStore()
  ) {}

  async setKeypair(keypair: Keypair) {
    return await this.keypairStore.add("0x5d32781", keypair);
  }

  async getKeypair() {
    return await this.keypairStore.get("0x5d32781");
  }

  async setLatestBlock(blockheight: number) {
    await this.latestBlock.add("latestBlock", blockheight);
  }

  async addNullifier(nullifier: Uint8Array | string) {
    await this.nullifierStore.add(`${nullifier}`, 1);
  }

  async addUtxo(utxo: Utxo) {
    await this.utxoStore.add(`${utxo.getCommitment()}`, utxo);
  }

  async isSpent(utxo: Utxo): Promise<boolean> {
    return !!(await this.nullifierStore.get(`${utxo.getNullifier()}`));
  }

  async getUnspentUtxos() {
    const all = await this.utxoStore.getAll();
    const unspent: Utxo[] = [];
    for (const utxo of all) {
      if (!(await this.isSpent(utxo))) {
        unspent.push(utxo);
      }
    }
    return unspent;
  }

  async getUtxosUpTo(amount: BigNumberish): Promise<Utxo[]> {
    const unspent = await this.getUnspentUtxos();
    const results: Utxo[] = [];
    let total = BigNumber.from(0);
    for (const note of unspent) {
      total = total.add(note.amount);
      results.push(note);
      if (total.gte(amount)) break;
    }
    if (total.lt(amount)) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
    return results;
  }

  async getBalance(): Promise<BigNumber> {
    const unspent = await this.getUnspentUtxos();

    return unspent.reduce((acc: BigNumber, utxo: Utxo) => {
      return acc.add(utxo.amount);
    }, BigNumber.from(0));
  }
}