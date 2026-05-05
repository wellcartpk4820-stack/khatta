// src/pages/dashboard.ts
import { layout }       from './layout'
import { formatAmount, formatDate, isOverdue, escapeHtml } from '../utils/security'
import type { Person, Entry } from '../types'

interface DashStats {
  totalPersons:     number
  totalLent:        number
  totalBorrowed:    number
  pendingEntries:   number
  overdueEntries:   number
  netBalance:       number
}

interface RecentEntry extends Entry {
  person_name: string
}

export function dashboardPage(stats: DashStats, recent: RecentEntry[]): string {
  const netPositive = stats.netBalance >= 0

  return layout(`
  <div class="px-6 py-8 max-w-6xl mx-auto animate-up">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-serif text-3xl text-gold">Dashboard</h1>
        <p class="text-muted text-sm mt-1">Personal Ledger Overview</p>
      </div>
      <div class="flex gap-3 no-print">
        <a href="/admin/persons" class="btn btn-gold btn-sm">+ Add Person</a>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div class="stat">
        <p class="text-subtle text-xs uppercase tracking-widest mb-2">Total Lent</p>
        <p class="stat-val amt-lent">PKR ${formatAmount(stats.totalLent)}</p>
        <p class="text-subtle text-xs mt-1">↑ Money given out</p>
      </div>
      <div class="stat">
        <p class="text-subtle text-xs uppercase tracking-widest mb-2">Total Borrowed</p>
        <p class="stat-val amt-borrowed">PKR ${formatAmount(stats.totalBorrowed)}</p>
        <p class="text-subtle text-xs mt-1">↓ Money received</p>
      </div>
      <div class="stat" style="border-color:${netPositive ? 'rgba(201,168,76,.4)' : 'rgba(239,68,68,.3)'};">
        <p class="text-subtle text-xs uppercase tracking-widest mb-2">Net Balance</p>
        <p class="stat-val ${netPositive ? 'amt-lent' : 'amt-borrowed'}">PKR ${formatAmount(Math.abs(stats.netBalance))}</p>
        <p class="text-subtle text-xs mt-1">${netPositive ? 'Others owe you' : 'You owe others'}</p>
      </div>
      <div class="stat">
        <p class="text-subtle text-xs uppercase tracking-widest mb-2">Total Persons</p>
        <p class="stat-val text-gold">${stats.totalPersons}</p>
        <p class="text-subtle text-xs mt-1"><a href="/admin/persons" class="hover:text-gold">View all →</a></p>
      </div>
      <div class="stat" style="${stats.pendingEntries > 0 ? 'border-color:rgba(234,179,8,.35)' : ''}">
        <p class="text-subtle text-xs uppercase tracking-widest mb-2">Pending</p>
        <p class="stat-val" style="color:${stats.pendingEntries > 0 ? '#fbbf24' : '#7a92b5'}">${stats.pendingEntries}</p>
        <p class="text-subtle text-xs mt-1">Unsettled entries</p>
      </div>
      <div class="stat" style="${stats.overdueEntries > 0 ? 'border-color:rgba(239,68,68,.4)' : ''}">
        <p class="text-subtle text-xs uppercase tracking-widest mb-2">Overdue</p>
        <p class="stat-val" style="color:${stats.overdueEntries > 0 ? '#f87171' : '#7a92b5'}">${stats.overdueEntries}</p>
        <p class="text-subtle text-xs mt-1">Past due date</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 no-print">
      <a href="/admin/persons"     class="card p-4 text-center hover:border-gold/40 transition-colors cursor-pointer">
        <div class="text-2xl mb-1">👥</div><div class="text-xs font-bold text-muted uppercase tracking-wide">Persons</div>
      </a>
      <a href="/admin/entries"     class="card p-4 text-center hover:border-gold/40 transition-colors cursor-pointer">
        <div class="text-2xl mb-1">📋</div><div class="text-xs font-bold text-muted uppercase tracking-wide">All Entries</div>
      </a>
      <a href="/admin/entries?filter=overdue" class="card p-4 text-center hover:border-red-500/40 transition-colors cursor-pointer">
        <div class="text-2xl mb-1">⚠️</div><div class="text-xs font-bold text-muted uppercase tracking-wide">Overdue</div>
      </a>
      <a href="/admin/reminders"   class="card p-4 text-center hover:border-gold/40 transition-colors cursor-pointer">
        <div class="text-2xl mb-1">🔔</div><div class="text-xs font-bold text-muted uppercase tracking-wide">Reminders</div>
      </a>
    </div>

    <!-- Recent Entries -->
    <div class="card">
      <div class="flex items-center justify-between px-5 py-4 border-b border-navy-border" style="border-color:#1e3a5f;">
        <h2 class="font-bold text-base">Recent Entries</h2>
        <a href="/admin/entries" class="text-gold text-sm hover:underline no-print">View all →</a>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Person</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Due</th>
              <th>Status</th>
              <th class="no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            ${recent.length === 0 ? `<tr><td colspan="8" class="text-center text-muted py-10">No entries yet. <a href="/admin/persons" class="text-gold hover:underline">Add a person first</a>.</td></tr>` : ''}
            ${recent.map(e => {
              const overdue = e.due_date && isOverdue(e.due_date) && e.status === 'pending'
              return `
              <tr>
                <td class="text-subtle font-mono text-xs">#${e.id}</td>
                <td><a href="/admin/persons/${e.person_id}" class="text-gold hover:underline font-semibold">${escapeHtml(e.person_name)}</a></td>
                <td><span class="badge badge-${e.type}">${e.type === 'lent' ? '↑ Lent' : '↓ Borrowed'}</span></td>
                <td class="amt amt-${e.type}">PKR ${formatAmount(e.amount)}</td>
                <td class="text-muted text-sm hide-mobile">${formatDate(e.entry_date)}</td>
                <td class="text-sm">${e.due_date ? `<span class="${overdue ? 'text-red-400 font-bold' : 'text-muted'}">${formatDate(e.due_date)}${overdue ? ' ⚠' : ''}</span>` : '<span class="text-subtle">—</span>'}</td>
                <td><span class="badge badge-${e.status}">${e.status}</span></td>
                <td class="no-print">
                  <a href="/admin/persons/${e.person_id}" class="btn btn-outline btn-sm">View</a>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

  </div>`, { title: 'Dashboard', admin: true, activeNav: 'dashboard' })
}
