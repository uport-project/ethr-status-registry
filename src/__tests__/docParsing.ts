import { DIDDocument, PublicKey } from 'did-resolver'
import { EthrStatusRegistry } from '../index'

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
    },
    {
      id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229#key-1',
      type: 'Secp256k1VerificationKey2018',
      ethereumAddress: '0x34015abcb36d716610d69cf036f29882909bdae3',
      owner: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229'
    },
    {
      id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229#key-2',
      type: 'Secp256k1VerificationKey2018',
      publicKeyHex: '0x02abc15abcb36d716610d69cf036f29882909bdae310d69cf036f29882909bdae3',
      owner: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229'
    },
    {
      id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229#key-3',
      type: 'Ed25519VerificationKey2018',
      publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV'
    }
  ]
} as DIDDocument

it(`should extract addresses from DID doc`, async () => {
  const addresses = EthrStatusRegistry.filterDocForAddresses(referenceDoc)
  const expectedAddresses = ['0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229', '0x34015abcb36d716610d69cf036f29882909bdae3']
  expect(addresses).toEqual(expect.arrayContaining(expectedAddresses))
})
