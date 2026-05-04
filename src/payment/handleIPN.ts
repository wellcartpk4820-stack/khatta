// src/payment/handleIPN.ts
import { PayFastProcessor } from './PayFastCall'
import { sendEmail, paymentConfirmedEmailTemplate } from '../utils/email'
import type { Env } from '../types'

export async function handlePayFastIPN(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const body = await request.text()
  const req: Record<string, string> = {}
  new URLSearchParams(body).forEach((v, k) => { req[k] = v })

  // ✅ Extract EARLY (fixes "used before declaration")
  const transactionId = req.transaction_id || ''
  const paidAmount = parseFloat(req.transaction_amount || '0')
  const success = req.err_code === '000'

  // Validate signature
  const isValid = await PayFastProcessor.validateCallback(env, {
    order_id: req.basket_id,
    err_code: req.err_code,
    validation_hash: req.validation_hash,
    transaction_id: transactionId,
  })

  if (!isValid) {
    return new Response('Invalid signature', { status: 400 })
  }

  // If payment failed → stop early
  if (!success) {
    console.error('PayFast payment failed:', req.err_code, req.err_msg)
    return new Response('OK', { status: 200 })
  }

  // Parse basket ID
  const basketId = req.basket_id || ''
  const singleMatch = basketId.match(/^KB-(\d+)-/)
  const allMatch = basketId.match(/^KB-ALL-([a-f0-9\-]+)-/)

  if (!singleMatch && !allMatch) {
    return new Response('Bad basket_id', { status: 400 })
  }

  // ── Pay-All flow ──
  if (allMatch) {
    const personId = allMatch[1]

    await env.DB.prepare(`
      UPDATE entries 
      SET status='paid', payment_transaction_id=?, updated_at=CURRENT_TIMESTAMP
      WHERE person_id=? AND type='lent' AND status IN ('pending','partial')
    `).bind(transactionId, personId).run()

    const person = await env.DB.prepare(
      `SELECT name FROM persons WHERE id=?`
    ).bind(personId).first<{ name: string }>()

    if (person && env.BREVO_API_KEY && env.BREVO_FROM_EMAIL) {
      await sendEmail({
        to: env.BREVO_FROM_EMAIL,
        toName: 'Admin',
        subject: `💰 Full Settlement Received — ${person.name}`,
        html: paymentConfirmedEmailTemplate({
          personName: person.name,
          amount: paidAmount,
          currency: 'PKR',
          txnId: transactionId,
          appName: 'KhataBook',
        }),
        apiKey: env.BREVO_API_KEY,
        fromEmail: env.BREVO_FROM_EMAIL,
        fromName: env.BREVO_FROM_NAME || 'KhataBook',
      })
    }

    return new Response('OK', { status: 200 })
  }

  // ── Single entry flow ──
  const entryId = parseInt(singleMatch![1], 10)

  const entry = await env.DB.prepare(`
    UPDATE entries
    SET status = 'paid',
        payment_transaction_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND type = 'lent'
    RETURNING id, person_id, amount, purpose
  `).bind(transactionId, entryId).first<{
    id: number
    person_id: string
    amount: number
    purpose: string | null
  }>()

  if (!entry) {
    return new Response('Entry not found', { status: 404 })
  }

  const person = await env.DB.prepare(
    `SELECT name, mobile FROM persons WHERE id = ?`
  ).bind(entry.person_id).first<{ name: string; mobile: string | null }>()

  if (person && env.BREVO_API_KEY && env.BREVO_FROM_EMAIL) {
    await sendEmail({
      to: env.BREVO_FROM_EMAIL,
      toName: 'Admin',
      subject: `💰 Payment Received – PKR ${paidAmount.toFixed(2)} from ${person.name}`,
      html: paymentConfirmedEmailTemplate({
        personName: person.name,
        amount: paidAmount,
        currency: 'PKR',
        txnId: transactionId,
        appName: 'KhataBook',
      }),
      apiKey: env.BREVO_API_KEY,
      fromEmail: env.BREVO_FROM_EMAIL,
      fromName: env.BREVO_FROM_NAME || 'KhataBook',
    })
  }

  return new Response('OK', { status: 200 })
}
