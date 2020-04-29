import { DIDDocument, PublicKey } from 'did-resolver'
const sign = require('ethjs-signer').sign
import 'jest-extended'

import { EthrStatusRegistry } from '../index'
import { EthrCredentialRevoker } from '../EthrCredentialRevoker'
import * as RevocationRegistryContract from 'revocation-registry'
import Contract from '@truffle/contract'
import Web3 from 'web3'
import * as ganache from 'ganache-cli'
import { SimpleSigner, createJWT } from 'did-jwt'

const privateKey = 'a285ab66393c5fdda46d6fbad9e27fafd438254ab72ad5acb681a0e9f20f5d7b'
const signerAddress = '0x2036c6cd85692f0fb2c26e6c6b2eced9e4478dfd'
const issuer: string = `did:ethr:${signerAddress}`
const signer = SimpleSigner(privateKey)

describe('EthrCredentialRevoker', () => {
  const provider = ganache.provider()
  const RevocationReg = Contract(RevocationRegistryContract)
  const web3 = new Web3(provider)
  const getAccounts = () =>
    new Promise((resolve, reject) =>
      web3.eth.getAccounts((error: any, accounts: string[]) => (error ? reject(error) : resolve(accounts)))
    )
  RevocationReg.setProvider(provider)

  let registry, accounts: string[], referenceDoc: DIDDocument, statusEntry: object, revokerAddress: string

  beforeAll(async () => {
    accounts = (await getAccounts()) as string[]
    revokerAddress = accounts[1]

    const txReceipt = await web3.eth.sendTransaction({
      to: signerAddress,
      from: accounts[0],
      value: '0xde0b6b3a7640000',
      gas: 21000,
      nonce: 0
    })

    registry = await RevocationReg.new({
      from: accounts[0],
      gasPrice: 100000000000,
      gas: 4712388
    })

    referenceDoc = {
      '@context': 'https://w3id.org/did/v1',
      id: issuer,
      authentication: [
        {
          type: 'Secp256k1SignatureAuthentication2018',
          publicKey: `${issuer}#owner`
        }
      ],
      publicKey: [
        {
          id: `${issuer}#owner`,
          type: 'Secp256k1VerificationKey2018',
          ethereumAddress: signerAddress
        },
        {
          id: `${issuer}#revoker`,
          type: 'Secp256k1VerificationKey2018',
          ethereumAddress: revokerAddress
        }
      ]
    } as DIDDocument

    statusEntry = {
      type: 'EthrStatusRegistry2019',
      id: `ganache:${registry.address}`
    }
  })

  describe('round trip', () => {
    it.skip(`should revoke credential and return revoked status`, async () => {
      const token = await createJWT({ status: statusEntry }, { issuer: `did:ethr:${revokerAddress}`, signer })
      // 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMwNDczNTEsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHgxZmNmOGZmNzhhYzUxMTdkOWM5OWI4MzBjNzRiNjY2OGQ2YWMzMjI5In0.MHabafA0UxJuQJ0Z-7Egb57WRlgj4_zf96B0LUhRyXgVDU5RABIczTTTXWjcuKVzhJc_-FuhRI8uQYmQQNxKzgA'

      let myProvider = provider
      myProvider.sendAsync = myProvider.send
      const revoker = new EthrCredentialRevoker({ networks: [{ name: 'ganache', provider: myProvider }] })
      const ethSigner = (rawTx: any, cb: any) => cb(null, sign(rawTx, '0x' + privateKey))

      const revocationCall = await revoker.revoke(token, revokerAddress, ethSigner)

      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'ganache', provider: provider }]
      })

      await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
        revoked: true
      })
    })
  })
})
