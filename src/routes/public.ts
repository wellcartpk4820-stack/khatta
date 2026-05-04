// src/routes/public.ts
import { Hono }                    from 'hono'
import { initiatePayFastPayment }  from '../payment/PayFast'
import type { HonoEnv }            from '../types'

export const publicRoutes = new Hono<HonoEnv>()

/* ══════════════════════════════════════════════════════════════
   GET /api/public/lookup
   Query params: name, father, cnic, khata (person_id or entry id), from, to
══════════════════════════════════════════════════════════════ */
publicRoutes.get('/lookup', async c => {
  const name   = (c.req.query('name')   || '').trim()
  const father = (c.req.query('father') || '').trim()
  const cnic   = (c.req.query('cnic')   || '').trim()
  const khata  = (c.req.query('khata')  || '').trim()  // UUID or entry #
  const from   = c.req.query('from')
  const to     = c.req.query('to')

  if (!name && !father && !cnic && !khata) {
    return c.json({ error: 'Provide at least one search parameter.' }, 400)
  }

  let person: any = null

  // 1. Try exact khata / person UUID
  if (khata && khata.includes('-')) {
    person = await c.env.DB.prepare(`SELECT * FROM persons WHERE id = ?`).bind(khata).first<any>()
  }

  // 2. Try entry # → get person
  if (!person && khata && /^\d+$/.test(khata)) {
    const entry = await c.env.DB.prepare(`SELECT person_id FROM entries WHERE id = ?`).bind(parseInt(khata)).first<{person_id:string}>()
    if (entry) person = await c.env.DB.prepare(`SELECT * FROM persons WHERE id = ?`).bind(entry.person_id).first<any>()
  }

  // 3. Text search — combine all provided fields with AND logic
  if (!person) {
    const conditions: string[] = []
    const params:     any[]    = []

    if (name) {
      conditions.push(`LOWER(p.name) LIKE LOWER(?)`)
      params.push(`%${name}%`)
    }
    if (father) {
      conditions.push(`LOWER(p.father_name) LIKE LOWER(?)`)
      params.push(`%${father}%`)
    }
    if (cnic) {
      const cleanCnic = cnic.replace(/\s/g, '')
      conditions.push(`REPLACE(p.identity_number,' ','') LIKE ?`)
      params.push(`%${cleanCnic}%`)
    }

    if (conditions.length > 0) {
      const row = await c.env.DB.prepare(
        `SELECT * FROM persons p WHERE ${conditions.join(' AND ')} LIMIT 1`
      ).bind(...params).first<any>()
      person = row
    }
  }

  if (!person) return c.json({ error: 'No records found matching your search.' }, 404)

  // Fetch entries (public view: hide proof_key, notes)
  let entryQuery = `
    SELECT id, person_id, amount, type, payment_mode, entry_date, due_date, purpose,
           proof_name, proof_type, status, payment_transaction_id
    FROM entries
    WHERE person_id = ?
  `
  const entryParams: any[] = [person.id]
  if (from) { entryQuery += ` AND date(entry_date) >= ?`; entryParams.push(from) }
  if (to)   { entryQuery += ` AND date(entry_date) <= ?`; entryParams.push(to) }
  entryQuery += ` ORDER BY entry_date DESC`

  const entries = await c.env.DB.prepare(entryQuery).bind(...entryParams).all<any>()

  const totalLent     = entries.results.filter((e:any) => e.type === 'lent').reduce((s:number,e:any) => s + e.amount, 0)
  const totalBorrowed = entries.results.filter((e:any) => e.type === 'borrowed').reduce((s:number,e:any) => s + e.amount, 0)
  const netBalance    = totalLent - totalBorrowed

  // Sanitise person — remove internal bank_details from public response
  const publicPerson = {
    id:              person.id,
    name:            person.name,
    identity_number: person.identity_number,
    father_name:     person.father_name,
    mobile:          person.mobile,
    address:         person.address,
  }

  return c.json({ person: publicPerson, entries: entries.results, totalLent, totalBorrowed, netBalance })
})

/* ══════════════════════════════════════════════════════════════
   POST /api/public/pay  — Pay a single lent entry via PayFast
══════════════════════════════════════════════════════════════ */
publicRoutes.post('/pay', async c => {
  let body: any
  try { body = await c.req.json() } catch { return c.text('Invalid JSON', 400) }

  const { entry_id, amount, person_id } = body
  if (!entry_id || !amount || !person_id) return c.text('Missing fields', 400)

  // Verify entry is lent & pending
  const entry = await c.env.DB.prepare(
    `SELECT * FROM entries WHERE id = ? AND type = 'lent' AND status IN ('pending','partial')`
  ).bind(entry_id).first<any>()
  if (!entry) return c.text('Entry not eligible for payment', 400)

  const person = await c.env.DB.prepare(`SELECT * FROM persons WHERE id = ?`).bind(person_id).first<any>()
  if (!person) return c.text('Person not found', 404)

  // Extract email from bank_details / notes if available
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
  let personEmail = 'user@payfast.pk'
  if (person.bank_details && emailRegex.test(person.bank_details)) personEmail = person.bank_details.match(emailRegex)![0]
  else if (person.notes && emailRegex.test(person.notes)) personEmail = person.notes.match(emailRegex)![0]

  const fakeRequest = new Request('https://internal/payfast', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      entry_id,
      amount:          Number(amount),
      person_name:     person.name,
      person_mobile:   person.mobile  || '03000000000',
      person_email:    personEmail,
      description:     `Khata payment — Entry #${entry_id} — ${person.name}`,
    }),
  })

  return initiatePayFastPayment(fakeRequest, c.env)
})

/* ══════════════════════════════════════════════════════════════
   POST /api/public/pay-all  — Pay all pending lent entries
══════════════════════════════════════════════════════════════ */
publicRoutes.post('/pay-all', async c => {
  let body: any
  try { body = await c.req.json() } catch { return c.text('Invalid JSON', 400) }

  const { person_id, amount } = body
  if (!person_id || !amount) return c.text('Missing fields', 400)

  // Verify person exists
  const person = await c.env.DB.prepare(`SELECT * FROM persons WHERE id = ?`).bind(person_id).first<any>()
  if (!person) return c.text('Person not found', 404)

  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
  let personEmail = 'user@payfast.pk'
  if (person.bank_details && emailRegex.test(person.bank_details)) personEmail = person.bank_details.match(emailRegex)![0]

  // Use a synthetic entry_id of 0 to represent bulk payment — handled in IPN
  const fakeRequest = new Request('https://internal/payfast', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      entry_id:      `ALL-${person_id}`,
      amount:        Number(amount),
      person_name:   person.name,
      person_mobile: person.mobile || '03000000000',
      person_email:  personEmail,
      description:   `Full khata settlement — ${person.name}`,
    }),
  })

  return initiatePayFastPayment(fakeRequest, c.env)
})
