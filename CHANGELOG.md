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
