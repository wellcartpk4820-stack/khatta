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
  <div class="sidebar fixed left-0 top-0 h-full flex flex-col no-print z-30 transition-all duration-300" style="width: 240px;">
    <button id="sidebarToggleBtn" class="absolute -right-3 top-20 bg-navy-elevated border border-navy-border rounded-full w-6 h-6 flex items-center justify-center text-gold hover:bg-gold/20 transition-all z-40 cursor-pointer hover:scale-110">
      ◀
    </button>
    <div class="px-6 py-6 border-b border-navy-border sidebar-header">
      <a href="/admin" class="flex items-center gap-3 sidebar-logo">
        <div class="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-navy font-bold text-lg flex-shrink-0">📒</div>
        <div class="sidebar-title">
          <div class="font-serif text-lg text-gold leading-tight">KhataBook</div>
          <div class="text-[10px] text-subtle uppercase tracking-widest">Admin Panel</div>
        </div>
      </a>
    </div>
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      ${navLink('/admin',           '📊', 'Dashboard',   activeNav === 'dashboard')}
      ${navLink('/admin/persons',   '👥', 'Persons',     activeNav === 'persons')}
      ${navLink('/admin/entries',   '📋', 'All Entries', activeNav === 'entries')}
      ${navLink('/admin/reminders', '🔔', 'Reminders',   activeNav === 'reminders')}
    </nav>
    <div class="px-3 py-4 border-t border-navy-border">
      ${navLink('/', '🌐', 'Public Lookup', false)}
      <form action="/logout" method="POST" class="mt-1">
        <button type="submit" class="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <span>🚪</span> <span class="nav-text">Logout</span>
        </button>
      </form>
    </div>
  </div>
  ` : ''

  const mainClass = admin ? 'main-content ml-60 transition-all duration-300 min-h-screen' : 'min-h-screen'

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
    .sidebar { background: #0a1220; border-right: 1px solid #1e3a5f; overflow-x: hidden; }
    .nav-item { display:flex; align-items:center; gap:10px; padding:9px 14px; border-radius:8px; font-size:14px; font-weight:600; color:#7a92b5; transition:all .18s; cursor:pointer; text-decoration:none; white-space: nowrap; }
    .nav-item:hover { background:#162035; color:#dde3f0; }
    .nav-item.active { background:rgba(201,168,76,0.12); color:#c9a84c; border:1px solid rgba(201,168,76,0.2); }
    .nav-text { transition: opacity 0.2s; }
    
    /* Collapsed sidebar styles */
    .sidebar.collapsed { width: 70px !important; }
    .sidebar.collapsed .sidebar-header { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
    .sidebar.collapsed .sidebar-title { display: none; }
    .sidebar.collapsed .nav-item { justify-content: center; padding: 9px 10px; gap: 0; }
    .sidebar.collapsed .nav-item span:first-child { margin-right: 0; font-size: 1.25rem; }
    .sidebar.collapsed .nav-text { display: none; }
    .sidebar.collapsed .sidebar-logo { justify-content: center; }
    .sidebar.collapsed .flex.items-center.gap-3 { gap: 0 !important; }
    
    /* Main content adjustment */
    .main-content.collapsed { margin-left: 70px !important; }

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

    /* ── Mobile ── */
    @media(max-width:768px){
      .sidebar { display:none; }
      .ml-60, .main-content.collapsed { margin-left:0 !important; }
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
      .sidebar { display:none !important; }
      .ml-60, .main-content.collapsed { margin-left:0 !important; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
  ${extraHead}
</head>
<body>
${adminNav}
<div class="${mainClass}">
  ${admin ? mobileSidebarToggle() : ''}
  <div id="toast"></div>
  ${content}
</div>
${scripts}
<script>
function toast(msg, ok=true){
  const el=document.createElement('div');
  el.className='toast '+(ok?'toast-ok':'toast-err');
  el.textContent=msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}
async function del(url, confirmMsg){
  if(!confirm(confirmMsg||'Are you sure?')) return;
  const r=await fetch(url,{method:'DELETE'});
  if(r.ok){ toast('Deleted successfully'); setTimeout(()=>location.reload(),800); }
  else { toast('Delete failed','err'); }
}

// Sidebar toggle functionality
(function() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  
  if (sidebar && mainContent && toggleBtn) {
    // Load saved state
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    function updateSidebarState(collapsed) {
      if (collapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('collapsed');
        toggleBtn.innerHTML = '▶';
        localStorage.setItem('sidebarCollapsed', 'true');
      } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('collapsed');
        toggleBtn.innerHTML = '◀';
        localStorage.setItem('sidebarCollapsed', 'false');
      }
    }
    
    // Apply saved state on load
    updateSidebarState(isCollapsed);
    
    // Toggle on click
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const isNowCollapsed = sidebar.classList.contains('collapsed');
      updateSidebarState(!isNowCollapsed);
    });
  }
})();
</script>
</body>
</html>`
}

function navLink(href: string, icon: string, label: string, active: boolean): string {
  return `<a href="${href}" class="nav-item${active ? ' active' : ''}"><span>${icon}</span> <span class="nav-text">${label}</span></a>`
}

function mobileSidebarToggle(): string {
  return `
  <div class="md:hidden no-print fixed top-0 left-0 right-0 z-20 bg-navy-card border-b border-navy-border px-4 py-3 flex items-center justify-between" style="background:#0a1220;border-color:#1e3a5f;">
    <a href="/admin" class="flex items-center gap-2 font-serif text-gold text-lg">📒 KhataBook</a>
    <button onclick="document.getElementById('mob-menu').classList.toggle('hidden')" class="text-muted text-2xl">☰</button>
  </div>
  <div id="mob-menu" class="hidden md:hidden fixed inset-0 z-50 bg-navy pt-14" style="background:#0a1220;">
    <nav class="px-4 py-4 space-y-1">
      <a href="/admin"           class="nav-item block">📊 Dashboard</a>
      <a href="/admin/persons"   class="nav-item block">👥 Persons</a>
      <a href="/admin/entries"   class="nav-item block">📋 All Entries</a>
      <a href="/admin/reminders" class="nav-item block">🔔 Reminders</a>
      <a href="/"                class="nav-item block">🌐 Public Lookup</a>
      <form action="/logout" method="POST">
        <button type="submit" class="nav-item w-full text-left text-red-400">🚪 Logout</button>
      </form>
      <button onclick="document.getElementById('mob-menu').classList.add('hidden')" class="nav-item text-muted">✕ Close</button>
    </nav>
  </div>
  <div class="md:hidden h-14"></div>`
}
