// src/pages/public-lookup.ts
import { layout } from './layout'

export function publicLookupPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KhataBook — Check Your Record</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background:#050b18; color:#dde3f0; font-family:'Nunito Sans',sans-serif; margin:0; }
    .input { background:#0f1e38; border:1px solid #1e3a5f; color:#dde3f0; padding:12px 16px; border-radius:10px; width:100%; font-size:15px; font-family:inherit; transition:border-color .2s,box-shadow .2s; }
    .input:focus { outline:none; border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,.12); }
    .input::placeholder { color:#455a77; }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:12px 24px; border-radius:10px; font-weight:800; font-size:15px; cursor:pointer; transition:all .18s; border:none; }
    .btn-gold { background:linear-gradient(135deg,#c9a84c,#8a6520); color:#050b18; }
    .btn-gold:hover { background:linear-gradient(135deg,#e8cc7e,#c9a84c); transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,.3); }
    .card { background:#0d1627; border:1px solid #1e3a5f; border-radius:14px; }
    .badge { display:inline-block; padding:3px 12px; border-radius:99px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
    .badge-lent     { background:rgba(34,197,94,.12);  color:#22c55e; border:1px solid rgba(34,197,94,.3); }
    .badge-borrowed { background:rgba(239,68,68,.12);  color:#f87171; border:1px solid rgba(239,68,68,.3); }
    .badge-pending  { background:rgba(234,179,8,.12);  color:#fbbf24; border:1px solid rgba(234,179,8,.3); }
    .badge-settled  { background:rgba(99,102,241,.12); color:#a5b4fc; border:1px solid rgba(99,102,241,.3); }
    .badge-paid     { background:rgba(34,197,94,.12);  color:#4ade80; border:1px solid rgba(34,197,94,.3); }
    .badge-received { background:rgba(59,130,246,.12); color:#60a5fa; border:1px solid rgba(59,130,246,.3); }
    .badge-partial  { background:rgba(251,146,60,.12); color:#fb923c; border:1px solid rgba(251,146,60,.3); }
    .badge-cancelled{ background:rgba(107,114,128,.12);color:#9ca3af; border:1px solid rgba(107,114,128,.3); }
    .amt { font-family:'JetBrains Mono',monospace; font-weight:600; }
    .amt-lent     { color:#22c55e; }
    .amt-borrowed { color:#f87171; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { color:#c9a84c; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; padding:12px 16px; text-align:left; border-bottom:1px solid #1e3a5f; }
    .data-table td { padding:14px 16px; border-bottom:1px solid rgba(30,58,95,.4); font-size:14px; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .data-table tbody tr:hover td { background:rgba(22,32,53,.6); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .animate-up { animation:fadeUp .4s ease forwards; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .spinner { width:20px; height:20px; border:2px solid rgba(201,168,76,.3); border-top-color:#c9a84c; border-radius:50%; animation:spin .7s linear infinite; }
    @media(max-width:640px){
      .data-table th,.data-table td { padding:10px 12px; font-size:13px; }
      .hide-sm { display:none !important; }
    }
    @media print {
      body { background:#fff !important; color:#111 !important; }
      .no-print { display:none !important; }
      .card { background:#fff !important; border-color:#ddd !important; }
      .amt-lent { color:#16a34a !important; }
      .amt-borrowed { color:#dc2626 !important; }
      @page { margin:15mm; size:A4; }
    }
  </style>
</head>
<body>

<!-- Header -->
<div style="background:#0a1220;border-bottom:1px solid #1e3a5f;" class="no-print">
  <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-2xl">📒</span>
      <span style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#c9a84c;">KhataBook</span>
    </div>
    <a href="/login" style="color:#7a92b5;font-size:13px;text-decoration:none;" class="hover:text-white transition-colors">Admin →</a>
  </div>
</div>

<!-- Hero -->
<div class="max-w-4xl mx-auto px-6 pt-14 pb-8">
  <div class="text-center mb-10 animate-up">
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(32px,5vw,54px);color:#c9a84c;font-weight:700;line-height:1.1;margin-bottom:12px;">
      Check Your Khata Record
    </h1>
    <p style="color:#7a92b5;font-size:16px;max-width:480px;margin:0 auto;">
      Enter your name, CNIC, father's name, or your Khata ID to view your ledger entries.
    </p>
  </div>

  <!-- Search Card -->
  <div class="card p-6 mb-8 animate-up no-print" style="animation-delay:.1s;">
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input type="text" id="s-name"   class="input" placeholder="Full Name">
        <input type="text" id="s-father" class="input" placeholder="Father's Name">
        <input type="text" id="s-cnic"   class="input" placeholder="CNIC (e.g. 36302-1234567-9)">
      </div>
      <div class="flex gap-3">
        <input type="text" id="s-khata"  class="input" placeholder="Khata ID / Entry # (optional)">
        <button onclick="doSearch()" class="btn btn-gold whitespace-nowrap">🔍 Search</button>
      </div>
      <!-- Date filter -->
      <div class="flex flex-wrap gap-3 items-end pt-1">
        <div>
          <label style="font-size:11px;color:#7a92b5;text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:4px;">From Date</label>
          <input type="date" id="s-from" class="input" style="width:160px;">
        </div>
        <div>
          <label style="font-size:11px;color:#7a92b5;text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:4px;">To Date</label>
          <input type="date" id="s-to"   class="input" style="width:160px;">
        </div>
        <div style="color:#455a77;font-size:12px;padding-bottom:14px;">Leave blank to see all dates</div>
      </div>
    </div>
  </div>

  <!-- Results -->
  <div id="results"></div>
</div>

<!-- Print footer -->
<div class="print-only" style="display:none;text-align:center;margin-top:40px;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:16px;">
  KhataBook — Personal Ledger — Printed ${new Date().toLocaleDateString('en-PK')}
</div>

<script>
let lastPersonId = null

async function doSearch(){
  const name   = document.getElementById('s-name').value.trim()
  const father = document.getElementById('s-father').value.trim()
  const cnic   = document.getElementById('s-cnic').value.trim()
  const khata  = document.getElementById('s-khata').value.trim()
  const from   = document.getElementById('s-from').value
  const to     = document.getElementById('s-to').value

  if(!name && !father && !cnic && !khata){
    showError('Please enter at least one search field.')
    return
  }

  document.getElementById('results').innerHTML = '<div class="flex justify-center py-10"><div class="spinner"></div></div>'

  const params = new URLSearchParams()
  if(name)   params.set('name', name)
  if(father) params.set('father', father)
  if(cnic)   params.set('cnic', cnic)
  if(khata)  params.set('khata', khata)
  if(from)   params.set('from', from)
  if(to)     params.set('to', to)

  const r = await fetch('/api/public/lookup?' + params.toString())
  const d = await r.json()
  if(!r.ok) { showError(d.error || 'No records found.'); return }
  renderResults(d)
}

function showError(msg){
  document.getElementById('results').innerHTML = \`
  <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:20px;text-align:center;color:#f87171;">
    ⚠️ \${msg}
  </div>\`
}

function fmt(n){ return new Intl.NumberFormat('en-PK',{minimumFractionDigits:2}).format(n) }
function fmtDate(d){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'}) }

function renderResults(d){
  const { person, entries, totalLent, totalBorrowed, netBalance } = d
  lastPersonId = person.id
  const net = netBalance

  const rows = entries.map(e => {
    const overdue = e.due_date && new Date(e.due_date) < new Date() && ['pending','partial'].includes(e.status)
    const payBtn = (e.type === 'lent' && ['pending','partial'].includes(e.status))
      ? \`<button onclick="payEntry(\${e.id},\${e.amount},'PKR')" style="background:linear-gradient(135deg,#c9a84c,#8a6520);color:#050b18;font-weight:700;font-size:11px;padding:5px 12px;border:none;border-radius:6px;cursor:pointer;">💳 Pay</button>\`
      : ''
    return \`
    <tr>
      <td style="color:#455a77;font-family:'JetBrains Mono',monospace;font-size:11px;">#\${e.id}</td>
      <td><span class="badge badge-\${e.type}">\${e.type==='lent'?'↑ Lent (owed to admin)':'↓ Borrowed (admin received)'}</span></td>
      <td class="amt amt-\${e.type}">PKR \${fmt(e.amount)}</td>
      <td style="color:#7a92b5;font-size:13px;" class="hide-sm">\${e.payment_mode||'—'}</td>
      <td style="color:#7a92b5;font-size:13px;">\${fmtDate(e.entry_date)}</td>
      <td style="font-size:13px;">\${e.due_date ? \`<span style="color:\${overdue?'#f87171':'#7a92b5'}">\${fmtDate(e.due_date)}\${overdue?' ⚠':''}</span>\` : '<span style="color:#455a77">—</span>'}</td>
      <td style="color:#7a92b5;font-size:13px;" class="hide-sm">\${e.purpose||'<span style="color:#455a77">—</span>'}</td>
      <td><span class="badge badge-\${e.status}">\${e.status}</span></td>
      <td>\${payBtn}</td>
    </tr>\`
  }).join('')

  document.getElementById('results').innerHTML = \`
  <div class="animate-up">
    <!-- Person Card -->
    <div class="card p-6 mb-5">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;color:#c9a84c;margin:0 0 4px;">\${person.name}</h2>
          <div style="font-size:13px;color:#7a92b5;display:flex;flex-wrap:wrap;gap:12px;margin-top:6px;">
            \${person.identity_number ? \`<span>🪪 \${person.identity_number}</span>\` : ''}
            \${person.father_name ? \`<span>👤 S/D/W/O \${person.father_name}</span>\` : ''}
            \${person.mobile ? \`<span>📱 \${person.mobile}</span>\` : ''}
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#455a77;margin-top:4px;">Khata ID: \${person.id}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#455a77;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Net Balance</div>
          <div class="amt \${net>=0?'amt-lent':'amt-borrowed'}" style="font-size:24px;font-weight:700;">
            \${net>=0?'+':'-'}PKR \${fmt(Math.abs(net))}
          </div>
          <div style="font-size:11px;color:#455a77;margin-top:2px;">\${net>=0?'You owe the admin':'Admin owes you'}</div>
        </div>
      </div>
      <div style="border-top:1px solid #1e3a5f;margin-top:16px;padding-top:16px;display:flex;gap:32px;flex-wrap:wrap;">
        <div><div style="font-size:11px;color:#455a77;">Total Lent to You</div><div class="amt amt-lent">PKR \${fmt(totalLent)}</div></div>
        <div><div style="font-size:11px;color:#455a77;">Total Borrowed from You</div><div class="amt amt-borrowed">PKR \${fmt(totalBorrowed)}</div></div>
        <div><div style="font-size:11px;color:#455a77;">Entries</div><div style="color:#7a92b5;">\${entries.length}</div></div>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;gap:10px;margin-bottom:16px;" class="no-print">
      <button onclick="window.print()" style="background:transparent;border:1px solid rgba(201,168,76,.4);color:#c9a84c;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">🖨 Print Khata</button>
      \${net>0 ? \`<button onclick="payAll(\${net})" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">💳 Pay All (PKR \${fmt(net)})</button>\` : ''}
    </div>

    <!-- Entries Table -->
    <div class="card" style="overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #1e3a5f;font-weight:700;">
        Ledger Entries \${entries.length===0?'<span style="color:#7a92b5;font-size:13px;font-weight:400;">(none yet)</span>':''}
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Type</th><th>Amount (PKR)</th><th class="hide-sm">Mode</th>
              <th>Date</th><th>Due</th><th class="hide-sm">Purpose</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>\${rows || '<tr><td colspan="9" style="text-align:center;color:#7a92b5;padding:32px;">No entries found.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="print-only" style="margin-top:24px;text-align:center;font-size:11px;color:#666;">
      KhataBook — Personal Ledger — Printed \${new Date().toLocaleDateString('en-PK')}
    </div>
  </div>\`
}

async function payEntry(entryId, amount, currency){
  if(!confirm(\`Proceed to pay PKR \${amount.toFixed(2)} via PayFast?\`)) return
  const r = await fetch('/api/public/pay', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ entry_id:entryId, amount, person_id:lastPersonId })
  })
  if(r.ok){ const html=await r.text(); document.open();document.write(html);document.close(); }
  else toast('Payment initiation failed', false)
}

async function payAll(totalAmount){
  if(!confirm(\`Pay all pending amounts (PKR \${totalAmount.toFixed(2)}) via PayFast?\`)) return
  const r = await fetch('/api/public/pay-all', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ person_id:lastPersonId, amount:totalAmount })
  })
  if(r.ok){ const html=await r.text(); document.open();document.write(html);document.close(); }
  else alert('Payment initiation failed. Please try again.')
}

function toast(msg, ok=true){
  const d=document.createElement('div')
  d.style.cssText='position:fixed;bottom:20px;right:20px;z-index:999;background:'+(ok?'#162035':'#1a0f0f')+';border:1px solid '+(ok?'#22c55e':'#ef4444')+';color:'+(ok?'#4ade80':'#f87171')+';padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;'
  d.textContent=msg
  document.body.appendChild(d)
  setTimeout(()=>d.remove(),3000)
}

// Allow search on Enter key
document.addEventListener('keydown', e => { if(e.key==='Enter') doSearch() })
</script>
</body>
</html>`
}
