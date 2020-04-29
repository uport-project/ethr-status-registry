import {
  configureResolverWithNetworks,
  InfuraConfiguration,
  MultiProviderConfiguration,
  NetworkConfiguration
} from './configuration'

import { methodName, JWTDecodedExtended } from './EthrStatusRegistry'

import { decodeJWT } from 'did-jwt'
import SignerProvider from 'ethjs-provider-signer'
import Eth from 'ethjs-query'
import EthContract from 'ethjs-contract'

import { abi as RevocationRegistryABI } from 'revocation-registry'

import { keccak_256 } from 'js-sha3'
import { Buffer } from 'buffer'

// experimental API, expect breaking changes
export class EthrCredentialRevoker {
  private networks: NetworkConfiguration = {}
  constructor(conf: InfuraConfiguration | MultiProviderConfiguration) {
    this.networks = configureResolverWithNetworks(conf)
  }

  async revoke(token: string, revokerAddress: string, ethSign?: (rawTx: any, cb: any) => any): Promise<string> {
    const decoded = decodeJWT(token) as JWTDecodedExtended
    const statusEntry = decoded.payload.status

    if (!statusEntry) {
      throw new Error('credential_not_revokable; no status field embedded')
    }

    if (statusEntry.type !== methodName) {
      throw new Error('unsupported_revocation_method; only EthrStatusRegistry2019 is supported')
    }

    const registryCoord = statusEntry.id.split(':')

    if (registryCoord.length !== 2) {
      throw new Error('credential_not_revokable; malformed `id` field in credential status entry')
    }

    const network = registryCoord[0]
    const registryAddress = registryCoord[1]
    const web3Provider = this.networks[network]

    if (!web3Provider) {
      throw new Error(
        `credential_not_revokable; no known way to access network(${network}) used in credential status entry. Check your providerConfig configuration`
      )
    }

    let provider = web3Provider
    if (ethSign) {
      // this is hacky
      const rpcUrl = web3Provider.rpc.currentProvider.host
      provider = new SignerProvider(rpcUrl, {
        signTransaction: ethSign
      })
    }

    const eth = new Eth(provider)
    const registryContract = new EthContract(eth)(RevocationRegistryABI).at(registryAddress)

    const hash = '0x' + Buffer.from(keccak_256.arrayBuffer(token)).toString('hex')

    const result = await registryContract.revoke(hash, {
      from: revokerAddress,
      gasLimit: 45000
    })

    return result
  }
}
