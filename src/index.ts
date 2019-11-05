import { decodeJWT } from 'did-jwt'
import * as HttpProvider from 'ethjs-provider-http'
import * as Eth from 'ethjs-query'
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
    return new Promise((resolve, reject) => {
      const decodedJWT = decodeJWT(credential).payload as JWTDecodedExtended
      if (decodedJWT.status && decodedJWT.status.type === this.methodName) {
        return this.runCredentialCheck(credential, decodedJWT.status)
      } else {
        reject({ error: `unsupported credential status method` })
      }
    })
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
    status: StatusEntry
  ): Promise<null | CredentialStatus> {
    const [registryAddress, networkId] = this.parseRegistryId(status.id)


    return null
  }
}
