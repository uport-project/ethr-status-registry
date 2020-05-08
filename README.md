# ethr-status-registry
Verifiable Credential status resolver using an ethereum contract as registry

This library can check the revocation status of a credential against a registry deployed as an 
[ethereum smart contract](https://github.com/uport-project/revocation-registry).
This library only supports credentials that embed a `credentialStatus` field.

## Usage

### Check credential status
Normally, this is used in conjunction with the [`credential-status`](https://github.com/uport-project/credential-status)
library, so besides configuring it there's not much else to do.
If your use-case requires direct verification it can also be used independently:

```typescript
const statusReg = new EthrStatusRegistry(config)

//... obtain issuer DID document either from `did-jwt`->`verifyJWT` or `did-resolver` -> `resolve()`
const revocationStatus = await statusReg.checkStatus(token, didDocument)
// {revoked : false}
```

### Config
There is an easy way to use an `infuraProjectId` to quickly configure it for the popular public ethereum networks.

```typescript
import { EthrStatusRegistry } from 'ethr-status-registry'
import { Status } from 'credential-status'

const status = new Status({
    ...new EthrStatusRegistry({infuraProjectId: 'YOUR Infura PROJECT ID HERE'}).asStatusMethod,
})
```

You can also use your own web3 providers and can specify your own custom networks:
```typescript
new EthrStatusRegistry({
  networks: [
    { name: 'mainnet', rpcUrl: 'http://127.0.0.1:8545' },
    { name: 'rinkeby', rpcUrl: 'rinkeby.example.com' },
    { name: 'customNetwork', provider: new JsonRpcProvider('http://custom.network:8545') }
  ]
})
```

### Revoke a credential
A credential can be revoked by anyone, but the convention is that issuer controlled `ethereumAddress`es are considered
valid revokers. An issuer controlled `ethereumAddress` appears as one of the PublicKey entries in the DID document of
the issuer of the credential. 

```typescript
import { EthrCredentialRevoker } from 'ethr-status-registry'
import { sign } from `ethjs-signer`

const privateKey = '0x<Issuer Private Key>'
const ethSigner = (rawTx: any, cb: any) => cb(null, sign(rawTx, privateKey))

const credential = '<JWT token with credentialStatus>'
const revoker = new EthrCredentialRevoker({ infuraProjectId: '<Your infura project ID>' })
const txHash = await revoker.revoke(credential, ethSigner)
```
after the transaction gets mined, the credential is considered revoked.

### Example
An example JWT that includes a `credentialStatus` field:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1ODg5MjIyMDEsImNyZWRlbnRpYWx
TdGF0dXMiOnsidHlwZSI6IkV0aHJTdGF0dXNSZWdpc3RyeTIwMTkiLCJpZCI6InJpbmtlYnk6MHg5N2
ZkMjc4OTJjZGNEMDM1ZEFlMWZlNzEyMzVjNjM2MDQ0QjU5MzQ4In0sImlzcyI6ImRpZDpldGhyOjB4N
TRkNTllM2ZmZDc2OTE3ZjYyZGI3MDJhYzM1NGIxN2YzODQyOTU1ZSJ9.0sLZupOnyrdZPQAhtfa2eP_
2HN_FELJu_clbXBrk9SgaU_ZO0izjDLTnNkip9RVM6ED0nLznfT35XHk6_C9S_Q
```

The payload of this token decodes like this:
```javascript
{
  "credentialStatus": {
    "type": "EthrStatusRegistry2019",
    "id": "rinkeby:0x97fd27892cdcD035dAe1fe71235c636044B59348"
  },
  "iss": "did:ethr:0x54d59e3ffd76917f62db702ac354b17f3842955e",
  //...
}
```
This is based on the `credentialStatus` proposal in the W3C spec.

The issuer of this credential (`iss`) has a DID document that contains a publicKey entry like so:
```json
{
  "type": "Secp256k1VerificationKey2018",
  "ethereumAddress": "0x54d59e3ffd76917f62db702ac354b17f3842955e"
  //...
}
```
which is considered to be a valid revoker.

#### How this works
The `credentialStatus` entry embedded in the payload tells the `credential-status` library that this credential
revocation status can be checked using the `EthrStatusRegistry2019` implementation.
This library provides such an implementation and maps it to the correct method (`EthrStatusRegistry2019`) through the
`asStatusMethod` property.

Next, this library interprets the status field, extracting the registry address
`0x97fd27892cdcD035dAe1fe71235c636044B59348` and the network name `rinkeby` where the contract should exist.

Next, it computes a `keccak` hash of the credential and gathers `ethereumAddress` entries from the issuer DID document
It uses these params to call the `revoked()` method of the contract and obtain a revocation result.

## Notes
Consider this a draft implementation since many of the standards are still in development.

### Limitations
* it supports only `ethereumAddress` entries from the provided DID document
* the library returns a boolean result, so it's not easy to learn the time of revocation.
  This will probably be fixed in a future version of the lib.

### Potential improvements
* use secp256k1 publicKey entries and automatically compute their corresponding `ethereumAddress` as valid revokers 
* provide a `credentialStatus` entry that can override or augment the entry embedded in credentials.
* also, there may be default registries deployed so that credentials don't have to specify their own.

Other improvement proposals are welcome.
