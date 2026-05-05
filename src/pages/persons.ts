// src/pages/persons.ts
import { layout }       from './layout'
import { formatAmount, escapeHtml } from '../utils/security'
import type { PersonWithSummary } from '../types'

export function personsPage(persons: PersonWithSummary[], query = ''): string {
  return layout(`
  <div class="px-6 py-8 max-w-6xl mx-auto animate-up">

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="font-serif text-3xl text-gold">Persons</h1>
        <p class="text-muted text-sm mt-1">${persons.length} record${persons.length !== 1 ? 's' : ''}</p>
      </div>
      <div class="flex gap-3 no-print">
        <button onclick="openModal('add-person-modal')" class="btn btn-gold">+ Add Person</button>
      </div>
    </div>

    <!-- Search -->
    <div class="card p-4 mb-6 no-print">
      <form method="GET" action="/admin/persons" class="flex gap-3">
        <input type="text" name="q" value="${escapeHtml(query)}" placeholder="Search by name, CNIC, father name…" class="input flex-1">
        <button type="submit" class="btn btn-gold btn-sm">Search</button>
        ${query ? `<a href="/admin/persons" class="btn btn-outline btn-sm">Clear</a>` : ''}
      </form>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>CNIC</th>
              <th>S/D/W/O</th>
              <th>Mobile</th>
              <th>Lent (PKR)</th>
              <th>Borrowed (PKR)</th>
              <th>Net</th>
              <th>Entries</th>
              <th class="no-print"></th>
            </tr>
          </thead>
          <tbody>
            ${persons.length === 0 ? `<tr><td colspan="9" class="text-center text-muted py-12">
              ${query ? `No results for "<strong>${escapeHtml(query)}</strong>".` : 'No persons yet.'}
              <br><button onclick="openModal('add-person-modal')" class="btn btn-gold btn-sm mt-4 no-print">+ Add First Person</button>
            </td></tr>` : ''}
            ${persons.map(p => {
              const net = p.total_lent - p.total_borrowed
              return `
              <tr>
                <td>
                  <a href="/admin/persons/${p.id}" class="font-semibold text-gold hover:underline">${escapeHtml(p.name)}</a>
                  <div class="text-subtle text-xs font-mono mt-0.5">${p.id.substring(0, 8)}…</div>
                </td>
                <td class="font-mono text-sm text-muted">${escapeHtml(p.identity_number) || '<span class="text-subtle">—</span>'}</td>
                <td class="text-muted">${escapeHtml(p.father_name) || '<span class="text-subtle">—</span>'}</td>
                <td class="font-mono text-sm text-muted hide-mobile">${escapeHtml(p.mobile) || '<span class="text-subtle">—</span>'}</td>
                <td class="amt amt-lent">PKR ${formatAmount(p.total_lent)}</td>
                <td class="amt amt-borrowed">PKR ${formatAmount(p.total_borrowed)}</td>
                <td class="amt ${net >= 0 ? 'amt-lent' : 'amt-borrowed'}">${net >= 0 ? '+' : '-'}PKR ${formatAmount(Math.abs(net))}</td>
                <td class="text-muted text-center">${p.entry_count}</td>
                <td class="no-print">
                  <div class="flex gap-2">
                    <a href="/admin/persons/${p.id}" class="btn btn-outline btn-sm">View</a>
                    <button onclick="editPerson('${p.id}','${escapeHtml(p.name)}','${escapeHtml(p.identity_number||'')}','${escapeHtml(p.father_name||'')}','${escapeHtml(p.mobile||'')}','${escapeHtml(p.address||'')}','${escapeHtml(p.bank_details||'')}')" class="btn btn-sm" style="background:rgba(201,168,76,.1);color:#c9a84c;border:1px solid rgba(201,168,76,.25);">Edit</button>
                    <button onclick="del('/api/persons/${p.id}','Delete ${escapeHtml(p.name)}? All entries will be lost.')" class="btn btn-danger btn-sm">Del</button>
                  </div>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Add Person Modal -->
  <div id="add-person-modal" class="modal-bg no-print">
    <div class="modal p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-serif text-xl text-gold">Add New Person</h2>
        <button onclick="closeModal('add-person-modal')" class="text-muted hover:text-white text-xl">✕</button>
      </div>
      <form id="add-person-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label>Full Name *</label>
            <input type="text" name="name" class="input" placeholder="Muhammad Ali" required>
          </div>
          <div>
            <label>Identity Number</label>
            <input type="text" name="identity_number" class="input" placeholder="36302-1234567-9">
          </div>
          <div>
            <label>Father's Name</label>
            <input type="text" name="father_name" class="input" placeholder="Muhammad Aslam">
          </div>
          <div>
            <label>Mobile Number</label>
            <input type="tel" name="mobile" class="input" placeholder="03XX-XXXXXXX">
          </div>
          <div>
            <label>Address</label>
            <input type="text" name="address" class="input" placeholder="City, District">
          </div>
          <div class="col-span-2">
            <label>Bank / Wallet Details</label>
            <input type="text" name="bank_details" class="input" placeholder="HBL IBAN / Easypaisa 03XXXXXXXXX">
          </div>
          <div class="col-span-2">
            <label>Notes</label>
            <textarea name="notes" class="input" rows="2" placeholder="Optional notes…"></textarea>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-gold flex-1 justify-center">Save Person</button>
          <button type="button" onclick="closeModal('add-person-modal')" class="btn btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Person Modal -->
  <div id="edit-person-modal" class="modal-bg no-print">
    <div class="modal p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-serif text-xl text-gold">Edit Person</h2>
        <button onclick="closeModal('edit-person-modal')" class="text-muted hover:text-white text-xl">✕</button>
      </div>
      <form id="edit-person-form" class="space-y-4">
        <input type="hidden" id="edit-person-id">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label>Full Name *</label>
            <input type="text" id="edit-name" class="input" required>
          </div>
          <div>
            <label>Identity Number</label>
            <input type="text" id="edit-cnic" class="input">
          </div>
          <div>
            <label>Father's Name</label>
            <input type="text" id="edit-father" class="input">
          </div>
          <div>
            <label>Mobile Number</label>
            <input type="tel" id="edit-mobile" class="input">
          </div>
          <div>
            <label>Address</label>
            <input type="text" id="edit-address" class="input">
          </div>
          <div class="col-span-2">
            <label>Bank / Wallet Details</label>
            <input type="text" id="edit-bank" class="input">
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-gold flex-1 justify-center">Update Person</button>
          <button type="button" onclick="closeModal('edit-person-modal')" class="btn btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  `, {
    title:     'Persons',
    admin:     true,
    activeNav: 'persons',
    scripts: `<script>
function openModal(id)  { document.getElementById(id).classList.add('open') }
function closeModal(id) { document.getElementById(id).classList.remove('open') }

document.getElementById('add-person-form').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const body = Object.fromEntries(fd)
  const r = await fetch('/api/persons', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
  if(r.ok){ toast('Person added!'); setTimeout(()=>location.reload(), 800); closeModal('add-person-modal'); }
  else { const t=await r.text(); toast(t||'Error adding person', false); }
})

function editPerson(id,name,cnic,father,mobile,address,bank){
  document.getElementById('edit-person-id').value = id
  document.getElementById('edit-name').value       = name
  document.getElementById('edit-cnic').value       = cnic
  document.getElementById('edit-father').value     = father
  document.getElementById('edit-mobile').value     = mobile
  document.getElementById('edit-address').value    = address
  document.getElementById('edit-bank').value       = bank
  openModal('edit-person-modal')
}

document.getElementById('edit-person-form').addEventListener('submit', async e => {
  e.preventDefault()
  const id = document.getElementById('edit-person-id').value
  const body = {
    name:            document.getElementById('edit-name').value,
    identity_number: document.getElementById('edit-cnic').value,
    father_name:     document.getElementById('edit-father').value,
    mobile:          document.getElementById('edit-mobile').value,
    address:         document.getElementById('edit-address').value,
    bank_details:    document.getElementById('edit-bank').value,
  }
  const r = await fetch('/api/persons/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
  if(r.ok){ toast('Updated!'); setTimeout(()=>location.reload(), 800); closeModal('edit-person-modal'); }
  else toast('Update failed', false)
})
</script>`
  })
}
