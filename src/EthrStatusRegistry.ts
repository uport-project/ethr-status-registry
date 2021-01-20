import { decodeJWT } from 'did-jwt'
import { DIDDocument } from 'did-resolver'
import { abi as StatusRegistryContractABI } from 'revocation-registry'
import { CredentialStatus, StatusMethod, StatusResolver, StatusEntry } from 'credential-status'
import {
  configureResolverWithNetworks,
  InfuraConfiguration,
  MultiProviderConfiguration,
  NetworkConfiguration
} from './configuration'

import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { toUtf8Bytes } from '@ethersproject/strings'
import { keccak256 } from '@ethersproject/keccak256'

export interface JWTDecodedExtended {
  status?: StatusEntry
  [key: string]: any
}

interface MethodMapping {
  [methodName: string]: StatusMethod
}

export const methodName = 'EthrStatusRegistry2019'

export class EthrStatusRegistry implements StatusResolver {
  // look for ethereumAddress entries in didDoc
  static filterDocForAddresses(didDoc: DIDDocument): string[] {
    const keyEntries: string[] = didDoc.publicKey
      .filter(
        (entry) => entry?.type === 'Secp256k1VerificationKey2018' && typeof entry?.ethereumAddress !== 'undefined'
      )
      .map((entry) => entry?.ethereumAddress || '')
      .filter((address) => address !== '')

    return keyEntries
  }

  asStatusMethod: MethodMapping = {}

  private networks: NetworkConfiguration = {}
  constructor(conf: InfuraConfiguration | MultiProviderConfiguration) {
    this.asStatusMethod[methodName] = (cred, doc) => {
      return this.checkStatus(cred, doc)
    }
    this.networks = configureResolverWithNetworks(conf)
  }

  async checkStatus(credential: string, didDoc: DIDDocument): Promise<null | CredentialStatus> {
    const decodedJWT = decodeJWT(credential).payload as JWTDecodedExtended

    const statusEntry = decodedJWT.credentialStatus
    if (!statusEntry) {
      return Promise.resolve({ status: 'NonRevocable' })
    }

    if (statusEntry.type === methodName) {
      const [registryAddress, networkId] = this.parseRegistryId(statusEntry.id)

      if (!this.networks[networkId]) {
        return Promise.reject(`networkId (${networkId}) for status check not configured`)
      }

      const statusReg = new Contract(registryAddress, StatusRegistryContractABI, this.networks[networkId])

      const revokers = this.parseRevokers(credential, didDoc, decodedJWT.iss)
      const asyncChecks: Array<Promise<null | CredentialStatus>> = revokers.map((revoker) =>
        this.runCredentialCheck(credential, revoker, statusReg)
      )

      const partials = await Promise.all(asyncChecks)

      const gatherResultsLambda = (verdict: CredentialStatus, partial: CredentialStatus | null) => {
        verdict.revoked = verdict?.revoked || partial?.revoked
        return verdict
      }

      const result = partials
        .filter((res) => res != null && typeof res.revoked !== 'undefined')
        .reduce(gatherResultsLambda, { revoked: false })

      return Promise.resolve(result)
    } else {
      return Promise.reject(`unsupported credential status method`)
    }
  }

  parseRegistryId(id: string): [string, string] {
    const parsedId = id.match(/^((.*):)?(0x[0-9a-fA-F]{40})$/)
    if (!parsedId) throw new Error(`Not a valid status registry ID: ${id}`)

    const registryAddress = parsedId[3]
    const networkId = !parsedId[1] ? 'mainnet' : parsedId[2]
    return [registryAddress, networkId]
  }

  private async runCredentialCheck(
    credential: string,
    issuerAddress: string,
    statusReg: any // the contract instance as returned by ethjs-contract
  ): Promise<null | CredentialStatus> {
    const tokenBytes = toUtf8Bytes(credential)
    const credentialHash = keccak256(tokenBytes)

    interface RevocationResult {
      [index: string]: boolean
    }

    try {
      const revocationBlock: BigNumber = await statusReg.revoked(issuerAddress, credentialHash)
      return { revoked: !revocationBlock.isZero() }
    } catch (e) {
      if (typeof e.statusCode !== 'undefined' || e.code === 'NETWORK_ERROR') {
        return Promise.reject(new Error('CONNECTION ERROR'))
      }
      return Promise.reject(e)
    }
  }

  private parseRevokers(credential: string, didDoc: DIDDocument, issuer: string): string[] {
    const ethereumAddresses = EthrStatusRegistry.filterDocForAddresses(didDoc)
    //     const derivedAddresses = this.filterDocForSecpKeys(didDoc)
    const revokers: string[] = Array.from(
      new Set([
        ...ethereumAddresses
        //       ...derivedAddresses
      ])
    )

    return revokers
  }
}
