// src/pages/reset-password.ts
import { layout }     from './layout'
import { escapeHtml } from '../utils/security'

export function resetPasswordPage(token: string, error?: string): string {
  const isExpiredError = error?.includes('invalid or has expired')

  return layout(`
  <div class="min-h-screen flex items-center justify-center px-4"
       style="background:radial-gradient(ellipse at 30% 20%,rgba(201,168,76,.06) 0%,transparent 60%), #050b18;">
    <div class="w-full max-w-sm animate-up">

      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
             style="background:linear-gradient(135deg,#c9a84c,#8a6520);">
          <span class="text-3xl">🔐</span>
        </div>
        <h1 class="font-serif text-4xl text-gold">New Password</h1>
        <p class="text-subtle text-sm mt-1">KhataBook Admin</p>
      </div>

      <!-- Card -->
      <div class="card p-8">

        ${error
          ? `<div class="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
               ⚠️ ${escapeHtml(error)}
             </div>`
          : ''}

        ${isExpiredError
          ? `<div class="text-center">
               <p class="text-muted text-sm mb-5">Request a new reset link and try again.</p>
               <a href="/forgot-password" class="btn btn-gold btn-sm">📧 Request New Link</a>
             </div>`
          : `<p class="text-muted text-sm mb-6 text-center">
               Choose a new password with at least <strong class="text-gold">8 characters</strong>.
             </p>
             <form method="POST" action="/reset-password" class="space-y-4">
               <input type="hidden" name="token" value="${escapeHtml(token)}">
               <div>
                 <label>New Password</label>
                 <input type="password" name="password" class="input"
                        placeholder="Minimum 8 characters"
                        required minlength="8" autocomplete="new-password">
               </div>
               <div>
                 <label>Confirm Password</label>
                 <input type="password" name="confirm" class="input"
                        placeholder="Repeat new password"
                        required minlength="8" autocomplete="new-password">
               </div>
               <button type="submit" class="btn btn-gold w-full justify-center" style="padding:12px;">
                 🔐 Set New Password
               </button>
             </form>`
        }
      </div>

      <div class="mt-6 text-center">
        <a href="/login" class="text-subtle text-sm hover:text-gold transition-colors">← Back to Login</a>
      </div>
    </div>
  </div>`, { title: 'Reset Password' })
}
