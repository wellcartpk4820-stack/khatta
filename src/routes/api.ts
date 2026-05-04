// src/routes/api.ts
import { Hono }      from 'hono'
import { adminAuth } from '../middleware/auth'
import { uuid }      from '../utils/security'
import { sendEmail, reminderEmailTemplate } from '../utils/email'
import { formatAmount, formatDate }         from '../utils/security'
import type { HonoEnv, Entry }              from '../types'

export const apiRoutes = new Hono<HonoEnv>()

apiRoutes.use('/persons/*',  adminAuth)
apiRoutes.use('/entries/*',  adminAuth)
apiRoutes.use('/proof/*',    adminAuth)
apiRoutes.use('/reminders/*',adminAuth)

/* ═══════════════════════════════════════════════════════════
   PERSONS
═══════════════════════════════════════════════════════════ */

apiRoutes.post('/persons', async c => {
  let body: any
  try { body = await c.req.json() } catch { return c.text('Invalid JSON', 400) }

  const { name, identity_number, father_name, address, mobile, bank_details, notes } = body
  if (!name || !name.trim()) return c.text('Name is required', 400)

  const id = uuid()

  await c.env.DB.prepare(`
    INSERT INTO persons (id, name, identity_number, father_name, address, mobile, bank_details, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    name.trim(),
    identity_number || null,
    father_name || null,
    address || null,
    mobile || null,
    bank_details || null,
    notes || null
  ).run()

  return c.json({ id, message: 'Person created' }, 201)
})

apiRoutes.put('/persons/:id', async c => {
  const id = c.req.param('id')
  let body: any

  try { body = await c.req.json() } catch { return c.text('Invalid JSON', 400) }

  const existing = await c.env.DB.prepare(`SELECT id FROM persons WHERE id=?`)
    .bind(id)
    .first()

  if (!existing) return c.text('Person not found', 404)

  await c.env.DB.prepare(`
    UPDATE persons
    SET name=?, identity_number=?, father_name=?, address=?, mobile=?, bank_details=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    body.name || '',
    body.identity_number || null,
    body.father_name || null,
    body.address || null,
    body.mobile || null,
    body.bank_details || null,
    id
  ).run()

  return c.json({ message: 'Updated' })
})

apiRoutes.delete('/persons/:id', async c => {
  const id = c.req.param('id')

  const p = await c.env.DB.prepare(`SELECT id FROM persons WHERE id=?`)
    .bind(id)
    .first()

  if (!p) return c.text('Not found', 404)

  const entries = await c.env.DB.prepare(`
    SELECT proof_key FROM entries WHERE person_id=? AND proof_key IS NOT NULL
  `).bind(id).all<{ proof_key: string }>()

  for (const e of entries.results) {
    try { await c.env.BUCKET.delete(e.proof_key) } catch {}
  }

  await c.env.DB.prepare(`DELETE FROM persons WHERE id=?`).bind(id).run()

  return c.json({ message: 'Deleted' })
})

/* ═══════════════════════════════════════════════════════════
   ENTRIES
═══════════════════════════════════════════════════════════ */

const VALID_TYPES    = ['lent','borrowed']
const VALID_STATUSES = ['pending','settled','paid','received','partial','cancelled']
const MAX_PROOF_MB   = 25

apiRoutes.post('/entries', async c => {
  const formData = await c.req.formData()

  const person_id    = formData.get('person_id') as string
  const amountStr    = formData.get('amount') as string
  const type         = formData.get('type') as string
  const payment_mode = (formData.get('payment_mode') as string) || 'Cash by Hand'
  const entry_date   = formData.get('entry_date') as string
  const due_date     = formData.get('due_date') as string | null
  const purpose      = formData.get('purpose') as string | null
  const status       = (formData.get('status') as string) || 'pending'
  const notes        = formData.get('notes') as string | null
  const proofFile    = formData.get('proof') as File | null

  if (!person_id || !amountStr || !type || !entry_date) {
    return c.text('Missing required fields', 400)
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) return c.text('Invalid amount', 400)
  if (!VALID_TYPES.includes(type)) return c.text('Invalid type', 400)
  if (!VALID_STATUSES.includes(status)) return c.text('Invalid status', 400)

  const personExists = await c.env.DB.prepare(`SELECT id FROM persons WHERE id=?`)
    .bind(person_id)
    .first()

  if (!personExists) return c.text('Person not found', 404)

  let proof_key: string | null = null
  let proof_name: string | null = null
  let proof_type: string | null = null

  if (proofFile && proofFile.size > 0) {
    if (proofFile.size > MAX_PROOF_MB * 1024 * 1024) {
      return c.text(`Proof too large`, 413)
    }

    const ext = proofFile.name.split('.').pop() || 'bin'

    proof_key  = `proofs/${person_id}/${uuid()}.${ext}`
    proof_name = proofFile.name
    proof_type = proofFile.type || 'application/octet-stream'

    const buffer = await proofFile.arrayBuffer()

    await c.env.BUCKET.put(proof_key, buffer, {
      httpMetadata: { contentType: proof_type }
    })
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO entries
    (person_id, amount, type, payment_mode, entry_date, due_date, purpose, proof_key, proof_name, proof_type, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    person_id,
    amount,
    type,
    payment_mode,
    entry_date,
    due_date || null,
    purpose || null,
    proof_key,
    proof_name,
    proof_type,
    status,
    notes || null
  ).first<{ id: number }>()

  return c.json({ id: result?.id, message: 'Entry created' }, 201)
})

/* ── PUT /api/entries/:id ─────────────────────────────────── */
apiRoutes.put('/entries/:id', async c => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.text('Invalid entry ID', 400)

  let body: any
  try { body = await c.req.json() } catch { return c.text('Invalid JSON', 400) }

  const existing = await c.env.DB.prepare(`SELECT id FROM entries WHERE id=?`)
    .bind(id)
    .first()

  if (!existing) return c.text('Entry not found', 404)

  const fields: string[] = []
  const params: any[]    = []

  if (body.type !== undefined) {
    if (!VALID_TYPES.includes(body.type)) return c.text('Invalid type', 400)
    fields.push('type=?'); params.push(body.type)
  }
  if (body.amount !== undefined) {
    const amt = parseFloat(body.amount)
    if (isNaN(amt) || amt <= 0) return c.text('Invalid amount', 400)
    fields.push('amount=?'); params.push(amt)
  }
  if (body.payment_mode !== undefined) {
    fields.push('payment_mode=?'); params.push(body.payment_mode)
  }
  if (body.entry_date !== undefined) {
    fields.push('entry_date=?'); params.push(body.entry_date)
  }
  if (body.due_date !== undefined) {
    fields.push('due_date=?'); params.push(body.due_date || null)
  }
  if (body.purpose !== undefined) {
    fields.push('purpose=?'); params.push(body.purpose || null)
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) return c.text('Invalid status', 400)
    fields.push('status=?'); params.push(body.status)
  }
  if (body.notes !== undefined) {
    fields.push('notes=?'); params.push(body.notes || null)
  }

  if (fields.length === 0) return c.text('No fields to update', 400)

  fields.push('updated_at=CURRENT_TIMESTAMP')
  params.push(id)

  await c.env.DB.prepare(
    `UPDATE entries SET ${fields.join(', ')} WHERE id=?`
  ).bind(...params).run()

  return c.json({ message: 'Updated' })
})

/* ── DELETE /api/entries/:id ──────────────────────────────── */
apiRoutes.delete('/entries/:id', async c => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.text('Invalid entry ID', 400)

  const entry = await c.env.DB.prepare(
    `SELECT id, proof_key FROM entries WHERE id=?`
  ).bind(id).first<{ id: number; proof_key: string | null }>()

  if (!entry) return c.text('Entry not found', 404)

  if (entry.proof_key) {
    try { await c.env.BUCKET.delete(entry.proof_key) } catch {}
  }

  await c.env.DB.prepare(`DELETE FROM entries WHERE id=?`).bind(id).run()

  return c.json({ message: 'Deleted' })
})

/* ── GET /api/proof/:entryId ──────────────────────────────── */
apiRoutes.get('/proof/:entryId', async c => {
  const entryId = parseInt(c.req.param('entryId'))
  if (isNaN(entryId)) return c.text('Invalid entry ID', 400)

  const entry = await c.env.DB.prepare(
    `SELECT proof_key, proof_name, proof_type FROM entries WHERE id=?`
  ).bind(entryId).first<{ proof_key: string | null; proof_name: string | null; proof_type: string | null }>()

  if (!entry) return c.text('Entry not found', 404)
  if (!entry.proof_key) return c.text('No proof attached to this entry', 404)

  const object = await c.env.BUCKET.get(entry.proof_key)
  if (!object) return c.text('Proof file not found in storage', 404)

  const contentType = entry.proof_type || 'application/octet-stream'
  const filename    = entry.proof_name || 'proof'

  return new Response(object.body, {
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control':       'private, max-age=3600',
    },
  })
})

/* ═══════════════════════════════════════════════════════════
   REMINDERS
═══════════════════════════════════════════════════════════ */

// Email regex for extracting email from bank_details / notes fields
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/

apiRoutes.post('/reminders/send/:entryId', async c => {
  const entryId = parseInt(c.req.param('entryId'))

  const entry = await c.env.DB.prepare(`
    SELECT e.*, p.name AS person_name, p.bank_details AS person_bank, p.notes AS person_notes
    FROM entries e JOIN persons p ON p.id = e.person_id
    WHERE e.id = ?
  `).bind(entryId).first<any>()

  if (!entry) return c.json({ error: 'Entry not found' }, 404)

  if (!c.env.BREVO_API_KEY || !c.env.BREVO_FROM_EMAIL) {
    return c.json({ error: 'Email not configured. Add BREVO_API_KEY and BREVO_FROM_EMAIL secrets.' }, 500)
  }

  // Extract email from bank_details or notes — same logic as payment flow
  let recipientEmail = c.env.BREVO_FROM_EMAIL // fallback: send reminder to admin
  if (entry.person_bank && EMAIL_REGEX.test(entry.person_bank)) {
    recipientEmail = entry.person_bank.match(EMAIL_REGEX)![0]
  } else if (entry.person_notes && EMAIL_REGEX.test(entry.person_notes)) {
    recipientEmail = entry.person_notes.match(EMAIL_REGEX)![0]
  }

  const safeAmount  = Number(entry.amount || 0)
  const safeDueDate = entry.due_date ?? ''

  await sendEmail({
    to:      recipientEmail,
    toName:  entry.person_name,
    subject: `Reminder — PKR ${formatAmount(safeAmount)} due ${formatDate(safeDueDate)}`,
    html: reminderEmailTemplate({
      personName:  entry.person_name,
      amount:      safeAmount,
      currency:    'PKR',
      dueDate:     formatDate(safeDueDate),
      purpose:     entry.purpose || '',
      paymentLink: null,
      appName:     'KhataBook',
    }),
    apiKey:    c.env.BREVO_API_KEY,
    fromEmail: c.env.BREVO_FROM_EMAIL,
    fromName:  c.env.BREVO_FROM_NAME || 'KhataBook',
  })

  return c.json({ message: `Reminder sent to ${recipientEmail}` })
})
