// src/pages/reminders.ts
import { layout }       from './layout'
import { formatAmount, formatDate, escapeHtml } from '../utils/security'
import type { EntryWithPerson } from '../types'

export function remindersPage(overdue: EntryWithPerson[], upcoming: EntryWithPerson[]): string {
  const allIds = JSON.stringify([...overdue, ...upcoming].map(e => e.id))

  const entryRow = (e: EntryWithPerson, highlightRed: boolean): string => `
  <tr>
    <td class="text-subtle font-mono text-xs">#${e.id}</td>
    <td>
      <a href="/admin/persons/${e.person_id}" class="text-gold hover:underline font-semibold">${escapeHtml(e.person_name)}</a>
      ${e.person_cnic ? `<div class="text-subtle text-xs font-mono">${escapeHtml(e.person_cnic)}</div>` : ''}
    </td>
    <td class="amt amt-${e.type}">PKR ${formatAmount(e.amount)}</td>
    <td><span class="badge badge-${e.type}">${e.type === 'lent' ? '↑ Lent' : '↓ Borrowed'}</span></td>
    <td class="text-sm ${highlightRed ? 'text-red-400 font-bold' : 'text-yellow-400'}">${formatDate(e.due_date)}${highlightRed ? ' ⚠' : ''}</td>
    <td class="text-muted text-sm hide-mobile">${escapeHtml(e.purpose) || '<span class="text-subtle">—</span>'}</td>
    <td><span class="badge badge-${e.status}">${e.status}</span></td>
    <td class="no-print">
      <div class="flex gap-2">
        <button onclick="sendReminder(${e.id}, '${escapeHtml(e.person_name).replace(/'/g, "\\'")}')" class="btn btn-sm btn-outline">📧 Remind</button>
        <a href="/admin/persons/${e.person_id}" class="btn btn-sm btn-outline">View →</a>
      </div>
    </td>
  </tr>`

  const thead = `<thead><tr>
    <th>#</th><th>Person</th><th>Amount</th><th>Type</th>
    <th>Due Date</th><th class="hide-mobile">Purpose</th><th>Status</th><th class="no-print"></th>
  </tr></thead>`

  return layout(`
  <div class="px-6 py-8 max-w-6xl mx-auto animate-up">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-serif text-3xl text-gold">Reminders</h1>
        <p class="text-muted text-sm mt-1">Overdue &amp; upcoming due entries</p>
      </div>
      <div class="flex gap-2 no-print">
        <button onclick="sendAll()" class="btn btn-gold btn-sm">📧 Send All Reminders</button>
      </div>
    </div>

    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <h2 class="font-bold text-red-400 text-lg">⚠ Overdue</h2>
        <span class="badge" style="background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3);">${overdue.length}</span>
      </div>
      <div class="card overflow-hidden">
        ${overdue.length === 0
          ? `<div class="py-10 text-center text-muted">✅ No overdue entries.</div>`
          : `<div class="overflow-x-auto"><table class="data-table">${thead}<tbody>${overdue.map(e => entryRow(e, true)).join('')}</tbody></table></div>`
        }
      </div>
    </div>

    <div>
      <div class="flex items-center gap-3 mb-3">
        <h2 class="font-bold text-yellow-400 text-lg">🔔 Due This Week</h2>
        <span class="badge" style="background:rgba(234,179,8,.12);color:#fbbf24;border:1px solid rgba(234,179,8,.3);">${upcoming.length}</span>
      </div>
      <div class="card overflow-hidden">
        ${upcoming.length === 0
          ? `<div class="py-10 text-center text-muted">No entries due in the next 7 days.</div>`
          : `<div class="overflow-x-auto"><table class="data-table">${thead}<tbody>${upcoming.map(e => entryRow(e, false)).join('')}</tbody></table></div>`
        }
      </div>
    </div>

  </div>`, {
    title:     'Reminders',
    admin:     true,
    activeNav: 'reminders',
    scripts: `<script>
const ALL_IDS = ${allIds};
async function sendReminder(entryId, personName) {
  if (!confirm('Send email reminder for entry #' + entryId + ' (' + personName + ')?')) return
  const r = await fetch('/api/reminders/send/' + entryId, { method: 'POST' })
  const d = await r.json()
  if (r.ok) toast(d.message || 'Reminder sent!')
  else toast(d.error || 'Failed to send reminder', false)
}
async function sendAll() {
  if (!ALL_IDS.length) { toast('No entries to remind.', false); return }
  if (!confirm('Send reminders for all ' + ALL_IDS.length + ' entries?')) return
  let ok = 0, fail = 0
  for (const id of ALL_IDS) {
    const r = await fetch('/api/reminders/send/' + id, { method: 'POST' })
    r.ok ? ok++ : fail++
  }
  toast('Sent: ' + ok + (fail ? ', Failed: ' + fail : ''), fail === 0)
  setTimeout(() => location.reload(), 1400)
}
</script>`
  })
}
