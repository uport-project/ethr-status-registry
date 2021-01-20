## [2.1.3](https://github.com/uport-project/ethr-status-registry/compare/2.1.2...2.1.3) (2021-01-20)


### Bug Fixes

* **deps:** update dependency ethers to v5 ([#81](https://github.com/uport-project/ethr-status-registry/issues/81)) ([a02590d](https://github.com/uport-project/ethr-status-registry/commit/a02590d2e52214c9cec91c23056d4db567cb3f85))

## [2.1.2](https://github.com/uport-project/ethr-status-registry/compare/2.1.1...2.1.2) (2020-06-11)


### Bug Fixes

* **deps:** update dependency did-resolver to v2 ([46d7bd6](https://github.com/uport-project/ethr-status-registry/commit/46d7bd6aa4cef065e041d5edbb47351bffb2a37d))

## [2.1.1](https://github.com/uport-project/ethr-status-registry/compare/2.1.0...2.1.1) (2020-05-08)


### Bug Fixes

* increase default gasPrice for revocation to 1 GWei ([b3d6c2d](https://github.com/uport-project/ethr-status-registry/commit/b3d6c2df458a1f9a0b7c2fcfc93edf35dd10a926))

# [2.1.0](https://github.com/uport-project/ethr-status-registry/compare/2.0.0...2.1.0) (2020-05-08)


### Features

* allow overrides for some transaction parameters for revocation ([12a3ecb](https://github.com/uport-project/ethr-status-registry/commit/12a3ecb884e35865402d913b74e2c2688efdcc14))
* automatically compute nonce in ExternalSignerProvider ([564f5c0](https://github.com/uport-project/ethr-status-registry/commit/564f5c0cf69ff18ee7c02dff52dacb5f04fa5a72))
* implement address recovery in ExternalSignerProvider ([e14956a](https://github.com/uport-project/ethr-status-registry/commit/e14956a3f986d6e2225b12a52ba47fe032e737e8))

# [2.0.0](https://github.com/uport-project/ethr-status-registry/compare/1.3.1...2.0.0) (2020-05-08)


### Features

* stabilize revocation using externalized signer ([819ead4](https://github.com/uport-project/ethr-status-registry/commit/819ead48641f665bfb64a10a67f73207e39e76a5))


### BREAKING CHANGES

* switched to ethers.js instead of eth-js
This means it will internally create `JsonRpcProvider` instead of `HttpProvider` when configured with `rpcUrl`

## [1.3.1](https://github.com/uport-project/ethr-status-registry/compare/1.3.0...1.3.1) (2020-04-29)


### Bug Fixes

* **deps:** name `revocation-registry` as a direct dependency ([fc40831](https://github.com/uport-project/ethr-status-registry/commit/fc40831af99969274dd02ae0a5677e005d3046cc))

# [1.3.0](https://github.com/uport-project/ethr-status-registry/compare/1.2.0...1.3.0) (2020-04-29)


### Features

* update path for status entry ([87f3e75](https://github.com/uport-project/ethr-status-registry/commit/87f3e756d49717184a7134244d02c2212cf95a13)), closes [#18](https://github.com/uport-project/ethr-status-registry/issues/18)

# [1.2.0](https://github.com/uport-project/ethr-status-registry/compare/1.1.2...1.2.0) (2020-04-29)


### Features

* add experimental revoker code ([6fc2853](https://github.com/uport-project/ethr-status-registry/commit/6fc2853ba21080dbd198f4e84e9213f3159e6435)), closes [#5](https://github.com/uport-project/ethr-status-registry/issues/5)

## [1.1.2](https://github.com/uport-project/ethr-status-registry/compare/1.1.1...1.1.2) (2020-04-23)


### Bug Fixes

* `this` field getting lost in typescript leading to crash ([b761fc1](https://github.com/uport-project/ethr-status-registry/commit/b761fc14deb015026acfdaafc88c290ab3652f0d)), closes [#14](https://github.com/uport-project/ethr-status-registry/issues/14)

## [1.1.1](https://github.com/uport-project/ethr-status-registry/compare/1.1.0...1.1.1) (2020-04-22)


### Bug Fixes

* **build:** fix path for main attribute in package.json ([facc36a](https://github.com/uport-project/ethr-status-registry/commit/facc36a6af9cd58939dad929d7184ed9bfb9ed8c))
* **test:** fix rpc url for tests ([130185e](https://github.com/uport-project/ethr-status-registry/commit/130185ea280de00c585124080b225f3942148cbb))

# [1.1.0](https://github.com/uport-project/ethr-status-registry/compare/1.0.0...1.1.0) (2020-02-04)


### Features

* require a `didDoc` during status checks ([9d3ba13](https://github.com/uport-project/ethr-status-registry/commit/9d3ba13430d001648b75694a40f1dc5dc03c887a))
* use the DIDDocument param to gather list of valid revoker addresses ([28d9376](https://github.com/uport-project/ethr-status-registry/commit/28d9376ea702cf8a668c29b332fe57862a03f452)), closes [#7](https://github.com/uport-project/ethr-status-registry/issues/7)

# 1.0.0 (2019-11-11)


### Features

* add configuration methods ([1020e47](https://github.com/uport-project/ethr-status-registry/commit/1020e478140b082d8dfb92444af1f8b39071abcc))
* add contract calls, using hardcoded credential hash ([94f3533](https://github.com/uport-project/ethr-status-registry/commit/94f35339d63fc584628997ac2b12dd8dc45d007f))
* add method to parse registry ID ([4e27dcf](https://github.com/uport-project/ethr-status-registry/commit/4e27dcf1bc4712a600378c81586b69a3ab7af1cb))
* add registry contract abi ([c122830](https://github.com/uport-project/ethr-status-registry/commit/c12283017af050730e6570b672288bb378b6bc3d))
* hash credential and perform on-chain status check ([23e74c3](https://github.com/uport-project/ethr-status-registry/commit/23e74c3788b1bcb7d80d81449c6f116791c6eb54))
* return object containing boolean `revoked` field to match contract ([fd6b4b8](https://github.com/uport-project/ethr-status-registry/commit/fd6b4b8a4dc51873cde3865cac5dd4395f91a240))
