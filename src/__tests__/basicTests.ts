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
      const token = await createJWT(
        { credentialStatus: { type: 'unknown', id: 'something something' } },
        { issuer, signer }
      )
      const statusChecker = new EthrStatusRegistry({ infuraProjectId: 'none' })
      await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toMatch(
        'unsupported credential status method'
      )
    })

    it(`should reject unknown networkIDs`, async () => {
      const token = await createJWT({ credentialStatus: statusEntry }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'some net', rpcUrl: 'example.com' }]
      })
      await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toMatch(
        'networkId (ganache) for status check not configured'
      )
    })

    it(`should throw an error when the RPC endpoint is mis-configured`, async () => {
      const token = await createJWT({ credentialStatus: statusEntry }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'ganache', rpcUrl: '0.0.0.0' }]
      })

      await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toThrow(/CONNECTION ERROR/)
    })
  })

  describe('happy path', () => {
    it(`should ignore non-revocable credentials`, async () => {
      const token = await createJWT({}, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({ infuraProjectId: 'none' })
      await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({ status: 'NonRevocable' })
    })

    it(`should return valid credential status`, async () => {
      const token = await createJWT({ credentialStatus: statusEntry }, { issuer, signer })
      const statusChecker = new EthrStatusRegistry({
        networks: [{ name: 'ganache', provider: provider }]
      })
      await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
        revoked: false
      })
    })

    it(`should return revoked status for real credential`, async () => {
      const referenceToken =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1ODgxNzE4MDAsInN1YiI6ImRpZDp3ZWI6dXBvcnQubWUiLCJub25jZSI6IjM4NzE4Njc0NTMiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiQXdlc29tZW5lc3NDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Iml0IjoicmVhbGx5IHdoaXBzIHRoZSBsbGFtbWEncyBhc3MhIn19LCJjcmVkZW50aWFsU3RhdHVzIjp7InR5cGUiOiJFdGhyU3RhdHVzUmVnaXN0cnkyMDE5IiwiaWQiOiJyaW5rZWJ5OjB4OTdmZDI3ODkyY2RjRDAzNWRBZTFmZTcxMjM1YzYzNjA0NEI1OTM0OCJ9LCJpc3MiOiJkaWQ6ZXRocjoweDU0ZDU5ZTNmZmQ3NjkxN2Y2MmRiNzAyYWMzNTRiMTdmMzg0Mjk1NWUifQ.kpUbDVrs3ouIs0vb5IqL4_FAErANCZnFE-lTMlC9Hzpwa4u3_8BaJg4y1KIHq_ROr2oEam9UAujd5A4FbbzFoA'

      // proj ID only usable for this test
      const statusChecker = new EthrStatusRegistry({ infuraProjectId: 'ec9c99d75b834bac8dd4bfacad8cfdf7' })

      const referenceDoc = {
        id: 'did:ethr:0x54d59e3ffd76917f62db702ac354b17f3842955e',
        publicKey: [
          {
            id: 'did:ethr:0x54d59e3ffd76917f62db702ac354b17f3842955e#owner',
            type: 'Secp256k1VerificationKey2018',
            ethereumAddress: '0x54d59e3ffd76917f62db702ac354b17f3842955e'
          }
        ]
      } as DIDDocument

      await expect(statusChecker.checkStatus(referenceToken, referenceDoc)).resolves.toMatchObject({
        revoked: true
      })
    })
  })
})
