import 'jest-extended'

import { EthrStatusRegistry } from '../index'
import { Status } from 'credential-status'
import { DIDDocument } from 'did-resolver'

it(`should return revoked credential status when invoked through wrapper lib`, async () => {
  const referenceToken =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1ODgxNzE4MDAsInN1YiI6ImRpZDp3ZWI6dXBvcnQubWUiLCJub25jZSI6IjM4NzE4Njc0NTMiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiQXdlc29tZW5lc3NDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Iml0IjoicmVhbGx5IHdoaXBzIHRoZSBsbGFtbWEncyBhc3MhIn19LCJjcmVkZW50aWFsU3RhdHVzIjp7InR5cGUiOiJFdGhyU3RhdHVzUmVnaXN0cnkyMDE5IiwiaWQiOiJyaW5rZWJ5OjB4OTdmZDI3ODkyY2RjRDAzNWRBZTFmZTcxMjM1YzYzNjA0NEI1OTM0OCJ9LCJpc3MiOiJkaWQ6ZXRocjoweDU0ZDU5ZTNmZmQ3NjkxN2Y2MmRiNzAyYWMzNTRiMTdmMzg0Mjk1NWUifQ.kpUbDVrs3ouIs0vb5IqL4_FAErANCZnFE-lTMlC9Hzpwa4u3_8BaJg4y1KIHq_ROr2oEam9UAujd5A4FbbzFoA'

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

  const ethrStatus = new EthrStatusRegistry({
    // rpc only usable for this test
    networks: [{ name: 'rinkeby', rpcUrl: 'https://rinkeby.infura.io/v3/ec9c99d75b834bac8dd4bfacad8cfdf7' }]
  })

  const statusChecker = new Status({
    ...ethrStatus.asStatusMethod
  })

  await expect(statusChecker.checkStatus(referenceToken, referenceDoc)).resolves.toMatchObject({
    revoked: true
  })
})
