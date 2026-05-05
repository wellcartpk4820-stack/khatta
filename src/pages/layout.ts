// src/pages/layout.ts
import { escapeHtml } from '../utils/security'

export interface LayoutOpts {
  title?:       string
  admin?:       boolean        // show admin sidebar
  activeNav?:   string         // which nav item is active
  scripts?:     string
  extraHead?:   string
}

export function layout(content: string, opts: LayoutOpts = {}): string {
  const { title = 'KhataBook', admin = false, activeNav = '', scripts = '', extraHead = '' } = opts
  const fullTitle = `${title} — KhataBook`

  const adminNav = admin ? `
  <!-- ══ Sidebar ══════════════════════════════════════════════════ -->
  <div id="sidebar-overlay" class="sidebar-overlay no-print" onclick="closeSidebar()"></div>
  <div id="sidebar" class="sidebar fixed left-0 top-0 h-full flex flex-col no-print z-40">
    <div class="px-6 py-6 border-b border-navy-border" style="border-color:#1e3a5f;">
      <div class="flex items-center justify-between">
        <a href="/admin" class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-navy font-bold text-lg">📒</div>
          <div>
            <div class="font-serif text-lg text-gold leading-tight">KhataBook</div>
            <div class="text-[10px] text-subtle uppercase tracking-widest">Admin Panel</div>
          </div>
        </a>
        <!-- Close button — mobile only -->
        <button id="sidebar-close-btn" onclick="closeSidebar()"
          class="sidebar-close-btn text-muted hover:text-white text-2xl leading-none transition-colors"
          aria-label="Close menu">✕</button>
      </div>
    </div>
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      ${navLink('/admin',           '📊', 'Dashboard',   activeNav === 'dashboard')}
      ${navLink('/admin/persons',   '👥', 'Persons',     activeNav === 'persons')}
      ${navLink('/admin/entries',   '📋', 'All Entries', activeNav === 'entries')}
      ${navLink('/admin/reminders', '🔔', 'Reminders',   activeNav === 'reminders')}
    </nav>
    <div class="px-3 py-4 border-t" style="border-color:#1e3a5f;">
      ${navLink('/', '🌐', 'Public Lookup', false)}
      <form action="/logout" method="POST" class="mt-1">
        <button type="submit" class="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <span>🚪</span> Logout
        </button>
      </form>
    </div>
  </div>
  ` : ''

  const mainClass = admin ? 'main-content min-h-screen' : 'min-h-screen'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fullTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
  tailwind.config = {
    theme: { extend: {
      colors: {
        gold:   { DEFAULT:'#c9a84c', light:'#e8cc7e', dark:'#8a6520', glow:'rgba(201,168,76,0.15)' },
        navy:   { DEFAULT:'#050b18', card:'#0d1627', elevated:'#162035', border:'#1e3a5f', faint:'#0f1e38' },
        ink:    '#050b18',
        ledger: '#0a1220',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono:  ['"JetBrains Mono"', 'monospace'],
        sans:  ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      }
    }}
  }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { background: #050b18; color: #dde3f0; font-family: 'Nunito Sans', sans-serif; font-size: 15px; line-height: 1.6; }

    /* ── Sidebar ── */
    .sidebar {
      background: #0a1220;
      border-right: 1px solid #1e3a5f;
      width: 240px;
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;
    }

    /* Desktop: always visible, push content */
    @media (min-width: 769px) {
      .sidebar { transform: translateX(0) !important; }
      .main-content { margin-left: 240px; }
      .sidebar-close-btn { display: none !important; }
      .sidebar-overlay { display: none !important; }
      .mobile-topbar { display: none !important; }
    }

    /* Mobile: hidden by default, slides in on toggle */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        z-index: 50;
      }
      .sidebar.open {
        transform: translateX(0);
        box-shadow: 4px 0 30px rgba(0,0,0,0.6);
      }
      .main-content { margin-left: 0 !important; }
    }

    /* Overlay backdrop */
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(5, 11, 24, 0.75);
      z-index: 45;
      backdrop-filter: blur(3px);
      opacity: 0;
      transition: opacity 0.28s ease;
    }
    .sidebar-overlay.open {
      display: block;
      opacity: 1;
    }

    /* ── Mobile Top Bar ── */
    .mobile-topbar {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 30;
      background: #0a1220;
      border-bottom: 1px solid #1e3a5f;
      padding: 0 16px;
      height: 56px;
      align-items: center;
      justify-content: space-between;
    }
    @media (max-width: 768px) {
      .mobile-topbar { display: flex; }
      .mobile-topbar-spacer { height: 56px; }
    }

    /* Hamburger icon animation */
    .hamburger { display:flex;flex-direction:column;gap:5px;cursor:pointer;padding:6px;border-radius:6px;transition:background .2s; border:none; background:transparent; }
    .hamburger:hover { background: rgba(201,168,76,0.1); }
    .hamburger span {
      display: block; width: 22px; height: 2px;
      background: #c9a84c; border-radius: 2px;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform-origin: center;
    }
    .hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.active span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* ── Nav items ── */
    .nav-item { display:flex; align-items:center; gap:10px; padding:9px 14px; border-radius:8px; font-size:14px; font-weight:600; color:#7a92b5; transition:all .18s; cursor:pointer; text-decoration:none; border:1px solid transparent; }
    .nav-item:hover { background:#162035; color:#dde3f0; }
    .nav-item.active { background:rgba(201,168,76,0.12); color:#c9a84c; border-color:rgba(201,168,76,0.2); }

    /* ── Cards ── */
    .card { background:#0d1627; border:1px solid #1e3a5f; border-radius:12px; }
    .card-raised { background:#162035; }

    /* ── Buttons ── */
    .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:8px; font-weight:700; font-size:14px; cursor:pointer; transition:all .18s; border:none; text-decoration:none; }
    .btn-gold  { background:linear-gradient(135deg,#c9a84c,#8a6520); color:#050b18; }
    .btn-gold:hover  { background:linear-gradient(135deg,#e8cc7e,#c9a84c); box-shadow:0 4px 14px rgba(201,168,76,.35); transform:translateY(-1px); }
    .btn-outline { background:transparent; color:#c9a84c; border:1px solid rgba(201,168,76,.45); }
    .btn-outline:hover { background:rgba(201,168,76,.08); border-color:#c9a84c; }
    .btn-danger  { background:rgba(239,68,68,.12); color:#f87171; border:1px solid rgba(239,68,68,.3); }
    .btn-danger:hover  { background:rgba(239,68,68,.22); }
    .btn-green  { background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; }
    .btn-green:hover  { opacity:.9; }
    .btn-sm { padding:6px 14px; font-size:13px; }

    /* ── Inputs ── */
    .input { background:#0f1e38; border:1px solid #1e3a5f; color:#dde3f0; padding:10px 14px; border-radius:8px; width:100%; font-size:14px; font-family:inherit; transition:border-color .2s,box-shadow .2s; }
    .input:focus { outline:none; border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,.12); }
    .input::placeholder { color:#455a77; }
    select.input { cursor:pointer; }
    textarea.input { resize:vertical; min-height:80px; }
    label { display:block; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#7a92b5; margin-bottom:6px; }

    /* ── Tables ── */
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { color:#c9a84c; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; padding:12px 16px; text-align:left; border-bottom:1px solid #1e3a5f; white-space:nowrap; }
    .data-table td { padding:13px 16px; border-bottom:1px solid rgba(30,58,95,.45); font-size:14px; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .data-table tbody tr:hover td { background:rgba(22,32,53,.6); }

    /* ── Badges ── */
    .badge { display:inline-block; padding:2px 10px; border-radius:99px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .badge-lent     { background:rgba(34,197,94,.12);  color:#22c55e; border:1px solid rgba(34,197,94,.25); }
    .badge-borrowed { background:rgba(239,68,68,.12);  color:#f87171; border:1px solid rgba(239,68,68,.25); }
    .badge-pending  { background:rgba(234,179,8,.12);  color:#fbbf24; border:1px solid rgba(234,179,8,.25); }
    .badge-settled  { background:rgba(99,102,241,.12); color:#a5b4fc; border:1px solid rgba(99,102,241,.25); }
    .badge-paid     { background:rgba(34,197,94,.12);  color:#4ade80; border:1px solid rgba(34,197,94,.25); }
    .badge-received { background:rgba(59,130,246,.12); color:#60a5fa; border:1px solid rgba(59,130,246,.25); }
    .badge-partial  { background:rgba(251,146,60,.12); color:#fb923c; border:1px solid rgba(251,146,60,.25); }
    .badge-cancelled{ background:rgba(107,114,128,.12);color:#9ca3af; border:1px solid rgba(107,114,128,.25); }
    .badge-overdue  { background:rgba(239,68,68,.2);   color:#f87171; border:1px solid rgba(239,68,68,.4); animation:pulse 2s infinite; }

    /* ── Amount ── */
    .amt { font-family:'JetBrains Mono', monospace; font-weight:600; font-size:14px; }
    .amt-lent     { color:#22c55e; }
    .amt-borrowed { color:#f87171; }
    .amt-gold     { color:#c9a84c; }

    /* ── Stat cards ── */
    .stat { background:#0d1627; border:1px solid #1e3a5f; border-radius:12px; padding:20px 24px; }
    .stat-val { font-family:'JetBrains Mono', monospace; font-size:26px; font-weight:700; line-height:1.2; }

    /* ── Modal ── */
    .modal-bg { display:none; position:fixed; inset:0; background:rgba(5,11,24,.88); z-index:100; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(5px); }
    .modal-bg.open { display:flex; }
    .modal { background:#0d1627; border:1px solid #1e3a5f; border-radius:14px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; }

    /* ── Toasts ── */
    #toast { position:fixed; bottom:24px; right:24px; z-index:999; display:flex; flex-direction:column; gap:8px; }
    .toast { padding:12px 20px; border-radius:10px; font-size:13px; font-weight:600; animation:slideIn .3s ease; }
    .toast-ok  { background:#162035; border:1px solid #22c55e; color:#4ade80; }
    .toast-err { background:#1a0f0f; border:1px solid #ef4444; color:#f87171; }

    /* ── Utilities ── */
    .text-gold   { color:#c9a84c; }
    .text-muted  { color:#7a92b5; }
    .text-subtle { color:#455a77; }
    .divider { border:none; border-top:1px solid #1e3a5f; margin:0; }

    /* ── Animations ── */
    @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.6} }
    .animate-up  { animation:fadeUp .35s ease forwards; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width:5px; height:5px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:3px; }
    ::-webkit-scrollbar-thumb:hover { background:#c9a84c; }

    /* ── Mobile responsive ── */
    @media(max-width:768px){
      .data-table th, .data-table td { padding:10px 12px; font-size:13px; }
      .hide-mobile { display:none !important; }
    }

    /* ── Print ── */
    @media print {
      .no-print { display:none !important; }
      body { background:#fff !important; color:#111 !important; font-size:12px; }
      .card { background:#fff !important; border-color:#ddd !important; }
      .data-table th { color:#555 !important; }
      .data-table td { border-color:#eee !important; }
      .amt-lent     { color:#16a34a !important; }
      .amt-borrowed { color:#dc2626 !important; }
      .badge-lent   { color:#16a34a !important; border-color:#16a34a !important; background:transparent !important; }
      .badge-borrowed { color:#dc2626 !important; border-color:#dc2626 !important; background:transparent !important; }
      .sidebar, .mobile-topbar, .sidebar-overlay { display:none !important; }
      .main-content { margin-left:0 !important; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
  ${extraHead}
</head>
<body>

${adminNav}

${admin ? `
<!-- ── Mobile Top Bar ─────────────────────────────────────── -->
<div class="mobile-topbar no-print">
  <button id="hamburger-btn" class="hamburger" onclick="toggleSidebar()" aria-label="Toggle menu">
    <span></span>
    <span></span>
    <span></span>
  </button>
  <a href="/admin" class="flex items-center gap-2 font-serif text-gold" style="font-size:20px;text-decoration:none;">
    📒 KhataBook
  </a>
  <div style="width:34px;"></div><!-- spacer to center title -->
</div>
<div class="mobile-topbar-spacer no-print"></div>
` : ''}

<div class="${mainClass}">
  <div id="toast"></div>
  ${content}
</div>

${scripts}

<script>
/* ── Sidebar toggle ── */
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar')
  const overlay  = document.getElementById('sidebar-overlay')
  const hamburger = document.getElementById('hamburger-btn')
  if (!sidebar) return
  const isOpen = sidebar.classList.contains('open')
  if (isOpen) {
    closeSidebar()
  } else {
    sidebar.classList.add('open')
    if (overlay)  overlay.classList.add('open')
    if (hamburger) hamburger.classList.add('active')
    document.body.style.overflow = 'hidden'
  }
}

function closeSidebar() {
  const sidebar   = document.getElementById('sidebar')
  const overlay   = document.getElementById('sidebar-overlay')
  const hamburger = document.getElementById('hamburger-btn')
  if (!sidebar) return
  sidebar.classList.remove('open')
  if (overlay)  overlay.classList.remove('open')
  if (hamburger) hamburger.classList.remove('active')
  document.body.style.overflow = ''
}

/* Close sidebar on Escape key */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeSidebar()
})

/* Close sidebar when a nav link is tapped on mobile */
document.querySelectorAll('#sidebar .nav-item').forEach(function(link) {
  link.addEventListener('click', function() {
    if (window.innerWidth <= 768) closeSidebar()
  })
})

/* ── Toast helper ── */
function toast(msg, ok){
  if(ok===undefined) ok=true;
  var el=document.createElement('div');
  el.className='toast '+(ok?'toast-ok':'toast-err');
  el.textContent=msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(function(){el.remove();}, 3500);
}

/* ── Delete helper ── */
async function del(url, confirmMsg){
  if(!confirm(confirmMsg||'Are you sure?')) return;
  var r=await fetch(url,{method:'DELETE'});
  if(r.ok){ toast('Deleted successfully'); setTimeout(function(){location.reload();},800); }
  else { toast('Delete failed', false); }
}
</script>
</body>
</html>`
}

function navLink(href: string, icon: string, label: string, active: boolean): string {
  return `<a href="${href}" class="nav-item${active ? ' active' : ''}"><span>${icon}</span> ${label}</a>`
}
