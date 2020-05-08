import { ethers } from 'ethers'

export type SignerMethod = (rawTx: any, cb: (err: any, signedTx: string) => void) => void

export class ExternalSignerProvider extends ethers.Signer {
  private ethSign?: SignerMethod

  constructor(ethSign: SignerMethod, provider: ethers.providers.Provider) {
    super()
    this.ethSign = ethSign
    ethers.utils.defineReadOnly(this, 'provider', provider)
  }

  sign(transaction: ethers.providers.TransactionRequest): Promise<string> {
    return ethers.utils.resolveProperties(transaction).then((tx) => {
      return new Promise((resolve, reject) => {
        this.ethSign(tx, (err, signedTx) => {
          if (err) {
            reject(err)
          } else {
            resolve(signedTx)
          }
        })
      })
    })
  }

  getAddress(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  signMessage(message: ethers.utils.Arrayish): Promise<string> {
    throw new Error('Method not implemented.')
  }

  sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
    if (!this.provider) {
      throw new Error('missing provider')
    }

    return this.sign(transaction).then((signedTransaction) => {
      return this.provider.sendTransaction(signedTransaction)
    })
  }
}
