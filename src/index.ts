import { decodeJWT } from 'did-jwt'
import * as HttpProvider from 'ethjs-provider-http'
import * as Eth from 'ethjs-query'
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
        reject({ error: 'not implemented yet' })
      } else {
        reject({ error: `unsupported credential status method` })
      }
    })
  }
}

// const StatusReg = new EthContract(eth)(EthrStatusRegistryContract)
// const didReg = DidReg.at(registryAddress)
