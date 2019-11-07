import { decodeJWT } from 'did-jwt'
import { parse } from 'did-resolver'
import * as EthContract from 'ethjs-contract'
import * as StatusRegistryContractABI from './contracts/ethr-status-registry.json'
import { keccak_256 } from 'js-sha3'
import { Buffer } from 'buffer'

import {
  CredentialStatus,
  StatusMethod,
  StatusResolver,
  StatusEntry
} from 'credential-status'

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
  methodName = 'EthrStatusRegistry2019'
  asStatusMethod: MethodMapping = {}

  private networks: NetworkConfiguration = {}
  constructor(conf: InfuraConfiguration | MultiProviderConfiguration) {
    this.asStatusMethod[this.methodName] = this.checkStatus
    this.networks = configureResolverWithNetworks(conf)
  }

  checkStatus(credential: string): Promise<null | CredentialStatus> {
    const decodedJWT = decodeJWT(credential).payload as JWTDecodedExtended
    if (decodedJWT.status?.type === this.methodName) {
      const parsedDID = parse(decodedJWT.iss)
      return this.runCredentialCheck(
        credential,
        parsedDID.id,
        decodedJWT.status
      )
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
    status: StatusEntry
  ): Promise<null | CredentialStatus> {
    const [registryAddress, networkId] = this.parseRegistryId(status.id)

    if (!this.networks[networkId]) {
      return Promise.reject(
        `networkId (${networkId}) for status check not configured`
      )
    }

    const eth = this.networks[networkId]
    const StatusRegContract = new EthContract(eth)(StatusRegistryContractABI)
    const statusReg = StatusRegContract.at(registryAddress)

    const hash = Buffer.from(keccak_256.arrayBuffer(credential)).toString('hex')
    const credentialHash = `0x${hash}`

    interface RevocationResult {
      [index: string]: boolean
    }

    try {
      const rawResult: RevocationResult = await statusReg.revoked(
        issuerAddress,
        credentialHash
      )
      const isRevoked: boolean = rawResult['0']
      return { revoked: isRevoked }
    } catch (e) {
      return Promise.reject(e)
    }
  }
}
