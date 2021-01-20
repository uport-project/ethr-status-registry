import {
  configureResolverWithNetworks,
  InfuraConfiguration,
  MultiProviderConfiguration,
  NetworkConfiguration
} from './configuration'

import { methodName, JWTDecodedExtended } from './EthrStatusRegistry'
import { ExternalSignerProvider, SignerMethod } from './ExternalSignerProvider'

import { decodeJWT } from 'did-jwt'
import { TransactionRequest } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { toUtf8Bytes } from '@ethersproject/strings'
import { keccak256 } from '@ethersproject/keccak256'

import { abi as RevocationRegistryABI } from 'revocation-registry'

// experimental API, expect breaking changes
export class EthrCredentialRevoker {
  private networks: NetworkConfiguration = {}
  constructor(conf: InfuraConfiguration | MultiProviderConfiguration) {
    this.networks = configureResolverWithNetworks(conf)
  }

  async revoke(
    token: string,
    ethSign?: SignerMethod,
    txOptions?: Partial<TransactionRequest>
  ): Promise<string> {
    const decoded = decodeJWT(token) as JWTDecodedExtended
    const statusEntry = decoded.payload.credentialStatus

    if (!statusEntry) {
      throw new Error('credential_not_revocable; no status field embedded')
    }

    if (statusEntry.type !== methodName) {
      throw new Error('unsupported_revocation_method; only EthrStatusRegistry2019 is supported')
    }

    const registryCoord = statusEntry.id.split(':')

    if (registryCoord.length !== 2) {
      throw new Error('credential_not_revocable; malformed `id` field in credential status entry')
    }

    const network = registryCoord[0]
    const registryAddress = registryCoord[1]
    const web3Provider = this.networks[network]

    if (!web3Provider) {
      throw new Error(
        `credential_not_revocable; no known way to access network(${network}) used in credential status entry. Check your providerConfig configuration`
      )
    }

    let provider = web3Provider
    if (ethSign) {
      provider = new ExternalSignerProvider(ethSign, provider)
    }

    const registryContract = new Contract(registryAddress, RevocationRegistryABI, provider)

    const tokenBytes = toUtf8Bytes(token)
    const hash = keccak256(tokenBytes)

    const { gasPrice, gasLimit, nonce } = { ...txOptions }

    const txOverrides = {
      gasLimit: gasLimit || 44309,
      gasPrice: gasPrice || 1000000000,
      nonce
    }

    try {
      const result = await registryContract.revoke(hash, txOverrides)
      return result.hash
    } catch (e) {
      if (e.transaction && /VM Exception while processing transaction: revert/.test(e.message)) {
        const err = new Error('credential_already_revoked') as any
        err.cause = e
        throw err
      } else {
        throw e
      }
    }
  }
}
