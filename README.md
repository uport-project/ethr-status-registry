# ethr-status-registry
Verifiable Credential status resolver using an ethereum contract as registry

This library can check the revocation status of a credential against a registry deployed as an 
[ethereum smart contract](https://github.com/uport-project/revocation-registry).
Only credentials that supply a `status` field are considered, and only issuer revocations matter in this early version.

## Usage
Normally, this is used in conjunction with the [`credential-status`](https://github.com/uport-project/credential-status)
library, so besides configuring it there's not much else to do.
But, if your use-case requires direct verification it can also be used independently:

```typescript
const statusReg = new EthrStatusRegistry(config)
const revocationStatus = statusReg.checkStatus(token)
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

//... obtain issuer DID document either from `did-jwt`->`verifyJWT` or `did-resolver` -> `resolve()`

const result = await status.checkStatus(token, didDoc)

// { "revoked": true }
```

You can also use your own web3 providers and can specify your own custom networks:
```typescript
new EthrStatusRegistry({
  networks: [
    { name: 'mainnet', rpcUrl: 'http://127.0.0.1:8545' },
    { name: 'rinkeby', rpcUrl: 'rinkeby.example.com' },
    { name: 'customNetwork', provider: new HttpProvider('http://custom.network:8545') }
  ]
})
```

### Example
An example JWT that includes a `status` field:
`eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMwNTIyOTAsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6cmlua2VieToweGYzYmVhYzMwYzQ5OGQ5ZTI2ODY1ZjM0ZmNhYTU3ZGJiOTM1YjBkNzQifQ.gCAqXK74HJkMfaNN6gJ-BwDCyl-D-pO7zpuxBK0fUmaExaeg35cmi021RVTBQvE3TAlXi_p1JX9uyFG-SXU3vwE`
The payload of this token decodes like this:
```json
{
  "iss": "did:ethr:rinkeby:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74",
  "credentialStatus": {
    "type": "EthrStatusRegistry2019",
    "id": "rinkeby:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450"
  }
//...
}
```
This is based on the `credentialStatus` proposal in the W3C spec.

#### How this works
This tells the `credential-status` library that this credential revocation status can be checked using the
`EthrStatusRegistry2019` implementation.
This means that such an implementation has to be provided to it during construction.
This library provides such an implementation and maps it to the correct method (`EthrStatusRegistry2019`) through the
`asStatusMethod` property.

Next, this library interprets the status field, extracting the registry address 
`0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450` and the network name `rinkeby` where the contract should be hosted.

Next, a `keccak` hash of the credential is computed and the `ethereumAddress` of the issuer is extracted from the `iss`
field.

These 2 parameters are then used to call the `revoked()` method of the contract and obtain a boolean result.

## Notes
Consider this a draft implementation since many of the standards are still being developed.

### Limitations
* only ethr-did issuers are supported in this version
* only issuer revocations are considered
* since the current contract returns a boolean result it's not easy to learn the time of revocation.
  This will probably be fixed in a future version of the contract.

### Potential improvements
* a likely improvement to be expected is to use `ethereumAddress` fields from the issuer DID document to check against
the contract.
* another one is the ability to provide a list of "revokers" that will be checked for every given credential.
* also, there may be default registries deployed so that credentials don't have to specify their own. 

Improvement proposals are welcome.
