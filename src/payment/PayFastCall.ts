// src/payment/PayFastCall.ts
import { sha256 } from '../utils/security'
import type { Env } from '../types'

export class PayFastProcessor {

  static async generateToken(
    env: Env,
    TXNAMT: string,
    order_id: string,
    currency: string
  ): Promise<{ ACCESS_TOKEN: string }> {
    const params = new URLSearchParams({
      MERCHANT_ID:   env.PAYFAST_MERCHANT_ID,
      SECURED_KEY:   env.PAYFAST_SECURED_KEY,
      TXNAMT,
      BASKET_ID:     order_id,
      CURRENCY_CODE: currency,
    })

    const url        = `${env.PayFast_BASE_URL}/Ecommerce/api/Transaction/GetAccessToken`
    const xRequestId = await sha256(crypto.randomUUID() + Date.now())

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'MERCHANT-ID':              env.PAYFAST_MERCHANT_ID,
        'STORE-ID':                 env.PAYFAST_STORE_ID,
        'Content-Type':             'application/x-www-form-urlencoded',
        'X-Request-ID':             xRequestId,
        'x-payfast-plugin-version': 'WooCommerce_8_BlockCheckout',
        'User-Agent':               'PayFast-PHP-Curl-Addon/1.0 (WooCommerce_BlockCheckout-WordPress/8+)',
      },
      body: params.toString(),
    })

    const parsed = JSON.parse(await response.text())
    if (!parsed.ACCESS_TOKEN) throw new Error('Failed to get PayFast token')
    return { ACCESS_TOKEN: parsed.ACCESS_TOKEN }
  }

  static async validateCallback(
    env: Env,
    callbackData: Record<string, string>
  ): Promise<boolean> {
    for (const f of ['order_id', 'err_code', 'validation_hash', 'transaction_id']) {
      if (!callbackData[f]) return false
    }
    const str  = [callbackData.order_id, env.PAYFAST_SECURED_KEY, env.PAYFAST_MERCHANT_ID, callbackData.err_code].join('|')
    const hash = await sha256(str)
    return hash === callbackData.validation_hash
  }
}
