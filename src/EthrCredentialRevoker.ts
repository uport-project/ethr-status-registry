import {
  configureResolverWithNetworks,
  InfuraConfiguration,
  MultiProviderConfiguration,
  NetworkConfiguration
} from './configuration'

import { methodName, JWTDecodedExtended } from './EthrStatusRegistry'
import { ExternalSignerProvider, SignerMethod } from './ExternalSignerProvider'

import { decodeJWT } from 'did-jwt'
import { ethers } from 'ethers'

import { abi as RevocationRegistryABI } from 'revocation-registry'

// experimental API, expect breaking changes
export class EthrCredentialRevoker {
  private networks: NetworkConfiguration = {}
  constructor(conf: InfuraConfiguration | MultiProviderConfiguration) {
    this.networks = configureResolverWithNetworks(conf)
  }

  async revoke(token: string, ethSign?: SignerMethod): Promise<string> {
    const decoded = decodeJWT(token) as JWTDecodedExtended
    const statusEntry = decoded.payload.credentialStatus

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
      provider = new ExternalSignerProvider(ethSign, provider)
    }

    const registryContract = new ethers.Contract(registryAddress, RevocationRegistryABI, provider)

    const tokenBytes = ethers.utils.toUtf8Bytes(token)
    const hash = ethers.utils.keccak256(tokenBytes)

    const result = await registryContract.revoke(hash, {
      gasLimit: 44309
    })

    return result.hash
  }
}
