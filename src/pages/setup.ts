// src/pages/setup.ts
import { layout }     from './layout'
import { escapeHtml } from '../utils/security'

export function setupPage(error?: string): string {
  return layout(`
  <div class="min-h-screen flex items-center justify-center px-4"
       style="background:radial-gradient(ellipse at 30% 20%,rgba(201,168,76,.06) 0%,transparent 60%),
                         radial-gradient(ellipse at 70% 80%,rgba(30,58,95,.3) 0%,transparent 60%),
                         #050b18;">
    <div class="w-full max-w-md animate-up">

      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
             style="background:linear-gradient(135deg,#c9a84c,#8a6520);">
          <span class="text-3xl">📒</span>
        </div>
        <h1 class="font-serif text-4xl text-gold">KhataBook</h1>
        <p class="text-subtle text-sm mt-1 tracking-widest uppercase text-xs">First-Time Setup</p>
      </div>

      <!-- Card -->
      <div class="card p-8">

        <!-- Welcome banner -->
        <div class="mb-6 p-4 rounded-xl text-center"
             style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3);">
          <p class="text-gold text-sm font-bold">🚀 Welcome! Create your admin account to get started.</p>
          <p class="text-subtle text-xs mt-1">This page disappears after your first account is saved.</p>
        </div>

        ${error
          ? `<div class="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
               ⚠️ ${escapeHtml(error)}
             </div>`
          : ''}

        <form method="POST" action="/setup" class="space-y-4">
          <div>
            <label>Your Name *</label>
            <input type="text" name="name" class="input"
                   placeholder="Muhammad Ali" required autocomplete="name">
          </div>
          <div>
            <label>Admin Email *</label>
            <input type="email" name="email" class="input"
                   placeholder="admin@yourdomain.com" required autocomplete="email">
          </div>
          <div>
            <label>Password *</label>
            <input type="password" name="password" class="input"
                   placeholder="Minimum 8 characters"
                   required minlength="8" autocomplete="new-password">
          </div>
          <div>
            <label>Confirm Password *</label>
            <input type="password" name="confirm" class="input"
                   placeholder="Repeat password"
                   required minlength="8" autocomplete="new-password">
          </div>
          <button type="submit" class="btn btn-gold w-full justify-center mt-2" style="padding:13px;">
            🚀 Create Admin Account
          </button>
        </form>
      </div>

      <p class="text-center text-subtle text-xs mt-5 leading-relaxed">
        Password is hashed with PBKDF2 (100,000 iterations) — never stored in plain text.
      </p>
    </div>
  </div>`, { title: 'Setup — KhataBook' })
}
