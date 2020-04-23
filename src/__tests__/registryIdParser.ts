import { EthrStatusRegistry } from '../index'

let method = new EthrStatusRegistry({ infuraProjectId: '' }).parseRegistryId

describe('registry ID parser', () => {
  it('throws on invalid addresses', () => {
    expect(() => {
      method('asdf')
    }).toThrow(/Not a valid status registry ID/)
    expect(() => {
      method('')
    }).toThrow(/Not a valid status registry ID/)
    expect(() => {
      method('mainnet:0x')
    }).toThrow(/Not a valid status registry ID/)
    expect(() => {
      method('mainnet:0xa5df')
    }).toThrow(/Not a valid status registry ID/)
    expect(() => {
      method('0xa5df')
    }).toThrow(/Not a valid status registry ID/)
  })

  it('parses simple address', () => {
    expect(method('0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450')).toMatchObject([
      '0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450',
      'mainnet'
    ])
  })

  it('parses address with mainnet', () => {
    expect(method('mainnet:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450')).toMatchObject([
      '0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450',
      'mainnet'
    ])
  })

  it('parses address with testnet', () => {
    expect(method('testnet:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450')).toMatchObject([
      '0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450',
      'testnet'
    ])
  })

  it('parses address with chainid', () => {
    expect(method('0x1:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450')).toMatchObject([
      '0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450',
      '0x1'
    ])
  })

  it('parses address with byte chainid', () => {
    expect(method('0x2a:0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450')).toMatchObject([
      '0x1E4651dca5Ef38636e2E4D7A6Ff4d2413fC56450',
      '0x2a'
    ])
  })
})
