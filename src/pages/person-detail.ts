// src/pages/person-detail.ts
import { layout }       from './layout'
import { formatAmount, formatDate, formatDateTime, isOverdue, escapeHtml } from '../utils/security'
import type { Person, Entry } from '../types'

export function personDetailPage(person: Person, entries: Entry[], fromDate?: string, toDate?: string): string {
  const totalLent     = entries.filter(e => e.type === 'lent').reduce((s, e) => s + e.amount, 0)
  const totalBorrowed = entries.filter(e => e.type === 'borrowed').reduce((s, e) => s + e.amount, 0)
  const netBalance    = totalLent - totalBorrowed
  const pendingLent   = entries.filter(e => e.type === 'lent' && ['pending','partial'].includes(e.status)).reduce((s,e)=>s+e.amount,0)

  const PAYMENT_MODES = ['Cash by Hand','Account Transfer','Cheque','Easypaisa','JazzCash','Bank Transfer','Online','Other']
  const STATUSES      = ['pending','settled','paid','received','partial','cancelled']

  return layout(`
  <div class="px-6 py-8 max-w-5xl mx-auto animate-up">

    <!-- Back + Actions -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
      <a href="/admin/persons" class="btn btn-outline btn-sm">← Back to Persons</a>
      <div class="flex gap-2">
        <button onclick="window.print()" class="btn btn-outline btn-sm">🖨 Print Khata</button>
        <button onclick="openModal('add-entry-modal')" class="btn btn-gold btn-sm">+ New Entry</button>
      </div>
    </div>

    <!-- Person Card -->
    <div class="card p-6 mb-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold" style="background:linear-gradient(135deg,#c9a84c22,#c9a84c44);border:1px solid rgba(201,168,76,.3);">${escapeHtml(person.name.charAt(0).toUpperCase())}</div>
            <div>
              <h1 class="font-serif text-2xl text-gold">${escapeHtml(person.name)}</h1>
              <div class="font-mono text-xs text-subtle mt-0.5">Khata ID: ${person.id}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
            ${person.identity_number ? `<div><span class="text-subtle">CNIC:</span> <span class="font-mono text-muted">${escapeHtml(person.identity_number)}</span></div>` : ''}
            ${person.father_name     ? `<div><span class="text-subtle">Father:</span> <span class="text-muted">${escapeHtml(person.father_name)}</span></div>` : ''}
            ${person.mobile          ? `<div><span class="text-subtle">Mobile:</span> <span class="font-mono text-muted">${escapeHtml(person.mobile)}</span></div>` : ''}
            ${person.address         ? `<div><span class="text-subtle">Address:</span> <span class="text-muted">${escapeHtml(person.address)}</span></div>` : ''}
            ${person.bank_details    ? `<div class="col-span-2"><span class="text-subtle">Bank/Wallet:</span> <span class="text-muted">${escapeHtml(person.bank_details)}</span></div>` : ''}
          </div>
        </div>
        <!-- Net Summary -->
        <div class="text-right">
          <p class="text-subtle text-xs uppercase tracking-widest mb-1">Net Balance</p>
          <p class="font-mono text-2xl font-bold ${netBalance >= 0 ? 'amt-lent' : 'amt-borrowed'}">
            ${netBalance >= 0 ? '+' : '-'}PKR ${formatAmount(Math.abs(netBalance))}
          </p>
          <p class="text-subtle text-xs mt-1">${netBalance >= 0 ? 'They owe you' : 'You owe them'}</p>
          ${pendingLent > 0 ? `<p class="text-yellow-400 text-xs mt-2">⏳ PKR ${formatAmount(pendingLent)} pending recovery</p>` : ''}
        </div>
      </div>

      <!-- Sub stats -->
      <hr class="divider my-4">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div><p class="text-subtle text-xs mb-1">Total Lent</p><p class="amt amt-lent font-mono">PKR ${formatAmount(totalLent)}</p></div>
        <div><p class="text-subtle text-xs mb-1">Total Borrowed</p><p class="amt amt-borrowed font-mono">PKR ${formatAmount(totalBorrowed)}</p></div>
        <div><p class="text-subtle text-xs mb-1">Entries</p><p class="text-muted font-mono">${entries.length}</p></div>
      </div>
    </div>

    <!-- Date Filter -->
    <div class="card p-4 mb-4 no-print">
      <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
          <label>From Date</label>
          <input type="date" name="from" value="${fromDate || ''}" class="input" style="width:160px;">
        </div>
        <div>
          <label>To Date</label>
          <input type="date" name="to" value="${toDate || ''}" class="input" style="width:160px;">
        </div>
        <button type="submit" class="btn btn-outline btn-sm">Filter</button>
        ${(fromDate || toDate) ? `<a href="/admin/persons/${person.id}" class="btn btn-outline btn-sm">Clear</a>` : ''}
      </form>
    </div>

    <!-- Entries Table -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b" style="border-color:#1e3a5f;">
        <h2 class="font-bold">
          Entry Ledger
          ${(fromDate || toDate) ? `<span class="text-subtle text-sm font-normal ml-2">(Filtered)</span>` : ''}
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Proof</th>
              <th class="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length === 0 ? `<tr><td colspan="10" class="text-center text-muted py-12">No entries yet. <button onclick="openModal('add-entry-modal')" class="text-gold hover:underline no-print">Add first entry →</button></td></tr>` : ''}
            ${entries.map(e => {
              const overdue = e.due_date && isOverdue(e.due_date) && ['pending','partial'].includes(e.status)
              return `
              <tr id="entry-${e.id}">
                <td class="text-subtle font-mono text-xs">#${e.id}</td>
                <td><span class="badge badge-${e.type}">${e.type === 'lent' ? '↑ Lent' : '↓ Borrowed'}</span></td>
                <td class="amt amt-${e.type}">PKR ${formatAmount(e.amount)}</td>
                <td class="text-muted text-sm">${escapeHtml(e.payment_mode)}</td>
                <td class="text-muted text-sm">${formatDateTime(e.entry_date)}</td>
                <td class="text-sm">
                  ${e.due_date
                    ? `<span class="${overdue ? 'text-red-400 font-bold' : 'text-muted'}">${formatDate(e.due_date)}${overdue ? ' ⚠' : ''}</span>`
                    : '<span class="text-subtle">—</span>'
                  }
                </td>
                <td class="text-muted text-sm max-w-xs truncate">${escapeHtml(e.purpose) || '<span class="text-subtle">—</span>'}</td>
                <td>
                  <select onchange="updateStatus(${e.id},this.value)" class="input text-xs py-1 px-2 no-print" style="width:auto;min-width:100px;">
                    ${STATUSES.map(s => `<option value="${s}" ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                  <span class="badge badge-${e.status} print-only">${e.status}</span>
                </td>
                <td>
                  ${e.proof_key
                    ? `<a href="/api/proof/${e.id}" target="_blank" class="btn btn-outline btn-sm no-print">📎 View</a>
                       <span class="text-muted text-xs print-only">✓ Attached</span>`
                    : '<span class="text-subtle">—</span>'
                  }
                </td>
                <td class="no-print">
                  <div class="flex gap-1">
                    <button onclick="editEntry(${JSON.stringify(e).replace(/"/g,'&quot;')})" class="btn btn-sm" style="background:rgba(201,168,76,.1);color:#c9a84c;border:1px solid rgba(201,168,76,.2);">Edit</button>
                    <button onclick="del('/api/entries/${e.id}','Delete entry #${e.id}?')" class="btn btn-danger btn-sm">✕</button>
                  </div>
                </td>
              </tr>`
            }).join('')}
          </tbody>
          ${entries.length > 0 ? `
          <tfoot>
            <tr>
              <td colspan="2" class="text-right text-subtle text-xs uppercase tracking-wide">Totals</td>
              <td colspan="8">
                <span class="amt amt-lent mr-4">↑ PKR ${formatAmount(totalLent)}</span>
                <span class="amt amt-borrowed mr-4">↓ PKR ${formatAmount(totalBorrowed)}</span>
                <span class="amt ${netBalance >= 0 ? 'amt-lent' : 'amt-borrowed'} font-bold">Net: ${netBalance >= 0 ? '+' : '-'}PKR ${formatAmount(Math.abs(netBalance))}</span>
              </td>
            </tr>
          </tfoot>` : ''}
        </table>
      </div>
    </div>

    <!-- Print Footer -->
    <div class="print-only mt-8 text-center text-xs text-subtle border-t pt-4" style="border-color:#ddd;">
      Printed from KhataBook — Personal Ledger System &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-PK')}
    </div>

  </div>

  <!-- ══ Add Entry Modal ══════════════════════════════════════ -->
  <div id="add-entry-modal" class="modal-bg no-print">
    <div class="modal p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-serif text-xl text-gold">New Entry — ${escapeHtml(person.name)}</h2>
        <button onclick="closeModal('add-entry-modal')" class="text-muted hover:text-white text-xl">✕</button>
      </div>
      <form id="add-entry-form" enctype="multipart/form-data" class="space-y-4">
        <input type="hidden" name="person_id" value="${person.id}">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label>Type *</label>
            <select name="type" class="input" required>
              <option value="lent">↑ Lent (I gave money)</option>
              <option value="borrowed">↓ Borrowed (I received money)</option>
            </select>
          </div>
          <div>
            <label>Amount (PKR) *</label>
            <input type="number" name="amount" class="input" placeholder="5000.00" step="0.01" min="0.01" required>
          </div>
          <div>
            <label>Payment Mode *</label>
            <select name="payment_mode" class="input" required>
              ${PAYMENT_MODES.map(m => `<option>${m}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Date & Time *</label>
            <input type="datetime-local" name="entry_date" class="input" required>
          </div>
          <div>
            <label>Due Date</label>
            <input type="date" name="due_date" class="input">
          </div>
          <div>
            <label>Status</label>
            <select name="status" class="input">
              ${STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="col-span-2">
            <label>Purpose / Reason</label>
            <input type="text" name="purpose" class="input" placeholder="e.g. Personal loan, Business advance, Emergency…">
          </div>
          <div class="col-span-2">
            <label>Proof Document (optional)</label>
            <input type="file" name="proof" id="proof-file" class="input py-2" accept="image/*,audio/*,video/*,.pdf,.doc,.docx">
            <p class="text-subtle text-xs mt-1">Images, audio, video, PDF, Word — any file as proof</p>
          </div>
          <div class="col-span-2">
            <label>Internal Notes</label>
            <textarea name="notes" class="input" rows="2" placeholder="Private notes…"></textarea>
          </div>
        </div>
        <div id="upload-progress" class="hidden">
          <div class="h-1.5 bg-navy-elevated rounded-full overflow-hidden">
            <div id="upload-bar" class="h-full bg-gold rounded-full transition-all" style="width:0%"></div>
          </div>
          <p class="text-subtle text-xs mt-1">Uploading proof…</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-gold flex-1 justify-center">💾 Save Entry</button>
          <button type="button" onclick="closeModal('add-entry-modal')" class="btn btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ══ Edit Entry Modal ══════════════════════════════════════ -->
  <div id="edit-entry-modal" class="modal-bg no-print">
    <div class="modal p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-serif text-xl text-gold">Edit Entry</h2>
        <button onclick="closeModal('edit-entry-modal')" class="text-muted hover:text-white text-xl">✕</button>
      </div>
      <form id="edit-entry-form" class="space-y-4">
        <input type="hidden" id="ee-id">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label>Type *</label>
            <select id="ee-type" class="input">
              <option value="lent">↑ Lent</option>
              <option value="borrowed">↓ Borrowed</option>
            </select>
          </div>
          <div>
            <label>Amount (PKR) *</label>
            <input type="number" id="ee-amount" class="input" step="0.01" min="0.01">
          </div>
          <div>
            <label>Payment Mode</label>
            <select id="ee-mode" class="input">
              ${PAYMENT_MODES.map(m => `<option>${m}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Date & Time</label>
            <input type="datetime-local" id="ee-date" class="input">
          </div>
          <div>
            <label>Due Date</label>
            <input type="date" id="ee-due" class="input">
          </div>
          <div>
            <label>Status</label>
            <select id="ee-status" class="input">
              ${STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="col-span-2">
            <label>Purpose</label>
            <input type="text" id="ee-purpose" class="input">
          </div>
          <div class="col-span-2">
            <label>Notes</label>
            <textarea id="ee-notes" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-gold flex-1 justify-center">Update Entry</button>
          <button type="button" onclick="closeModal('edit-entry-modal')" class="btn btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  `, {
    title:     `${person.name} — Khata`,
    admin:     true,
    activeNav: 'persons',
    extraHead: `<style>
      .print-only { display:none; }
      @media print { .print-only { display:inline; } select.no-print { display:none !important; } }
    </style>`,
    scripts: `<script>
function openModal(id)  { document.getElementById(id).classList.add('open') }
function closeModal(id) { document.getElementById(id).classList.remove('open') }

// Set default datetime to now
document.querySelector('[name="entry_date"]').value = new Date().toISOString().slice(0,16)

// ── Add Entry ──
document.getElementById('add-entry-form').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  document.getElementById('upload-progress').classList.remove('hidden')
  document.getElementById('upload-bar').style.width = '30%'

  const r = await fetch('/api/entries', { method:'POST', body: fd })
  document.getElementById('upload-bar').style.width = '100%'
  if(r.ok){ toast('Entry saved!'); setTimeout(()=>location.reload(),800); }
  else { const t=await r.text(); toast(t||'Error saving entry', false); }
  document.getElementById('upload-progress').classList.add('hidden')
})

// ── Edit Entry ──
function editEntry(e){
  document.getElementById('ee-id').value      = e.id
  document.getElementById('ee-type').value    = e.type
  document.getElementById('ee-amount').value  = e.amount
  document.getElementById('ee-mode').value    = e.payment_mode
  document.getElementById('ee-date').value    = (e.entry_date||'').slice(0,16)
  document.getElementById('ee-due').value     = e.due_date || ''
  document.getElementById('ee-status').value  = e.status
  document.getElementById('ee-purpose').value = e.purpose || ''
  document.getElementById('ee-notes').value   = e.notes || ''
  openModal('edit-entry-modal')
}

document.getElementById('edit-entry-form').addEventListener('submit', async e => {
  e.preventDefault()
  const id   = document.getElementById('ee-id').value
  const body = {
    type:         document.getElementById('ee-type').value,
    amount:       parseFloat(document.getElementById('ee-amount').value),
    payment_mode: document.getElementById('ee-mode').value,
    entry_date:   document.getElementById('ee-date').value,
    due_date:     document.getElementById('ee-due').value || null,
    status:       document.getElementById('ee-status').value,
    purpose:      document.getElementById('ee-purpose').value,
    notes:        document.getElementById('ee-notes').value,
  }
  const r = await fetch('/api/entries/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
  if(r.ok){ toast('Updated!'); setTimeout(()=>location.reload(),800); closeModal('edit-entry-modal'); }
  else toast('Update failed', false)
})

// ── Quick status update ──
async function updateStatus(id, status){
  const r = await fetch('/api/entries/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) })
  if(r.ok) toast('Status updated!')
  else toast('Failed to update status', false)
}
</script>`
  })
}
