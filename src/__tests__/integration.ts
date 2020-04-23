import 'jest-extended'

import { EthrStatusRegistry } from '../index'
import { Status } from 'credential-status'
import { DIDDocument } from 'did-resolver'

const referenceDoc = {
  '@context': 'https://w3id.org/did/v1',
  id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229',
  authentication: [
    {
      type: 'Secp256k1SignatureAuthentication2018',
      publicKey: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229#owner'
    }
  ],
  publicKey: [
    {
      id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229#owner',
      type: 'Secp256k1VerificationKey2018',
      ethereumAddress: '0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229',
      owner: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229'
    }
  ]
} as DIDDocument

//only usable for this test
const rinkebyRPC = 'https://rinkeby.infura.io/v3/ec9c99d75b834bac8dd4bfacad8cfdf7'

it(`should return revoked credential status when invoked through wrapper lib`, async () => {
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMwNDczNTEsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHgxZmNmOGZmNzhhYzUxMTdkOWM5OWI4MzBjNzRiNjY2OGQ2YWMzMjI5In0.MHabafA0UxJuQJ0Z-7Egb57WRlgj4_zf96B0LUhRyXgVDU5RABIczTTTXWjcuKVzhJc_-FuhRI8uQYmQQNxKzgA'
  const ethrStatus = new EthrStatusRegistry({
    networks: [{ name: 'rinkeby', rpcUrl: rinkebyRPC }]
  })

  const statusChecker = new Status({
    ...ethrStatus.asStatusMethod
  })

  await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
    revoked: true
  })
})
