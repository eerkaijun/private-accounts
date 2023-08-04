# Private Accounts Smart Contracts Suite

This directory contains the core smart contracts for private accounts.

To run the tests, run `npx hardhat test`.

To try using an ERC4337 bundler to submit transactions on behalf of the burner accounts, run `npx hardhat run scripts/bundler.ts --network linea-goerli-testnet`. This uses a paymaster to sponsor the transaction of the burner account. (Prerequisite: need to set an existing address of the burner account factory on Linea testnet and also obtain a free Pimlico API key for the bundler)