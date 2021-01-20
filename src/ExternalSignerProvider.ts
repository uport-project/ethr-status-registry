// import { ethers } from 'ethers'
import { Signer } from '@ethersproject/abstract-signer'
import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { defineReadOnly, resolveProperties, Deferrable } from '@ethersproject/properties'
import { parse as parseTransaction } from '@ethersproject/transactions'
import { Bytes } from '@ethersproject/bytes'

export type SignerMethod = (rawTx: any, cb: (err: any, signedTx: string) => void) => void

export class ExternalSignerProvider extends Signer {

  connect(provider: Provider): Signer {
    return new ExternalSignerProvider(this.ethSign, provider)
  }

  private ethSign?: SignerMethod

  constructor(ethSign: SignerMethod, provider: Provider) {
    super()
    this.ethSign = ethSign
    defineReadOnly(this, 'provider', provider)
  }

  async sign(transaction: TransactionRequest): Promise<string> {
    const tx = await resolveProperties(transaction)
    const signed = await this.signRaw(tx)
    return signed
  }

  async getAddress(): Promise<string> {
    const signedTx = await this.signRaw({})
    const decoded = parseTransaction(signedTx)
    return decoded.from
  }

  signMessage(message: Bytes | string): Promise<string> {
    return Promise.reject(new Error('Method not implemented.'))
  }

  signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    return Promise.reject(new Error('Method not implemented.'))
  }

  async sendTransaction(
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
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
