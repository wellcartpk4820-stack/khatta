// src/pages/forgot-password.ts
import { layout }     from './layout'
import { escapeHtml } from '../utils/security'

export function forgotPasswordPage(error?: string, success?: string): string {
  return layout(`
  <div class="min-h-screen flex items-center justify-center px-4"
       style="background:radial-gradient(ellipse at 30% 20%,rgba(201,168,76,.06) 0%,transparent 60%), #050b18;">
    <div class="w-full max-w-sm animate-up">

      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
             style="background:linear-gradient(135deg,#c9a84c,#8a6520);">
          <span class="text-3xl">🔑</span>
        </div>
        <h1 class="font-serif text-4xl text-gold">Forgot Password</h1>
        <p class="text-subtle text-sm mt-1">KhataBook Admin</p>
      </div>

      <!-- Card -->
      <div class="card p-8">

        ${error
          ? `<div class="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
               ⚠️ ${escapeHtml(error)}
             </div>`
          : ''}

        ${success
          ? `<div class="mb-5 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
               ✅ ${escapeHtml(success)}
             </div>
             <div class="text-center mt-2">
               <a href="/login" class="btn btn-outline btn-sm">← Back to Login</a>
             </div>`
          : `<p class="text-muted text-sm mb-6 text-center leading-relaxed">
               Enter your admin email and we'll send you a password reset link valid for <strong class="text-gold">1 hour</strong>.
             </p>
             <form method="POST" action="/forgot-password" class="space-y-4">
               <div>
                 <label>Admin Email</label>
                 <input type="email" name="email" class="input"
                        placeholder="admin@yourdomain.com" required autocomplete="email">
               </div>
               <button type="submit" class="btn btn-gold w-full justify-center" style="padding:12px;">
                 📧 Send Reset Link
               </button>
             </form>`
        }
      </div>

      <div class="mt-6 text-center">
        <a href="/login" class="text-subtle text-sm hover:text-gold transition-colors">← Back to Login</a>
      </div>
    </div>
  </div>`, { title: 'Forgot Password' })
}
