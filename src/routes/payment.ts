// src/routes/payment.ts
import { Hono }            from 'hono'
import { handlePayFastIPN } from '../payment/handleIPN'
import { paymentResultPage } from '../pages/payment-result'
import type { HonoEnv }    from '../types'

export const paymentRoutes = new Hono<HonoEnv>()

/* POST /payment/ipn — PayFast IPN callback */
paymentRoutes.post('/ipn', async c => {
  return handlePayFastIPN(c.req.raw, c.env)
})

/* GET /payment/success — Redirect from PayFast on success */
paymentRoutes.get('/success', c => {
  const q = c.req.query()
  return c.html(paymentResultPage({
    success:       true,
    errCode:       q.err_code       || '000',
    errMsg:        q.err_msg        || 'Success',
    transactionId: q.transaction_id || '',
    basketId:      q.basket_id      || '',
    paymentName:   q.PaymentName    || '',
    issuerName:    q.issuer_name    || '',
    amount:        q.transaction_amount   || '',
    currency:      q.transaction_currency || 'PKR',
  }))
})

/* GET /payment/failed — Redirect from PayFast on failure */
paymentRoutes.get('/failed', c => {
  const q = c.req.query()
  return c.html(paymentResultPage({
    success:       false,
    errCode:       q.err_code    || '',
    errMsg:        q.err_msg     || 'Payment Failed',
    transactionId: q.transaction_id || '',
    basketId:      q.basket_id   || '',
    paymentName:   q.PaymentName || '',
    issuerName:    q.issuer_name || '',
    amount:        q.transaction_amount   || '',
    currency:      q.transaction_currency || 'PKR',
  }))
})
