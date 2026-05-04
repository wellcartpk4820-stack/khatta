// src/routes/admin.ts
import { Hono }           from 'hono'
import { adminAuth }      from '../middleware/auth'
import { dashboardPage }  from '../pages/dashboard'
import { personsPage }    from '../pages/persons'
import { personDetailPage } from '../pages/person-detail'
import { entriesPage }    from '../pages/entries'
import { remindersPage }  from '../pages/reminders'
import type { HonoEnv, PersonWithSummary, EntryWithPerson, Entry } from '../types'

export const adminRoutes = new Hono<HonoEnv>()

// Apply auth middleware to all /admin routes
adminRoutes.use('*', adminAuth)

/* ── Dashboard ────────────────────────────────────────────── */
adminRoutes.get('/', async c => {
  const db = c.env.DB

  const [statsRow, recent] = await Promise.all([
    db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM persons) AS totalPersons,
        COALESCE((SELECT SUM(amount) FROM entries WHERE type='lent'),0)     AS totalLent,
        COALESCE((SELECT SUM(amount) FROM entries WHERE type='borrowed'),0) AS totalBorrowed,
        (SELECT COUNT(*) FROM entries WHERE status IN ('pending','partial')) AS pendingEntries,
        (SELECT COUNT(*) FROM entries WHERE status IN ('pending','partial') AND due_date < date('now')) AS overdueEntries
    `).first<any>(),
    db.prepare(`
      SELECT e.*, p.name AS person_name
      FROM entries e JOIN persons p ON p.id = e.person_id
      ORDER BY e.created_at DESC LIMIT 10
    `).all<any>(),
  ])

  const stats = {
    totalPersons:   statsRow?.totalPersons   || 0,
    totalLent:      statsRow?.totalLent       || 0,
    totalBorrowed:  statsRow?.totalBorrowed   || 0,
    pendingEntries: statsRow?.pendingEntries  || 0,
    overdueEntries: statsRow?.overdueEntries  || 0,
    netBalance:     (statsRow?.totalLent || 0) - (statsRow?.totalBorrowed || 0),
  }

  return c.html(dashboardPage(stats, recent.results))
})

/* ── Persons List ─────────────────────────────────────────── */
adminRoutes.get('/persons', async c => {
  const q = (c.req.query('q') || '').trim()
  let persons: PersonWithSummary[]

  if (q) {
    const like = `%${q}%`
    const rows = await c.env.DB.prepare(`
      SELECT p.*,
        COALESCE(SUM(CASE WHEN e.type='lent'     THEN e.amount ELSE 0 END),0) AS total_lent,
        COALESCE(SUM(CASE WHEN e.type='borrowed' THEN e.amount ELSE 0 END),0) AS total_borrowed,
        COUNT(e.id) AS entry_count
      FROM persons p
      LEFT JOIN entries e ON e.person_id = p.id
      WHERE p.name LIKE ? OR p.identity_number LIKE ? OR p.father_name LIKE ?
      GROUP BY p.id
      ORDER BY p.name ASC
    `).bind(like, like, like).all<PersonWithSummary>()
    persons = rows.results.map(p => ({ ...p, net_balance: p.total_lent - p.total_borrowed }))
  } else {
    const rows = await c.env.DB.prepare(`
      SELECT p.*,
        COALESCE(SUM(CASE WHEN e.type='lent'     THEN e.amount ELSE 0 END),0) AS total_lent,
        COALESCE(SUM(CASE WHEN e.type='borrowed' THEN e.amount ELSE 0 END),0) AS total_borrowed,
        COUNT(e.id) AS entry_count
      FROM persons p
      LEFT JOIN entries e ON e.person_id = p.id
      GROUP BY p.id
      ORDER BY p.name ASC
    `).all<PersonWithSummary>()
    persons = rows.results.map(p => ({ ...p, net_balance: p.total_lent - p.total_borrowed }))
  }

  return c.html(personsPage(persons, q))
})

/* ── Person Detail ───────────────────────────────────────── */
adminRoutes.get('/persons/:id', async c => {
  const id       = c.req.param('id')
  const fromDate = c.req.query('from')
  const toDate   = c.req.query('to')

  const person = await c.env.DB.prepare(
    `SELECT * FROM persons WHERE id = ?`
  ).bind(id).first<any>()
  if (!person) return c.text('Person not found', 404)

  let query = `SELECT * FROM entries WHERE person_id = ?`
  const params: any[] = [id]
  if (fromDate) { query += ` AND date(entry_date) >= ?`; params.push(fromDate) }
  if (toDate)   { query += ` AND date(entry_date) <= ?`; params.push(toDate) }
  query += ` ORDER BY entry_date DESC`

  const entries = await c.env.DB.prepare(query).bind(...params).all<Entry>()

  return c.html(personDetailPage(person, entries.results, fromDate, toDate))
})

/* ── All Entries ─────────────────────────────────────────── */
adminRoutes.get('/entries', async c => {
  const type     = c.req.query('type')
  const status   = c.req.query('status')
  const fromDate = c.req.query('from')
  const toDate   = c.req.query('to')

  let query = `
    SELECT e.*, p.name AS person_name, p.identity_number AS person_cnic, p.father_name
    FROM entries e JOIN persons p ON p.id = e.person_id
    WHERE 1=1
  `
  const params: any[] = []

  if (type && type !== 'overdue') {
    query += ` AND e.type = ?`; params.push(type)
  }
  if (status === 'overdue') {
    query += ` AND e.due_date < date('now') AND e.status IN ('pending','partial')`
  } else if (status) {
    query += ` AND e.status = ?`; params.push(status)
  }
  if (fromDate) { query += ` AND date(e.entry_date) >= ?`; params.push(fromDate) }
  if (toDate)   { query += ` AND date(e.entry_date) <= ?`; params.push(toDate) }
  query += ` ORDER BY e.entry_date DESC LIMIT 500`

  const entries = await c.env.DB.prepare(query).bind(...params).all<EntryWithPerson>()
  const filter  = status === 'overdue' ? 'overdue' : (type || status || undefined)

  return c.html(entriesPage(entries.results, filter, fromDate, toDate))
})

/* ── Reminders ───────────────────────────────────────────── */
adminRoutes.get('/reminders', async c => {
  const [overdueRes, upcomingRes] = await Promise.all([
    c.env.DB.prepare(`
      SELECT e.*, p.name AS person_name, p.identity_number AS person_cnic, p.father_name
      FROM entries e JOIN persons p ON p.id = e.person_id
      WHERE e.due_date < date('now') AND e.status IN ('pending','partial')
      ORDER BY e.due_date ASC
    `).all<EntryWithPerson>(),
    c.env.DB.prepare(`
      SELECT e.*, p.name AS person_name, p.identity_number AS person_cnic, p.father_name
      FROM entries e JOIN persons p ON p.id = e.person_id
      WHERE e.due_date >= date('now') AND e.due_date <= date('now','+7 days')
        AND e.status IN ('pending','partial')
      ORDER BY e.due_date ASC
    `).all<EntryWithPerson>(),
  ])

  return c.html(remindersPage(overdueRes.results, upcomingRes.results))
})
