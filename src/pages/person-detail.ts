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
      <a href="/admin/persons" class="btn btn-outline btn-sm">← Back</a>
      <div class="flex gap-2">
        <button onclick="window.print()" class="btn btn-outline btn-sm">🖨 Print</button>
        <button onclick="openModal('add-entry-modal')" class="btn btn-gold btn-sm">+ New Entry</button>
      </div>
    </div>

    <!-- Person Card -->
    <div class="card p-6 mb-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                 style="background:linear-gradient(135deg,#c9a84c22,#c9a84c44);border:1px solid rgba(201,168,76,.3);">
              ${escapeHtml(person.name.charAt(0).toUpperCase())}
            </div>
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
        <div class="text-right">
          <p class="text-subtle text-xs uppercase tracking-widest mb-1">Net Balance</p>
          <p class="font-mono text-2xl font-bold ${netBalance >= 0 ? 'amt-lent' : 'amt-borrowed'}">
            ${netBalance >= 0 ? '+' : '-'}PKR ${formatAmount(Math.abs(netBalance))}
          </p>
          <p class="text-subtle text-xs mt-1">${netBalance >= 0 ? 'They owe you' : 'You owe them'}</p>
          ${pendingLent > 0 ? `<p class="text-yellow-400 text-xs mt-2">⏳ PKR ${formatAmount(pendingLent)} pending</p>` : ''}
        </div>
      </div>
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
          <label>From</label>
          <input type="date" name="from" value="${fromDate || ''}" class="input" style="width:150px;">
        </div>
        <div>
          <label>To</label>
          <input type="date" name="to" value="${toDate || ''}" class="input" style="width:150px;">
        </div>
        <button type="submit" class="btn btn-outline btn-sm">Filter</button>
        ${(fromDate || toDate) ? `<a href="/admin/persons/${person.id}" class="btn btn-outline btn-sm">Clear</a>` : ''}
      </form>
    </div>

    <!-- Entries Table -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b" style="border-color:#1e3a5f;">
        <h2 class="font-bold">Entry Ledger ${(fromDate || toDate) ? '<span class="text-subtle text-sm font-normal ml-2">(Filtered)</span>' : ''}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Type</th><th>Amount</th><th>Mode</th>
              <th>Date</th><th>Due</th><th>Purpose</th><th>Status</th><th>Proof</th>
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
                <td class="text-muted text-sm">${formatDate(e.entry_date)}</td>
                <td class="text-sm">${e.due_date ? `<span class="${overdue ? 'text-red-400 font-bold' : 'text-muted'}">${formatDate(e.due_date)}${overdue ? ' ⚠' : ''}</span>` : '<span class="text-subtle">—</span>'}</td>
                <td class="text-muted text-sm max-w-xs truncate">${escapeHtml(e.purpose) || '<span class="text-subtle">—</span>'}</td>
                <td>
                  <select onchange="updateStatus(${e.id},this.value)" class="input text-xs py-1 px-2 no-print" style="width:auto;min-width:100px;">
                    ${STATUSES.map(s => `<option value="${s}" ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                  <span class="badge badge-${e.status} print-only">${e.status}</span>
                </td>
                <td>${e.proof_key ? `<a href="/api/proof/${e.id}" target="_blank" class="btn btn-outline btn-sm no-print">📎 View</a><span class="text-muted text-xs print-only">✓</span>` : '<span class="text-subtle">—</span>'}</td>
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

    <div class="print-only mt-8 text-center text-xs text-subtle border-t pt-4" style="border-color:#ddd;">
      Printed from KhataBook — Personal Ledger System &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-PK')}
    </div>
  </div>

  <!-- ══ Add Entry Modal ══════════════════════════════════════ -->
  <div id="add-entry-modal" class="modal-bg no-print">
    <div class="modal p-6" style="max-width:580px;">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-serif text-xl text-gold">New Entry — ${escapeHtml(person.name)}</h2>
        <button onclick="closeModal('add-entry-modal');resetProof()" class="text-muted hover:text-white text-2xl leading-none">✕</button>
      </div>

      <form id="add-entry-form" enctype="multipart/form-data" class="space-y-4">
        <input type="hidden" name="person_id" value="${person.id}">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label>Type *</label>
            <select name="type" class="input" required>
              <option value="lent">↑ Lent</option>
              <option value="borrowed">↓ Borrowed</option>
            </select>
          </div>
          <div>
            <label>Amount (PKR) *</label>
            <input type="number" name="amount" class="input" placeholder="5000" step="0.01" min="0.01" required>
          </div>
          <div>
            <label>Payment Mode *</label>
            <select name="payment_mode" class="input" required>
              ${PAYMENT_MODES.map(m => `<option>${m}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Date *</label>
            <input type="date" name="entry_date" class="input" required>
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
            <label>Purpose</label>
            <input type="text" name="purpose" class="input" placeholder="e.g. Personal loan, Business advance…">
          </div>
          <div class="col-span-2">
            <label>Notes</label>
            <textarea name="notes" class="input" rows="2" placeholder="Private notes…"></textarea>
          </div>
        </div>

        <!-- ══ PROOF SECTION ══ -->
        <div>
          <label style="margin-bottom:8px;">
            Proof / Evidence
            <span class="text-subtle" style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;">(optional)</span>
          </label>

          <!-- 4 big tap buttons -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px;">

            <label class="cap-btn" id="cap-upload" title="Pick any file from device">
              <input type="file" name="proof" id="proof-file"
                     accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                     style="position:absolute;opacity:0;width:0;height:0;"
                     onchange="onFileChosen(this)">
              <span style="font-size:24px;line-height:1;">📁</span>
              <span class="cap-label">Upload</span>
            </label>

            <!-- capture="environment" → opens rear camera on mobile -->
            <label class="cap-btn" id="cap-photo" title="Take a photo with camera">
              <input type="file" id="photo-input" accept="image/*" capture="environment"
                     style="position:absolute;opacity:0;width:0;height:0;"
                     onchange="onFileChosen(this)">
              <span style="font-size:24px;line-height:1;">📷</span>
              <span class="cap-label">Photo</span>
            </label>

            <!-- capture="environment" → opens video recorder on mobile -->
            <label class="cap-btn" id="cap-video" title="Record a video">
              <input type="file" id="video-input" accept="video/*" capture="environment"
                     style="position:absolute;opacity:0;width:0;height:0;"
                     onchange="onFileChosen(this)">
              <span style="font-size:24px;line-height:1;">🎥</span>
              <span class="cap-label">Video</span>
            </label>

            <!-- Audio uses JS MediaRecorder (no native input for audio capture) -->
            <button type="button" class="cap-btn" id="cap-audio"
                    onclick="toggleAudio()" title="Record audio">
              <span style="font-size:24px;line-height:1;" id="audio-icon">🎙️</span>
              <span class="cap-label" id="audio-label">Audio</span>
            </button>

          </div>

          <!-- Audio recorder strip (shown only while recording / after) -->
          <div id="audio-ui" style="display:none;background:#050b18;border:1px solid #1e3a5f;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div id="rec-dot" style="width:10px;height:10px;border-radius:50%;background:#1e3a5f;flex-shrink:0;transition:background .3s;"></div>
              <span id="rec-timer" class="font-mono text-gold font-bold" style="font-size:17px;min-width:44px;">00:00</span>
              <div id="wave-wrap" style="display:flex;align-items:center;gap:2px;flex:1;">
                ${Array(18).fill(0).map(() => '<div style="width:3px;height:5px;background:#1e3a5f;border-radius:2px;transition:height .09s,background .09s;"></div>').join('')}
              </div>
              <button type="button" id="stop-btn" onclick="stopAudio()"
                      style="display:none;background:#ef4444;color:#fff;border:none;border-radius:6px;
                             padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">
                ⏹ Stop
              </button>
            </div>
            <audio id="audio-playback" controls
                   style="display:none;width:100%;margin-top:10px;height:34px;"></audio>
          </div>

          <!-- File chosen preview -->
          <div id="proof-preview" style="display:none;">
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;
                        background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.22);border-radius:8px;">
              <span id="proof-icon" style="font-size:22px;flex-shrink:0;">📄</span>
              <div style="flex:1;min-width:0;">
                <div id="proof-name" class="font-bold text-muted text-sm"
                     style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
                <div id="proof-size" class="text-subtle text-xs"></div>
              </div>
              <button type="button" onclick="resetProof()"
                      style="flex-shrink:0;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);
                             color:#f87171;border-radius:6px;padding:3px 10px;font-size:12px;
                             font-weight:700;cursor:pointer;">✕</button>
            </div>
            <img id="proof-thumb"
                 style="display:none;width:100%;max-height:160px;object-fit:cover;
                        border-radius:8px;margin-top:6px;" alt="preview">
          </div>
        </div>
        <!-- ══ END PROOF ══ -->

        <div id="upload-progress" class="hidden">
          <div style="height:5px;background:#162035;border-radius:99px;overflow:hidden;">
            <div id="upload-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#c9a84c,#e8cc7e);transition:width .4s;border-radius:99px;"></div>
          </div>
          <p class="text-subtle text-xs mt-1 text-center">Uploading…</p>
        </div>

        <div class="flex gap-3 pt-1">
          <button type="submit" class="btn btn-gold flex-1 justify-center">💾 Save Entry</button>
          <button type="button" onclick="closeModal('add-entry-modal');resetProof()" class="btn btn-outline">Cancel</button>
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
            <label>Date</label>
            <input type="date" id="ee-date" class="input">
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
      @media print {
        .print-only  { display:inline; }
        select.no-print { display:none !important; }
      }

      /* Capture buttons */
      .cap-btn {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 14px 6px 11px;
        background: #0f1e38;
        border: 1px solid #1e3a5f;
        border-radius: 12px;
        color: #7a92b5;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .05em;
        cursor: pointer;
        transition: border-color .18s, background .18s, color .18s;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .cap-btn:hover,
      .cap-btn:active    { border-color:#c9a84c; color:#c9a84c; background:rgba(201,168,76,.07); }
      .cap-btn.selected  { border-color:#c9a84c; color:#c9a84c; background:rgba(201,168,76,.12); }
      .cap-btn.rec-state { border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,.09); }
      .cap-label { line-height:1; }

      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
      .blink { animation: blink .85s ease infinite; }
    </style>`,
    scripts: `<script>
/* ── Modals ── */
function openModal(id)  { document.getElementById(id).classList.add('open') }
function closeModal(id) { document.getElementById(id).classList.remove('open') }
document.querySelector('[name="entry_date"]').value = new Date().toISOString().slice(0,10)

/* ══════════════════════════════════════════════════
   Proof state
══════════════════════════════════════════════════ */
let capturedFile  = null
let audioStream   = null
let audioRecorder = null
let audioChunks   = []
let audioSecs     = 0
let timerInt      = null
let waveInt       = null
let audioCtx      = null
let analyser      = null
let isRecording   = false

/* File inputs (upload / photo / video) → same handler */
function onFileChosen(input) {
  const file = input.files && input.files[0]
  if (!file) return
  showProof(file)
  // Highlight the button that was used
  highlightCap(input.closest('.cap-btn') || input.closest('label'))
}

function highlightCap(el) {
  document.querySelectorAll('.cap-btn').forEach(b => b.classList.remove('selected'))
  if (el) el.classList.add('selected')
}

function showProof(file) {
  capturedFile = file
  document.getElementById('proof-name').textContent = file.name
  document.getElementById('proof-size').textContent = fmtBytes(file.size)
  document.getElementById('proof-icon').textContent =
    file.type.startsWith('image/') ? '🖼️' :
    file.type.startsWith('video/') ? '🎬' :
    file.type.startsWith('audio/') ? '🔊' : '📄'
  document.getElementById('proof-preview').style.display = ''
  const thumb = document.getElementById('proof-thumb')
  if (file.type.startsWith('image/')) {
    thumb.src = URL.createObjectURL(file)
    thumb.style.display = 'block'
  } else {
    thumb.style.display = 'none'
  }
}

function resetProof() {
  capturedFile = null
  ;['proof-file','photo-input','video-input'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = ''
  })
  document.getElementById('proof-preview').style.display = 'none'
  document.getElementById('proof-thumb').style.display   = 'none'
  document.querySelectorAll('.cap-btn').forEach(b => b.classList.remove('selected','rec-state'))
  stopAudioFull()
  resetAudioUI()
}

function fmtBytes(n) {
  if (n < 1024)    return n + ' B'
  if (n < 1048576) return (n/1024).toFixed(1) + ' KB'
  return (n/1048576).toFixed(1) + ' MB'
}

function fmtTime(s) {
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0')
}

/* ══════════════════════════════════════════════════
   Audio recording
══════════════════════════════════════════════════ */
async function toggleAudio() {
  if (isRecording) { stopAudio(); return }
  await startAudio()
}

async function startAudio() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    isRecording = true

    /* Waveform */
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 32
    audioCtx.createMediaStreamSource(audioStream).connect(analyser)

    /* Pick best mime */
    const mime = ['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm','audio/mp4']
      .find(t => { try{return MediaRecorder.isTypeSupported(t)}catch(e){return false} }) || ''

    audioChunks = []; audioSecs = 0
    audioRecorder = new MediaRecorder(audioStream, mime ? {mimeType:mime} : {})
    audioRecorder.ondataavailable = e => { if(e.data && e.data.size>0) audioChunks.push(e.data) }
    audioRecorder.onstop = () => {
      const m2   = audioRecorder.mimeType || 'audio/webm'
      const blob = new Blob(audioChunks, {type:m2})
      const ext  = m2.includes('mp4')?'m4a': m2.includes('ogg')?'ogg':'webm'
      const file = new File([blob], 'audio_'+Date.now()+'.'+ext, {type:m2})
      const pb   = document.getElementById('audio-playback')
      pb.src = URL.createObjectURL(blob)
      pb.style.display = 'block'
      showProof(file)
      isRecording = false
    }
    audioRecorder.start(200)

    /* UI → recording state */
    document.getElementById('audio-ui').style.display  = ''
    document.getElementById('stop-btn').style.display  = ''
    document.getElementById('cap-audio').classList.add('rec-state')
    document.getElementById('audio-icon').textContent  = '⏹'
    document.getElementById('audio-label').textContent = 'Stop'
    const dot = document.getElementById('rec-dot')
    dot.style.background = '#ef4444'
    dot.classList.add('blink')

    /* Timer */
    timerInt = setInterval(() => {
      audioSecs++
      document.getElementById('rec-timer').textContent = fmtTime(audioSecs)
      if (audioSecs >= 300) stopAudio()
    }, 1000)

    /* Waveform animation */
    const bars = document.getElementById('wave-wrap').children
    const buf  = new Uint8Array(analyser.frequencyBinCount)
    waveInt = setInterval(() => {
      analyser.getByteFrequencyData(buf)
      Array.from(bars).forEach((b,i) => {
        const v = buf[i % buf.length] || 0
        b.style.height     = Math.max(4, (v/255)*32) + 'px'
        b.style.background = v > 35 ? '#c9a84c' : '#1e3a5f'
      })
    }, 85)

  } catch(err) {
    alert('Microphone error: ' + err.message)
    isRecording = false
  }
}

function stopAudio() {
  clearInterval(timerInt); timerInt = null
  clearInterval(waveInt);  waveInt  = null
  if (audioRecorder && audioRecorder.state !== 'inactive') audioRecorder.stop()
  if (audioStream) { audioStream.getTracks().forEach(t=>t.stop()); audioStream=null }
  if (audioCtx)   { try{audioCtx.close()}catch(e){} audioCtx=null }
  /* Reset bars */
  Array.from(document.getElementById('wave-wrap').children).forEach(b => {
    b.style.height='5px'; b.style.background='#1e3a5f'
  })
  document.getElementById('stop-btn').style.display = 'none'
  document.getElementById('cap-audio').classList.remove('rec-state')
  document.getElementById('cap-audio').classList.add('selected')
  document.getElementById('audio-icon').textContent  = '🎙️'
  document.getElementById('audio-label').textContent = 'Audio'
  const dot = document.getElementById('rec-dot')
  dot.classList.remove('blink')
  dot.style.background = '#22c55e'
}

function stopAudioFull() {
  clearInterval(timerInt); timerInt=null
  clearInterval(waveInt);  waveInt=null
  if (audioRecorder && audioRecorder.state!=='inactive') try{audioRecorder.stop()}catch(e){}
  if (audioStream) { audioStream.getTracks().forEach(t=>t.stop()); audioStream=null }
  if (audioCtx)   { try{audioCtx.close()}catch(e){} audioCtx=null }
  isRecording = false
}

function resetAudioUI() {
  document.getElementById('audio-ui').style.display       = 'none'
  document.getElementById('audio-playback').style.display = 'none'
  document.getElementById('audio-playback').src           = ''
  document.getElementById('rec-timer').textContent        = '00:00'
  document.getElementById('stop-btn').style.display       = 'none'
  document.getElementById('audio-icon').textContent       = '🎙️'
  document.getElementById('audio-label').textContent      = 'Audio'
  document.getElementById('rec-dot').style.background     = '#1e3a5f'
  document.getElementById('rec-dot').classList.remove('blink')
  Array.from(document.getElementById('wave-wrap').children).forEach(b => {
    b.style.height='5px'; b.style.background='#1e3a5f'
  })
  isRecording = false; audioChunks = []; audioSecs = 0
}

/* ══════════════════════════════════════════════════
   Form submit
══════════════════════════════════════════════════ */
document.getElementById('add-entry-form').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  if (capturedFile) { fd.delete('proof'); fd.append('proof', capturedFile, capturedFile.name) }

  document.getElementById('upload-progress').classList.remove('hidden')
  document.getElementById('upload-bar').style.width = '20%'

  const r = await fetch('/api/entries', { method:'POST', body:fd })
  document.getElementById('upload-bar').style.width = '100%'

  if (r.ok) {
    toast('Entry saved!')
    stopAudioFull()
    setTimeout(() => location.reload(), 700)
  } else {
    const t = await r.text()
    toast(t || 'Error saving entry', false)
    document.getElementById('upload-progress').classList.add('hidden')
  }
})

/* ══════════════════════════════════════════════════
   Edit entry
══════════════════════════════════════════════════ */
function editEntry(e) {
  document.getElementById('ee-id').value      = e.id
  document.getElementById('ee-type').value    = e.type
  document.getElementById('ee-amount').value  = e.amount
  document.getElementById('ee-mode').value    = e.payment_mode
  document.getElementById('ee-date').value    = (e.entry_date||'').slice(0,10)
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
  const r = await fetch('/api/entries/'+id, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  })
  if (r.ok) { toast('Updated!'); setTimeout(()=>location.reload(),700); closeModal('edit-entry-modal') }
  else toast('Update failed', false)
})

async function updateStatus(id, status) {
  const r = await fetch('/api/entries/'+id, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status})
  })
  if (r.ok) toast('Status updated!')
  else toast('Failed', false)
}
</script>`
  })
}
