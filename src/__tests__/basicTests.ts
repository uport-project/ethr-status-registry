import 'jest-extended'

import { EthrStatusRegistry } from '../index'
import { DIDDocument } from 'did-resolver'
import * as HttpProvider from 'ethjs-provider-http'

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
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzI5NjY3ODAsInN0YXR1cyI6eyJ0eXBlIjoidW5rbm93biIsImlkIjoic29tZXRoaW5nIHNvbWV0aGluZyJ9LCJpc3MiOiJkaWQ6ZXRocjoweGYzYmVhYzMwYzQ5OGQ5ZTI2ODY1ZjM0ZmNhYTU3ZGJiOTM1YjBkNzQifQ.WO4kUEYy3xzZR1VlofOm3e39e1XM227uIr-Z7Yb9YQcJJ-2PRcnQmecW5fDjIfF3EInS3rRd4TZmuVQOnhaKQAE'
  const statusChecker = new EthrStatusRegistry({ infuraProjectId: 'none' })
  await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toMatch('unsupported credential status method')
})

it(`should reject unknown networkIDs`, async () => {
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzI5NzM2MjMsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHhmM2JlYWMzMGM0OThkOWUyNjg2NWYzNGZjYWE1N2RiYjkzNWIwZDc0In0.CFDlVKGWBiJwUwq14waLQ2fqLljhJG3Qci5KFhcF8zM916sN7MWFESdF1TseIOPmIcteQ_99m61dTTJ0YMY0rwE'
  const statusChecker = new EthrStatusRegistry({
    networks: [{ name: 'some net', rpcUrl: 'example.com' }]
  })
  await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toMatch(
    'networkId (rinkeby) for status check not configured'
  )
})

it(`should return valid credential status`, async () => {
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzI5NzM2MjMsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHhmM2JlYWMzMGM0OThkOWUyNjg2NWYzNGZjYWE1N2RiYjkzNWIwZDc0In0.CFDlVKGWBiJwUwq14waLQ2fqLljhJG3Qci5KFhcF8zM916sN7MWFESdF1TseIOPmIcteQ_99m61dTTJ0YMY0rwE'
  const statusChecker = new EthrStatusRegistry({
    networks: [{ name: 'rinkeby', rpcUrl: rinkebyRPC }]
  })
  await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
    revoked: false
  })
})

it(`should return revoked credential status`, async () => {
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMwNDczNTEsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHgxZmNmOGZmNzhhYzUxMTdkOWM5OWI4MzBjNzRiNjY2OGQ2YWMzMjI5In0.MHabafA0UxJuQJ0Z-7Egb57WRlgj4_zf96B0LUhRyXgVDU5RABIczTTTXWjcuKVzhJc_-FuhRI8uQYmQQNxKzgA'
  const statusChecker = new EthrStatusRegistry({
    networks: [{ name: 'rinkeby', rpcUrl: rinkebyRPC }]
  })

  await expect(statusChecker.checkStatus(token, referenceDoc)).resolves.toMatchObject({
    revoked: true
  })
})

it(`should throw an error when the RPC endpoint is mis-configured`, async () => {
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMwNDczNTEsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHgxZmNmOGZmNzhhYzUxMTdkOWM5OWI4MzBjNzRiNjY2OGQ2YWMzMjI5In0.MHabafA0UxJuQJ0Z-7Egb57WRlgj4_zf96B0LUhRyXgVDU5RABIczTTTXWjcuKVzhJc_-FuhRI8uQYmQQNxKzgA'
  const statusChecker = new EthrStatusRegistry({
    networks: [{ name: 'rinkeby', rpcUrl: '0.0.0.0' }]
  })

  await expect(statusChecker.checkStatus(token, referenceDoc)).rejects.toThrow(/CONNECTION ERROR/)
})
