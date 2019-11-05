import { createJWT, SimpleSigner } from 'did-jwt'

const signer = SimpleSigner(
  '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f'
)
const address = '0xf3beac30c498d9e26865f34fcaa57dbb935b0d74'
const did = `did:ethr:${address}`

test('create test JWT', async () => {
  console.log(
    await createJWT(
      {
        status: {
          type: 'EthrStatusRegistry2019',
          id: 'rinkeby:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450'
        }
      },
      { issuer: did, signer, alg: 'ES256K-R' }
    )
  )
})

it('runs test suites', () => {})
