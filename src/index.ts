import { decodeJWT } from 'did-jwt'
import { parse } from 'did-resolver'
import * as HttpProvider from 'ethjs-provider-http'
import * as Eth from 'ethjs-query'
import * as EthContract from 'ethjs-contract'
import * as StatusRegistryContractABI from './contracts/ethr-status-registry.json'

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
    if (decodedJWT.status && decodedJWT.status.type === this.methodName) {
      const parsedDID = parse(decodedJWT.iss)
      return this.runCredentialCheck(credential, parsedDID.id, decodedJWT.status)
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

  private runCredentialCheck(
    credential: string,
    issuerAddress: string,
    status: StatusEntry
  ): Promise<null | CredentialStatus> {
    const [registryAddress, networkId] = this.parseRegistryId(status.id)

    if (!this.networks[networkId])
      return Promise.reject(
        `networkId (${networkId}) for status check not configured`
      )

    const eth = this.networks[networkId]
    const StatusRegContract = new EthContract(eth)(StatusRegistryContractABI)
    const statusReg = StatusRegContract.at(registryAddress)

    //TODO: actually hash the credential instead of hardcoding this hash
    const credentialHash = "0x278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f"

    let result = statusReg.revoked(issuerAddress, credentialHash)
    return result
  }
}
