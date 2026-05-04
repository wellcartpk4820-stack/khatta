// src/pages/entries.ts
import { layout }       from './layout'
import { formatAmount, formatDate, isOverdue, escapeHtml } from '../utils/security'
import type { EntryWithPerson } from '../types'

export function entriesPage(entries: EntryWithPerson[], filter?: string, fromDate?: string, toDate?: string): string {
  const total = entries.reduce((s,e) => e.type==='lent' ? s+e.amount : s-e.amount, 0)

  return layout(`
  <div class="px-6 py-8 max-w-6xl mx-auto animate-up">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-serif text-3xl text-gold">All Entries</h1>
        <p class="text-muted text-sm mt-1">${entries.length} entries</p>
      </div>
      <button onclick="window.print()" class="btn btn-outline btn-sm no-print">🖨 Print</button>
    </div>

    <!-- Filters -->
    <div class="card p-4 mb-6 no-print">
      <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
          <label>Type</label>
          <select name="type" class="input" style="width:140px;">
            <option value="">All Types</option>
            <option value="lent"     ${filter==='lent'     ? 'selected':''}>↑ Lent</option>
            <option value="borrowed" ${filter==='borrowed' ? 'selected':''}>↓ Borrowed</option>
          </select>
        </div>
        <div>
          <label>Status</label>
          <select name="status" class="input" style="width:140px;">
            <option value="">All Status</option>
            <option value="pending"   ${filter==='pending'   ? 'selected':''}>Pending</option>
            <option value="settled"   ${filter==='settled'   ? 'selected':''}>Settled</option>
            <option value="paid"      ${filter==='paid'      ? 'selected':''}>Paid</option>
            <option value="overdue"   ${filter==='overdue'   ? 'selected':''}>Overdue</option>
            <option value="received"  ${filter==='received'  ? 'selected':''}>Received</option>
            <option value="partial"   ${filter==='partial'   ? 'selected':''}>Partial</option>
          </select>
        </div>
        <div>
          <label>From</label>
          <input type="date" name="from" value="${fromDate||''}" class="input" style="width:150px;">
        </div>
        <div>
          <label>To</label>
          <input type="date" name="to" value="${toDate||''}" class="input" style="width:150px;">
        </div>
        <button type="submit" class="btn btn-gold btn-sm">Apply</button>
        <a href="/admin/entries" class="btn btn-outline btn-sm">Reset</a>
      </form>
    </div>

    <!-- Summary bar -->
    ${entries.length > 0 ? `
    <div class="flex gap-6 mb-4 text-sm">
      <span class="text-subtle">Total Lent: <span class="amt amt-lent">${formatAmount(entries.filter(e=>e.type==='lent').reduce((s,e)=>s+e.amount,0))}</span></span>
      <span class="text-subtle">Total Borrowed: <span class="amt amt-borrowed">${formatAmount(entries.filter(e=>e.type==='borrowed').reduce((s,e)=>s+e.amount,0))}</span></span>
      <span class="text-subtle">Net: <span class="amt ${total>=0?'amt-lent':'amt-borrowed'}">${total>=0?'+':'-'}PKR ${formatAmount(Math.abs(total))}</span></span>
    </div>` : ''}

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Person</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Date</th>
              <th>Due</th>
              <th>Purpose</th>
              <th>Status</th>
              <th class="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length === 0 ? `<tr><td colspan="10" class="text-center text-muted py-12">No entries found matching the filters.</td></tr>` : ''}
            ${entries.map(e => {
              const overdue = e.due_date && isOverdue(e.due_date) && ['pending','partial'].includes(e.status)
              return `<tr>
                <td class="text-subtle font-mono text-xs">#${e.id}</td>
                <td><a href="/admin/persons/${e.person_id}" class="text-gold hover:underline font-semibold">${escapeHtml(e.person_name)}</a></td>
                <td><span class="badge badge-${e.type}">${e.type==='lent'?'↑ Lent':'↓ Borrowed'}</span></td>
                <td class="amt amt-${e.type}">PKR ${formatAmount(e.amount)}</td>
                <td class="text-muted text-sm hide-mobile">${escapeHtml(e.payment_mode)}</td>
                <td class="text-muted text-sm">${formatDate(e.entry_date)}</td>
                <td class="text-sm">${e.due_date ? `<span class="${overdue?'text-red-400 font-bold':'text-muted'}">${formatDate(e.due_date)}${overdue?' ⚠':''}</span>` : '<span class="text-subtle">—</span>'}</td>
                <td class="text-muted text-sm max-w-xs truncate hide-mobile">${escapeHtml(e.purpose)||'<span class="text-subtle">—</span>'}</td>
                <td><span class="badge badge-${e.status}">${e.status}</span></td>
                <td class="no-print">
                  <a href="/admin/persons/${e.person_id}" class="btn btn-outline btn-sm">View →</a>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`, { title: 'All Entries', admin: true, activeNav: 'entries' })
}
