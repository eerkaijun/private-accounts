## ZK Circuits and SDK

The packages in this repository is modular and can also be used in external projects for their own customized purposes. There are three main packages:
1. `circuits` contains the zero knowledge circuits written in Circom for the multi-asset shielded pool.
2. `sdk` contains the helper functions written in Typescript needed to generate ZK proofs on the client side (e.g. browser) 
3. `contracts` contains the smart contracts to verify the ZK proofs on-chain

Running `pnpm build` at the root directory will compile all the packages. Example usage of these packages can be found at the `wallet` directory (check out the `package.json` [file](https://github.com/eerkaijun/private-accounts/blob/main/wallet/package.json)).

TODO: publish on npm
