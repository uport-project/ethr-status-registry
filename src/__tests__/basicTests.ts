import 'jest-extended'

import { EthrStatusRegistry } from '../index'
import HttpProvider from 'ethjs-provider-http'
import Contract from '@truffle/contract'
import * as RevocationRegistryContract from 'revocation-registry'
import Web3 from 'web3'
import * as ganache from 'ganache-cli'
import { DIDDocument } from 'did-resolver'
import { SimpleSigner, createJWT } from 'did-jwt'

const privateKey = 'a285ab66393c5fdda46d6fbad9e27fafd438254ab72ad5acb681a0e9f20f5d7b'
const signerAddress = '0x2036c6cd85692f0fb2c26e6c6b2eced9e4478dfd'
const issuer: string = `did:ethr:${signerAddress}`
const signer = SimpleSigner(privateKey)

describe('EthrStatusRegistry', () => {
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

  describe('error scenarios', () => {
    it('should be able to instantiate Status using infura ID', () => {
      expect(new EthrStatusRegistry({ infuraProjectId: 'none' })).not.toBeNil()
    })

    it('should be able to instantiate Status using single network definition', () => {
      expect(new EthrStatusRegistry({ rpcUrl: 'example.com' })).not.toBeNil()
    })

    it('should be able to instantiate Status using multiple network definitions', () => {
      expect(
        new EthrStatusRegistry({
          networks: [
            { name: 'mainnet', rpcUrl: 'example.com' },
            { name: 'rinkeby', rpcUrl: 'rinkeby.example.com' },
            { name: 'local', provider: new HttpProvider('http://localhost:8545') }
          ]
        })
      ).not.toBeNil()
    })

    it('should have proper signature for "asMethodName"', () => {
      let mapping = new EthrStatusRegistry({ infuraProjectId: 'none' }).asStatusMethod
      expect(mapping['EthrStatusRegistry2019']).toBeFunction
    })

    it(`should reject unknown status method`, async () => {
      const token = await createJWT({ status: { type: 'unknown', id: 'something something' } }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({ infuraProjectId: 'none' })
      await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toMatch(
        'unsupported credential status method'
      )
    })

    it(`should reject unknown networkIDs`, async () => {
      const token = await createJWT({ status: statusEntry }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'some net', rpcUrl: 'example.com' }]
      })
      await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toMatch(
        'networkId (ganache) for status check not configured'
      )
    })

    it(`should throw an error when the RPC endpoint is mis-configured`, async () => {
      const token = await createJWT({ status: statusEntry }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'ganache', rpcUrl: '0.0.0.0' }]
      })

      await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toThrow(/CONNECTION ERROR/)
    })
  })

  describe('happy path', () => {
    it(`should return valid credential status`, async () => {
      const token = await createJWT({ status: statusEntry }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'ganache', provider: provider }]
      })
      await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
        revoked: false
      })
    })

    it(`should return revoked status for real credential`, async () => {
      const token =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMwNDczNTEsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHgxZmNmOGZmNzhhYzUxMTdkOWM5OWI4MzBjNzRiNjY2OGQ2YWMzMjI5In0.MHabafA0UxJuQJ0Z-7Egb57WRlgj4_zf96B0LUhRyXgVDU5RABIczTTTXWjcuKVzhJc_-FuhRI8uQYmQQNxKzgA'

      // proj ID only usable for this test
      const statusChecker = new EthrStatusRegistry({ infuraProjectId: 'ec9c99d75b834bac8dd4bfacad8cfdf7' })

      const referenceDoc = {
        id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229',
        publicKey: [
          {
            id: 'did:ethr:0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229#owner',
            type: 'Secp256k1VerificationKey2018',
            ethereumAddress: '0x1fcf8ff78ac5117d9c99b830c74b6668d6ac3229'
          }
        ]
      } as DIDDocument

      await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
        revoked: true
      })
    })
  })
})
