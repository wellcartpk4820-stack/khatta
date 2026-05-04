// src/payment/PayFast.ts
import { sha256, escapeHtml } from '../utils/security'
import { PayFastProcessor }   from './PayFastCall'
import type { Env }           from '../types'

/** Called when a public user clicks "Pay via PayFast" on a lent entry */
export async function initiatePayFastPayment(request: Request, env: Env): Promise<Response> {
  const input = await request.json() as {
    entry_id:       number
    amount:         number
    person_name:    string
    person_mobile?: string
    person_email?:  string
    description:    string
  }

  const order_id  = `KB-${input.entry_id}-${Date.now()}`
  const TXNAMT    = Number(input.amount).toFixed(2)
  const OrderDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const signature = await sha256(order_id)
  const currency  = 'PKR'

  const { ACCESS_TOKEN } = await PayFastProcessor.generateToken(env, TXNAMT, order_id, currency)

  const payload = new URLSearchParams({
    MERCHANT_ID:            env.PAYFAST_MERCHANT_ID,
    MERCHANT_NAME:          'KhataBook',
    TOKEN:                  ACCESS_TOKEN,
    PROCCODE:               '00',
    TXNAMT,
    CUSTOMER_MOBILE_NO:     input.person_mobile || '03000000000',
    CUSTOMER_EMAIL_ADDRESS: input.person_email  || 'noreply@khata.pk',
    SIGNATURE:              signature,
    PLUGIN_VERSION:         'WOOCOM-BLOCK-CO-GOPAYFAST-8+',
    TXNDESC:                input.description,
    SUCCESS_URL:            `${env.APP_URL}/payment/success`,
    FAILURE_URL:            `${env.APP_URL}/payment/failed`,
    BASKET_ID:              order_id,
    ORDER_DATE:             OrderDate,
    CHECKOUT_URL:           `${env.APP_URL}/payment/ipn`,
    TRAN_TYPE:              'ECOMM_PURCHASE',
    STORE_ID:               env.PAYFAST_STORE_ID,
    CURRENCY_CODE:          currency,
  })

  const paymentUrl  = `${env.PayFast_BASE_URL}/Ecommerce/api/Transaction/PostTransaction`
  const inputFields = [] as string[]
  payload.forEach((v, k) => inputFields.push(
    `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`
  ))

  return new Response(`<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${paymentUrl}">
  <title>Redirecting to PayFast…</title>
</head>
<body style="display:none;">
  <form id="pf" method="POST" action="${paymentUrl}">
    ${inputFields.join('\n    ')}
  </form>
  <script>document.getElementById('pf').submit();</script>
</body></html>`, {
    headers: {
      'Content-Type':           'text/html',
      'X-Frame-Options':        'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control':          'no-store',
    },
  })
}
