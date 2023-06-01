#!/bin/sh

# Ideally we would expose a cli that built circuits and managed this
mkdir -p ./public/circuits
cp -r ../circuits/compiled/transaction* ./public/circuits
cp ../contracts/artifacts/contracts/mocks/MockErc20.sol/MockErc20.json ./contracts/
cp ../contracts/artifacts/contracts/MultiAssetShieldedPool.sol/MultiAssetShieldedPool.json ./contracts/
cp ../contracts/artifacts/contracts/mocks/MockSwapRouter.sol/MockSwapRouter.json ./contracts/
cp ../contracts/artifacts/contracts/SwapExecutor.sol/SwapExecutor.json ./contracts/
cp -r ../contracts/typechain-types ./typechain-types
