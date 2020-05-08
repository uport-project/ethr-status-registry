import { ethers } from 'ethers'

export type SignerMethod = (rawTx: any, cb: (err: any, signedTx: string) => void) => void

export class ExternalSignerProvider extends ethers.Signer {
  private ethSign?: SignerMethod

  constructor(ethSign: SignerMethod, provider: ethers.providers.Provider) {
    super()
    this.ethSign = ethSign
    ethers.utils.defineReadOnly(this, 'provider', provider)
  }

  async sign(transaction: ethers.providers.TransactionRequest): Promise<string> {
    const tx = await ethers.utils.resolveProperties(transaction)
    const signed = await this.signRaw(tx)
    return signed
  }

  async getAddress(): Promise<string> {
    const signedTx = await this.signRaw({})
    const decoded = ethers.utils.parseTransaction(signedTx)
    return decoded.from
  }

  signMessage(message: ethers.utils.Arrayish): Promise<string> {
    return Promise.reject(new Error('Method not implemented.'))
  }

  async sendTransaction(
    transaction: ethers.providers.TransactionRequest
  ): Promise<ethers.providers.TransactionResponse> {
    if (!this.provider) {
      throw new Error('missing provider')
    }

    if (transaction.nonce == null) {
      transaction.nonce = await this.provider.getTransactionCount(this.getAddress(), 'pending')
    }

    return this.sign(transaction).then((signedTransaction) => {
      return this.provider.sendTransaction(signedTransaction)
    })
  }

  private signRaw = (rawTx: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.ethSign(rawTx, (err: any, signedTx: string) => {
        if (err) {
          reject(err)
        } else {
          resolve(signedTx)
        }
      })
    })
  }
}
