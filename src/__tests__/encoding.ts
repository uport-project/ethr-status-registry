import { keccak_256 } from 'js-sha3'
import { Buffer } from 'buffer'

it('can export an array of bytes as hex string', () => {
  expect(Buffer.from([0, 1, 2]).toString('hex')).toBe('000102')
})

it('can create buffer from a string', () => {
  expect(Buffer.from('hello').toString('hex')).toBe('68656c6c6f')
})

it('can hash a message', () => {
  const message = 'hello'
  expect(Buffer.from(keccak_256(message), 'hex').toString('hex')).toBe(
    '1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8'
  )
})
