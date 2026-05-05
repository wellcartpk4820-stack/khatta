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
        <div class="text-right">
          <p class="text-subtle text-xs uppercase tracking-widest mb-1">Net Balance</p>
          <p class="font-mono text-2xl font-bold ${netBalance >= 0 ? 'amt-lent' : 'amt-borrowed'}">
            ${netBalance >= 0 ? '+' : '-'}PKR ${formatAmount(Math.abs(netBalance))}
          </p>
          <p class="text-subtle text-xs mt-1">${netBalance >= 0 ? 'They owe you' : 'You owe them'}</p>
          ${pendingLent > 0 ? `<p class="text-yellow-400 text-xs mt-2">⏳ PKR ${formatAmount(pendingLent)} pending recovery</p>` : ''}
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
                <td class="text-muted text-sm">${formatDate(e.entry_date)}</td>
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

    <div class="print-only mt-8 text-center text-xs text-subtle border-t pt-4" style="border-color:#ddd;">
      Printed from KhataBook — Personal Ledger System &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-PK')}
    </div>

  </div>

  <!-- ══ Add Entry Modal ══════════════════════════════════════ -->
  <div id="add-entry-modal" class="modal-bg no-print">
    <div class="modal p-6" style="max-width:620px;">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-serif text-xl text-gold">New Entry — ${escapeHtml(person.name)}</h2>
        <button onclick="closeModal('add-entry-modal');stopAllMedia()" class="text-muted hover:text-white text-xl">✕</button>
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
            <input type="number" name="amount" class="input" placeholder="5000.00" step="0.01" min="0.01" required>
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
            <label>Purpose / Reason</label>
            <input type="text" name="purpose" class="input" placeholder="e.g. Personal loan, Business advance, Emergency…">
          </div>
          <div class="col-span-2">
            <label>Internal Notes</label>
            <textarea name="notes" class="input" rows="2" placeholder="Private notes…"></textarea>
          </div>
        </div>

        <!-- ══ PROOF CAPTURE SECTION ══ -->
        <div>
          <label>Proof / Evidence</label>

          <!-- Mode tabs -->
          <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
            <button type="button" onclick="setProofMode('upload')"   id="tab-upload"  class="proof-tab active-tab">📁 Upload File</button>
            <button type="button" onclick="setProofMode('photo')"    id="tab-photo"   class="proof-tab">📷 Take Photo</button>
            <button type="button" onclick="setProofMode('video')"    id="tab-video"   class="proof-tab">🎥 Record Video</button>
            <button type="button" onclick="setProofMode('audio')"    id="tab-audio"   class="proof-tab">🎙️ Record Audio</button>
          </div>

          <!-- Upload panel -->
          <div id="panel-upload">
            <input type="file" name="proof" id="proof-file" class="input py-2"
                   accept="image/*,audio/*,video/*,.pdf,.doc,.docx">
            <p class="text-subtle text-xs mt-1">Images, audio, video, PDF, Word — max 25 MB</p>
          </div>

          <!-- Photo panel -->
          <div id="panel-photo" style="display:none;">
            <div style="background:#050b18;border:1px solid #1e3a5f;border-radius:10px;overflow:hidden;position:relative;">
              <video id="photo-preview" autoplay playsinline muted
                     style="width:100%;max-height:260px;object-fit:cover;display:block;"></video>
              <canvas id="photo-canvas" style="display:none;width:100%;max-height:260px;object-fit:cover;"></canvas>
              <img id="photo-result" style="display:none;width:100%;max-height:260px;object-fit:cover;border-radius:0 0 10px 10px;" alt="Captured">
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
              <button type="button" onclick="startCamera()" id="btn-cam-start" class="btn btn-outline btn-sm">▶ Start Camera</button>
              <button type="button" onclick="capturePhoto()" id="btn-cam-snap" class="btn btn-gold btn-sm" style="display:none;">📸 Capture</button>
              <button type="button" onclick="retakePhoto()" id="btn-cam-retake" class="btn btn-outline btn-sm" style="display:none;">🔄 Retake</button>
              <button type="button" onclick="switchCamera()" id="btn-cam-switch" class="btn btn-outline btn-sm" style="display:none;">🔀 Flip</button>
            </div>
            <p id="photo-status" class="text-subtle text-xs mt-2"></p>
          </div>

          <!-- Video panel -->
          <div id="panel-video" style="display:none;">
            <div style="background:#050b18;border:1px solid #1e3a5f;border-radius:10px;overflow:hidden;">
              <video id="video-preview" autoplay playsinline muted
                     style="width:100%;max-height:240px;object-fit:cover;display:block;"></video>
              <video id="video-result" controls style="display:none;width:100%;max-height:240px;"></video>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap;">
              <button type="button" onclick="startVideoCapture()" id="btn-vid-start" class="btn btn-outline btn-sm">▶ Start Camera</button>
              <button type="button" onclick="startVideoRecord()" id="btn-vid-rec" class="btn btn-danger btn-sm" style="display:none;">⏺ Record</button>
              <button type="button" onclick="stopVideoRecord()" id="btn-vid-stop" class="btn btn-outline btn-sm" style="display:none;">⏹ Stop</button>
              <button type="button" onclick="retakeVideo()" id="btn-vid-retake" class="btn btn-outline btn-sm" style="display:none;">🔄 Retake</button>
              <span id="vid-timer" class="text-red-400 font-mono text-sm font-bold" style="display:none;"></span>
            </div>
            <p id="video-status" class="text-subtle text-xs mt-2"></p>
          </div>

          <!-- Audio panel -->
          <div id="panel-audio" style="display:none;">
            <div style="background:#050b18;border:1px solid #1e3a5f;border-radius:10px;padding:20px;text-align:center;">
              <!-- Waveform bars -->
              <div id="audio-waveform" style="display:flex;align-items:center;justify-content:center;gap:3px;height:48px;margin-bottom:12px;">
                ${Array(20).fill(0).map((_,i) => `<div class="wave-bar" data-i="${i}" style="width:4px;height:8px;background:#1e3a5f;border-radius:2px;transition:height .1s;"></div>`).join('')}
              </div>
              <audio id="audio-result" controls style="display:none;width:100%;margin-bottom:8px;"></audio>
              <span id="audio-timer" class="font-mono text-2xl font-bold text-gold" style="display:block;margin-bottom:16px;">00:00</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;justify-content:center;flex-wrap:wrap;">
              <button type="button" onclick="startAudioRecord()" id="btn-aud-start" class="btn btn-gold btn-sm">🎙️ Start Recording</button>
              <button type="button" onclick="stopAudioRecord()" id="btn-aud-stop" class="btn btn-danger btn-sm" style="display:none;">⏹ Stop</button>
              <button type="button" onclick="retakeAudio()" id="btn-aud-retake" class="btn btn-outline btn-sm" style="display:none;">🔄 Redo</button>
            </div>
            <p id="audio-status" class="text-subtle text-xs mt-2 text-center"></p>
          </div>

          <!-- Captured file indicator -->
          <div id="captured-file-info" style="display:none;margin-top:8px;padding:8px 12px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:8px;">
            <span class="text-green-400 text-xs font-bold">✓ </span>
            <span id="captured-file-name" class="text-muted text-xs"></span>
            <button type="button" onclick="clearCapturedFile()" class="text-red-400 text-xs ml-3 hover:underline">Remove</button>
          </div>
        </div>
        <!-- ══ END PROOF CAPTURE ══ -->

        <div id="upload-progress" class="hidden">
          <div class="h-1.5 bg-navy-elevated rounded-full overflow-hidden">
            <div id="upload-bar" class="h-full bg-gold rounded-full transition-all" style="width:0%"></div>
          </div>
          <p class="text-subtle text-xs mt-1">Uploading proof…</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-gold flex-1 justify-center">💾 Save Entry</button>
          <button type="button" onclick="closeModal('add-entry-modal');stopAllMedia()" class="btn btn-outline">Cancel</button>
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
              <option value="lent">↑ Lent (Gave)</option>
              <option value="borrowed">↓ Borrow (Receive)</option>
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
      @media print { .print-only { display:inline; } select.no-print { display:none !important; } }

      /* Proof mode tabs */
      .proof-tab {
        padding:6px 14px;
        border-radius:8px;
        font-size:12px;
        font-weight:700;
        cursor:pointer;
        border:1px solid #1e3a5f;
        background:transparent;
        color:#7a92b5;
        transition:all .18s;
      }
      .proof-tab:hover { border-color:#c9a84c; color:#c9a84c; }
      .proof-tab.active-tab { background:rgba(201,168,76,.15); color:#c9a84c; border-color:rgba(201,168,76,.5); }

      /* Audio waveform animation */
      @keyframes waveAnim {
        0%,100% { height:6px; }
        50%      { height:36px; }
      }
      .wave-bar.active {
        background: #c9a84c !important;
        animation: waveAnim .6s ease-in-out infinite;
      }

      /* Recording pulse */
      @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      .rec-pulse { animation:recPulse 1s ease infinite; }
    </style>`,
    scripts: `<script>
/* ══════════════════════════════════════════════════════
   Modal helpers
══════════════════════════════════════════════════════ */
function openModal(id)  { document.getElementById(id).classList.add('open') }
function closeModal(id) { document.getElementById(id).classList.remove('open') }

// Set default date
document.querySelector('[name="entry_date"]').value = new Date().toISOString().slice(0,10)

/* ══════════════════════════════════════════════════════
   PROOF MODE SWITCHING
══════════════════════════════════════════════════════ */
const panels = ['upload','photo','video','audio']
let currentMode = 'upload'
let capturedFile = null   // File object from recording/capture

function setProofMode(mode) {
  stopAllMedia()
  currentMode = mode
  panels.forEach(p => {
    document.getElementById('panel-'+p).style.display = p===mode ? '' : 'none'
    const tab = document.getElementById('tab-'+p)
    tab.classList.toggle('active-tab', p===mode)
  })
  clearCapturedFile()
}

function setCapturedFile(file, label) {
  capturedFile = file
  document.getElementById('captured-file-info').style.display = ''
  document.getElementById('captured-file-name').textContent = label
  // Disable native file input when a capture is active
  const fi = document.getElementById('proof-file')
  if (fi) fi.disabled = true
}

function clearCapturedFile() {
  capturedFile = null
  document.getElementById('captured-file-info').style.display = 'none'
  const fi = document.getElementById('proof-file')
  if (fi) fi.disabled = false
}

/* ══════════════════════════════════════════════════════
   STOP ALL MEDIA (cleanup)
══════════════════════════════════════════════════════ */
let activeStream = null
let mediaRecorder = null
let timerInterval = null
let waveInterval  = null
let facingMode    = 'environment'  // rear camera default

function stopAllMedia() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop() } catch(e){}
  }
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop())
    activeStream = null
  }
  clearInterval(timerInterval)
  clearInterval(waveInterval)
  timerInterval = null
  waveInterval  = null
  resetPhotoUI()
  resetVideoUI()
  resetAudioUI()
}

/* ══════════════════════════════════════════════════════
   PHOTO CAPTURE
══════════════════════════════════════════════════════ */
function resetPhotoUI() {
  const vid = document.getElementById('photo-preview')
  const cnv = document.getElementById('photo-canvas')
  const img = document.getElementById('photo-result')
  vid.style.display = 'block'; cnv.style.display='none'; img.style.display='none'
  vid.srcObject = null
  show('btn-cam-start'); hide('btn-cam-snap'); hide('btn-cam-retake'); hide('btn-cam-switch')
  document.getElementById('photo-status').textContent = ''
}

async function startCamera() {
  try {
    document.getElementById('photo-status').textContent = 'Opening camera…'
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width:{ideal:1280}, height:{ideal:720} }
    })
    activeStream = stream
    const vid = document.getElementById('photo-preview')
    vid.srcObject = stream
    await vid.play()
    hide('btn-cam-start'); show('btn-cam-snap'); show('btn-cam-switch')
    document.getElementById('photo-status').textContent = 'Camera ready — tap Capture'
  } catch(err) {
    document.getElementById('photo-status').textContent = '⚠ Camera error: ' + err.message
  }
}

async function switchCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment'
  if (activeStream) { activeStream.getTracks().forEach(t=>t.stop()); activeStream=null }
  await startCamera()
}

function capturePhoto() {
  const vid = document.getElementById('photo-preview')
  const cnv = document.getElementById('photo-canvas')
  const img = document.getElementById('photo-result')
  cnv.width  = vid.videoWidth  || 1280
  cnv.height = vid.videoHeight || 720
  const ctx = cnv.getContext('2d')
  ctx.drawImage(vid, 0, 0, cnv.width, cnv.height)

  cnv.toBlob(blob => {
    const file = new File([blob], 'photo_' + Date.now() + '.jpg', {type:'image/jpeg'})
    img.src = URL.createObjectURL(blob)
    vid.style.display='none'; img.style.display='block'
    if (activeStream) { activeStream.getTracks().forEach(t=>t.stop()); activeStream=null }
    hide('btn-cam-snap'); hide('btn-cam-switch')
    show('btn-cam-retake')
    setCapturedFile(file, '📷 photo_' + new Date().toLocaleTimeString() + '.jpg')
    document.getElementById('photo-status').textContent = '✓ Photo captured'
  }, 'image/jpeg', 0.9)
}

function retakePhoto() {
  clearCapturedFile()
  const img = document.getElementById('photo-result')
  img.src=''; img.style.display='none'
  hide('btn-cam-retake')
  startCamera()
}

/* ══════════════════════════════════════════════════════
   VIDEO RECORDING
══════════════════════════════════════════════════════ */
let videoChunks = []

function resetVideoUI() {
  const pv = document.getElementById('video-preview')
  const rv = document.getElementById('video-result')
  pv.style.display='block'; pv.srcObject=null
  rv.style.display='none';  rv.src=''
  show('btn-vid-start'); hide('btn-vid-rec'); hide('btn-vid-stop'); hide('btn-vid-retake')
  hide('vid-timer')
  document.getElementById('video-status').textContent = ''
}

async function startVideoCapture() {
  try {
    document.getElementById('video-status').textContent = 'Opening camera…'
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode:'environment', width:{ideal:1280} },
      audio: true
    })
    activeStream = stream
    const pv = document.getElementById('video-preview')
    pv.srcObject = stream
    await pv.play()
    hide('btn-vid-start'); show('btn-vid-rec')
    document.getElementById('video-status').textContent = 'Camera ready — press Record'
  } catch(err) {
    document.getElementById('video-status').textContent = '⚠ Error: ' + err.message
  }
}

function startVideoRecord() {
  if (!activeStream) return
  videoChunks = []
  const mimeType = getSupportedMime(['video/webm;codecs=vp9,opus','video/webm','video/mp4'])
  mediaRecorder = new MediaRecorder(activeStream, mimeType ? {mimeType} : {})
  mediaRecorder.ondataavailable = e => { if(e.data.size>0) videoChunks.push(e.data) }
  mediaRecorder.onstop = () => {
    const blob = new Blob(videoChunks, {type: mimeType||'video/webm'})
    const ext  = (mimeType||'video/webm').includes('mp4') ? 'mp4' : 'webm'
    const file = new File([blob], 'video_' + Date.now() + '.' + ext, {type: blob.type})
    const rv   = document.getElementById('video-result')
    rv.src = URL.createObjectURL(blob)
    rv.style.display='block'
    document.getElementById('video-preview').style.display='none'
    show('btn-vid-retake'); hide('btn-vid-stop')
    clearInterval(timerInterval)
    document.getElementById('vid-timer').style.display='none'
    setCapturedFile(file, '🎥 video_' + new Date().toLocaleTimeString() + '.' + ext)
    document.getElementById('video-status').textContent = '✓ Video recorded — ' + formatDuration(videoSecs)
  }
  let videoSecs = 0
  const timerEl = document.getElementById('vid-timer')
  timerEl.style.display = 'inline'
  timerInterval = setInterval(() => {
    videoSecs++
    timerEl.textContent = '⏺ ' + formatDuration(videoSecs)
    if (videoSecs >= 300) stopVideoRecord()  // 5 min max
  }, 1000)
  timerEl.classList.add('rec-pulse')
  mediaRecorder.start(250)
  hide('btn-vid-rec'); show('btn-vid-stop')
  document.getElementById('video-status').textContent = 'Recording…'
}

function stopVideoRecord() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  clearInterval(timerInterval)
  document.getElementById('vid-timer').classList.remove('rec-pulse')
  if (activeStream) { activeStream.getTracks().forEach(t=>t.stop()); activeStream=null }
}

function retakeVideo() {
  clearCapturedFile()
  const rv = document.getElementById('video-result')
  rv.src=''; rv.style.display='none'
  document.getElementById('video-preview').style.display='block'
  hide('btn-vid-retake')
  videoChunks = []
  startVideoCapture()
}

/* ══════════════════════════════════════════════════════
   AUDIO RECORDING
══════════════════════════════════════════════════════ */
let audioChunks = []
let audioSecs   = 0
let analyser    = null
let audioCtx    = null

function resetAudioUI() {
  const ar = document.getElementById('audio-result')
  ar.src=''; ar.style.display='none'
  show('btn-aud-start'); hide('btn-aud-stop'); hide('btn-aud-retake')
  document.getElementById('audio-timer').textContent = '00:00'
  document.getElementById('audio-status').textContent = ''
  stopWaveform()
}

async function startAudioRecord() {
  try {
    document.getElementById('audio-status').textContent = 'Requesting microphone…'
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    activeStream = stream

    // Web Audio analyser for waveform
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    analyser  = audioCtx.createAnalyser()
    analyser.fftSize = 64
    audioCtx.createMediaStreamSource(stream).connect(analyser)
    startWaveform()

    const mimeType = getSupportedMime(['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm','audio/mp4'])
    audioChunks = []
    audioSecs   = 0
    mediaRecorder = new MediaRecorder(stream, mimeType ? {mimeType} : {})
    mediaRecorder.ondataavailable = e => { if(e.data.size>0) audioChunks.push(e.data) }
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, {type: mimeType||'audio/webm'})
      const ext  = (mimeType||'audio/webm').includes('mp4') ? 'm4a' : ((mimeType||'').includes('ogg') ? 'ogg' : 'webm')
      const file = new File([blob], 'audio_' + Date.now() + '.' + ext, {type: blob.type})
      const ar   = document.getElementById('audio-result')
      ar.src = URL.createObjectURL(blob)
      ar.style.display = 'block'
      show('btn-aud-retake'); hide('btn-aud-stop')
      clearInterval(timerInterval); timerInterval=null
      stopWaveform()
      setCapturedFile(file, '🎙️ audio_' + new Date().toLocaleTimeString() + '.' + ext)
      document.getElementById('audio-status').textContent = '✓ Audio recorded — ' + formatDuration(audioSecs)
    }
    mediaRecorder.start(250)
    timerInterval = setInterval(() => {
      audioSecs++
      document.getElementById('audio-timer').textContent = formatDuration(audioSecs)
    }, 1000)
    hide('btn-aud-start'); show('btn-aud-stop')
    document.getElementById('audio-status').textContent = '🔴 Recording…'
  } catch(err) {
    document.getElementById('audio-status').textContent = '⚠ Mic error: ' + err.message
  }
}

function stopAudioRecord() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  clearInterval(timerInterval); timerInterval=null
  if (activeStream) { activeStream.getTracks().forEach(t=>t.stop()); activeStream=null }
  if (audioCtx) { try{audioCtx.close()}catch(e){} audioCtx=null }
  stopWaveform()
}

function retakeAudio() {
  clearCapturedFile()
  const ar = document.getElementById('audio-result')
  ar.src=''; ar.style.display='none'
  document.getElementById('audio-timer').textContent='00:00'
  hide('btn-aud-retake')
  audioChunks=[]
  startAudioRecord()
}

function startWaveform() {
  const bars = document.querySelectorAll('.wave-bar')
  const buf  = new Uint8Array(analyser.frequencyBinCount)
  waveInterval = setInterval(() => {
    analyser.getByteFrequencyData(buf)
    bars.forEach((bar, i) => {
      const val = buf[i % buf.length] || 0
      const h   = Math.max(6, (val / 255) * 42)
      bar.style.height = h + 'px'
      bar.style.background = val > 50 ? '#c9a84c' : '#1e3a5f'
      bar.classList.toggle('active', val > 30)
    })
  }, 80)
}

function stopWaveform() {
  clearInterval(waveInterval); waveInterval=null
  document.querySelectorAll('.wave-bar').forEach(b => {
    b.style.height='8px'; b.style.background='#1e3a5f'; b.classList.remove('active')
  })
}

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function show(id) { const el=document.getElementById(id); if(el) el.style.display='' }
function hide(id) { const el=document.getElementById(id); if(el) el.style.display='none' }

function formatDuration(secs) {
  const m = Math.floor(secs/60).toString().padStart(2,'0')
  const s = (secs%60).toString().padStart(2,'0')
  return m+':'+s
}

function getSupportedMime(types) {
  return types.find(t => {
    try { return MediaRecorder.isTypeSupported(t) } catch(e){ return false }
  }) || null
}

/* ══════════════════════════════════════════════════════
   FORM SUBMIT — handles both file upload and captured file
══════════════════════════════════════════════════════ */
document.getElementById('add-entry-form').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)

  // Inject captured file (from recording/photo) into form data
  if (capturedFile) {
    fd.delete('proof')
    fd.append('proof', capturedFile, capturedFile.name)
  }

  document.getElementById('upload-progress').classList.remove('hidden')
  document.getElementById('upload-bar').style.width = '30%'

  const r = await fetch('/api/entries', { method:'POST', body: fd })
  document.getElementById('upload-bar').style.width = '100%'
  if (r.ok) {
    toast('Entry saved!')
    stopAllMedia()
    setTimeout(() => location.reload(), 800)
  } else {
    const t = await r.text()
    toast(t || 'Error saving entry', false)
  }
  document.getElementById('upload-progress').classList.add('hidden')
})

/* ══════════════════════════════════════════════════════
   EDIT ENTRY
══════════════════════════════════════════════════════ */
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

/* ── Quick status update ── */
async function updateStatus(id, status){
  const r = await fetch('/api/entries/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) })
  if(r.ok) toast('Status updated!')
  else toast('Failed to update status', false)
}
</script>`
  })
}
