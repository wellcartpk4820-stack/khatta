// src/pages/login.ts
import { layout } from './layout'
import { escapeHtml } from '../utils/security'

export function loginPage(error?: string): string {
  return layout(`
  <div class="min-h-screen flex items-center justify-center px-4" style="background:radial-gradient(ellipse at 30% 20%,rgba(201,168,76,.06) 0%,transparent 60%), radial-gradient(ellipse at 70% 80%,rgba(30,58,95,.3) 0%,transparent 60%), #050b18;">
    <div class="w-full max-w-sm animate-up">

      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style="background:linear-gradient(135deg,#c9a84c,#8a6520);">
          <span class="text-3xl">📒</span>
        </div>
        <h1 class="font-serif text-4xl text-gold">KhataBook</h1>
        <p class="text-subtle text-sm mt-1 tracking-widest uppercase text-xs">Personal Ledger System</p>
      </div>

      <!-- Card -->
      <div class="card p-8">
        <h2 class="text-lg font-bold text-center mb-6 text-muted uppercase tracking-widest text-xs">Admin Access</h2>

        ${error ? `<div class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">${escapeHtml(error)}</div>` : ''}

        <form method="POST" action="/login" class="space-y-4">
          <div>
            <label>Email</label>
            <input type="email" name="email" class="input" placeholder="admin@yourdomain.com" required autocomplete="email">
          </div>
          <div>
            <label>Password</label>
            <input type="password" name="password" class="input" placeholder="••••••••" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-gold w-full justify-center mt-2" style="padding:12px;">
            🔓 Sign In
          </button>
        </form>
      </div>

      <div class="mt-6 text-center">
        <a href="/" class="text-subtle text-sm hover:text-muted transition-colors">🌐 Public Lookup →</a>
      </div>
    </div>
  </div>`, { title: 'Admin Login' })
}
