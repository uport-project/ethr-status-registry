import { decodeJWT } from 'did-jwt'
import { parse, DIDDocument } from 'did-resolver'
import * as EthContract from 'ethjs-contract'
import * as StatusRegistryContractABI from './contracts/ethr-status-registry.json'
import { keccak_256 } from 'js-sha3'
import { Buffer } from 'buffer'

import { CredentialStatus, StatusMethod, StatusResolver, StatusEntry } from 'credential-status'

import {
  configureResolverWithNetworks,
  InfuraConfiguration,
  MultiProviderConfiguration,
  NetworkConfiguration
} from './configuration'

interface JWTDecodedExtended {
  status?: StatusEntry
  [key: string]: any
}

interface MethodMapping {
  [methodName: string]: StatusMethod
}

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

  methodName = 'EthrStatusRegistry2019'
  asStatusMethod: MethodMapping = {}

  private networks: NetworkConfiguration = {}
  constructor(conf: InfuraConfiguration | MultiProviderConfiguration) {
    this.asStatusMethod[this.methodName] = this.checkStatus
    this.networks = configureResolverWithNetworks(conf)
  }

  async checkStatus(credential: string, didDoc: DIDDocument): Promise<null | CredentialStatus> {
    const decodedJWT = decodeJWT(credential).payload as JWTDecodedExtended

    if (decodedJWT.status?.type === this.methodName) {
      const [registryAddress, networkId] = this.parseRegistryId(decodedJWT?.status?.id)

      if (!this.networks[networkId]) {
        return Promise.reject(`networkId (${networkId}) for status check not configured`)
      }

      const eth = this.networks[networkId]
      const StatusRegContract = new EthContract(eth)(StatusRegistryContractABI)
      const statusReg = StatusRegContract.at(registryAddress)

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
    const hash = Buffer.from(keccak_256.arrayBuffer(credential)).toString('hex')
    const credentialHash = `0x${hash}`

    interface RevocationResult {
      [index: string]: boolean
    }

    try {
      const rawResult: RevocationResult = await statusReg.revoked(issuerAddress, credentialHash)
      const isRevoked: boolean = rawResult['0']
      return { revoked: isRevoked }
    } catch (e) {
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
