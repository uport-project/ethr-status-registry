import { createJWT, decodeJWT, SimpleSigner } from 'did-jwt'

const signer = SimpleSigner(
  'your private key here' //TODO: fill this in
)
const address = '0x address corresponding to your private key here'
const did = `did:ethr:${address}`

it('creates test JWT', async () => {
  const token = await createJWT(
      {
        status: {
          type: 'EthrStatusRegistry2019',
          id: 'rinkeby:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450'
        }
      },
      { issuer: did, signer, alg: 'ES256K-R' }
    )
  console.log(`generated the token: ${token}`)
  console.log(`which expands to:\n`, decodeJWT(token).payload)
})
