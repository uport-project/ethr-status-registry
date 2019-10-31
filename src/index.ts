import { decodeJWT } from 'did-jwt'
import { CredentialStatus, StatusMethod } from 'credential-status'

export class EthrStatusRegistry implements StatusResolver {
  checkStatus(credential: string): Promise<null | CredentialStatus> {
    return new Promise((resolve, reject) => {
      reject({ error: 'not implemented' })
    })
  }
}
